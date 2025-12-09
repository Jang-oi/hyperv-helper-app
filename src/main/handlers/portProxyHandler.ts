import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * PortProxy 규칙 인터페이스
 */
export interface ProxyRule {
  id: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

/**
 * PortProxy 작업 결과 인터페이스
 */
export interface PortProxyResult {
  success: boolean
  error?: string
  rules?: ProxyRule[]
}

/**
 * PortProxy 관련 IPC 핸들러 등록
 */
export function registerPortProxyHandlers(): void {
  // 현재 등록된 모든 portproxy 규칙 조회
  ipcMain.handle('portproxy:getRules', async (): Promise<PortProxyResult> => {
    try {
      const command =
        'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; netsh interface portproxy show all"'

      const { stdout } = await execAsync(command, { encoding: 'utf8' })

      // netsh 출력 파싱
      const rules: ProxyRule[] = []
      const lines = stdout.split('\n')

      // 헤더 라인 이후의 데이터 라인만 처리
      let isDataSection = false
      for (const line of lines) {
        const trimmed = line.trim()

        // 데이터 섹션 시작 확인 (구분선 이후)
        if (trimmed.includes('---')) {
          isDataSection = true
          continue
        }

        // 데이터 섹션에서 유효한 규칙 파싱
        if (isDataSection && trimmed.length > 0) {
          const parts = trimmed.split(/\s+/)
          if (parts.length >= 4) {
            // 0.0.0.0을 *로 표시하거나 그대로 사용
            const listenAddress = parts[0] === '0.0.0.0' ? '*' : parts[0]
            rules.push({
              id: `${parts[1]}-${parts[2]}-${parts[3]}-${Date.now()}`, // 고유 ID 생성
              listenPort: parts[1],
              connectAddress: parts[2],
              connectPort: parts[3]
            })
          }
        }
      }

      return {
        success: true,
        rules
      }
    } catch (error) {
      return {
        success: false,
        error: 'PortProxy 규칙 조회에 실패했습니다.',
        rules: []
      }
    }
  })

  // 단일 portproxy 규칙 추가
  ipcMain.handle(
    'portproxy:addRule',
    async (
      _event,
      listenPort: string,
      connectAddress: string,
      connectPort: string
    ): Promise<PortProxyResult> => {
      try {
        // 입력 검증
        if (!listenPort || !connectAddress || !connectPort) {
          return {
            success: false,
            error: '모든 필드를 입력해야 합니다.'
          }
        }

        // 포트 번호 검증 (1-65535)
        const listenPortNum = parseInt(listenPort)
        const connectPortNum = parseInt(connectPort)
        if (
          isNaN(listenPortNum) ||
          isNaN(connectPortNum) ||
          listenPortNum < 1 ||
          listenPortNum > 65535 ||
          connectPortNum < 1 ||
          connectPortNum > 65535
        ) {
          return {
            success: false,
            error: '유효한 포트 번호를 입력해주세요 (1-65535).'
          }
        }

        // netsh 명령 실행
        const command = `netsh interface portproxy add v4tov4 listenport=${listenPort} listenaddress=0.0.0.0 connectport=${connectPort} connectaddress=${connectAddress}`

        await execAsync(command)

        return {
          success: true
        }
      } catch (error) {
        return {
          success: false,
          error: `PortProxy 규칙 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      }
    }
  )

  // 단일 portproxy 규칙 삭제
  ipcMain.handle(
    'portproxy:deleteRule',
    async (_event, listenPort: string): Promise<PortProxyResult> => {
      try {
        if (!listenPort) {
          return {
            success: false,
            error: '리슨 포트를 지정해야 합니다.'
          }
        }

        const command = `netsh interface portproxy delete v4tov4 listenport=${listenPort} listenaddress=0.0.0.0`

        await execAsync(command)

        return {
          success: true
        }
      } catch (error) {
        return {
          success: false,
          error: `PortProxy 규칙 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      }
    }
  )

  // 모든 portproxy 규칙 삭제
  ipcMain.handle('portproxy:deleteAll', async (): Promise<PortProxyResult> => {
    try {
      const command = 'netsh interface portproxy reset'

      await execAsync(command)

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: '모든 PortProxy 규칙 삭제에 실패했습니다.'
      }
    }
  })

  // 여러 규칙을 한번에 적용 (기존 규칙 전체 삭제 후 새로 추가)
  ipcMain.handle('portproxy:applyRules', async (_event, rules: ProxyRule[]): Promise<PortProxyResult> => {
    try {
      // 1. 기존 규칙 전체 삭제
      await execAsync('netsh interface portproxy reset')

      // 2. 새로운 규칙들 추가
      for (const rule of rules) {
        const command = `netsh interface portproxy add v4tov4 listenport=${rule.listenPort} listenaddress=0.0.0.0 connectport=${rule.connectPort} connectaddress=${rule.connectAddress}`
        await execAsync(command)
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: `PortProxy 규칙 적용에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })
}
