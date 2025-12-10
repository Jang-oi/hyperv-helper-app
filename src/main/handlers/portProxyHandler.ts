import { ipcMain } from 'electron'
import { execCommand } from '../utils/commandExecutor'

/**
 * PortProxy 규칙 인터페이스
 */
export interface ProxyRule {
  listenAddress: string
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
  message?: string
}

function parseNetshOutputToRules(stdout: string): ProxyRule[] {
  const rules: ProxyRule[] = []
  const lines = stdout.split('\n')

  // const lines = input.trim().split('\n');
  //
  // // "주소 포트 주소 포트" 데이터가 시작되는 위치를 찾기 위한 정규 표현식
  // const dataStartIndex = lines.findIndex((line) => line.startsWith('주소'));
  //
  // // 헤더 라인 이후 데이터 라인 추출
  // const dataLines = lines.slice(dataStartIndex + 1);
  // const filterLines = dataLines.filter((dataItem) => !dataItem.includes('----'));
  //
  // return filterLines
  //   .map((line, rowIndex) => {
  //     const parts = line.split(/\s+/).filter(Boolean);
  //     if (parts.length >= 4) {
  //       return {
  //         id: rowIndex.toString(),
  //         listenAddress: parts[0],
  //         listenPort: parts[1],
  //         connectAddress: parts[2],
  //         connectPort: parts[3],
  //       };
  //     }
  //     return null;
  //   })
  //   .filter((item): item is PortInfo => item !== null);
  for (const line of lines) {
    const trimmed = line.trim()

    // 데이터 섹션에서 유효한 규칙 파싱
    if (trimmed.length > 0) {
      // 공백을 기준으로 분리
      // netsh 출력: Listen on ipv4: ... Connect to ipv4: ...
      // Address Port Address Port 순서가 아닐 수 있으므로 netsh v4tov4 표준 출력 기준
      // 보통: * 8080  192.168.1.10  80
      // parts[0]: ListenAddr, parts[1]: ListenPort, parts[2]: ConnectAddr, parts[3]: ConnectPort
      const parts = trimmed.split(/\s+/)

      if (parts.length >= 4) {
        rules.push({
          listenAddress: parts[0],
          listenPort: parts[1],
          connectAddress: parts[2],
          connectPort: parts[3]
        })
      }
    }
  }
  return rules
}

/**
 * PortProxy 관련 IPC 핸들러 등록
 */
export function registerPortProxyHandlers(): void {
  // 현재 등록된 모든 portproxy 규칙 조회 (배열 반환)
  ipcMain.handle('portproxy:getRules', async (): Promise<PortProxyResult> => {
    try {
      const command = `netsh interface portproxy show all`
      const { stdout } = await execCommand(command)

      // 텍스트를 파싱하여 배열로 변환
      const rules = parseNetshOutputToRules(stdout)

      return {
        success: true,
        rules: rules
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
    'portproxy:insertRule',
    async (_event, listenPort: string, connectAddress: string, connectPort: string): Promise<PortProxyResult> => {
      try {
        if (!listenPort || !connectAddress || !connectPort) {
          return { success: false, error: '모든 필드를 입력해야 합니다.' }
        }

        const command = `netsh interface portproxy add v4tov4 listenport=${listenPort} connectport=${connectPort} connectaddress=${connectAddress}`
        await execCommand(command)

        return { success: true }
      } catch (error) {
        return {
          success: false,
          error: `PortProxy 규칙 추가에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        }
      }
    }
  )

  // 단일 portproxy 규칙 삭제
  ipcMain.handle('portproxy:deleteRule', async (_event, listenPort: string): Promise<PortProxyResult> => {
    try {
      if (!listenPort) {
        return { success: false, error: '리슨 포트를 지정해야 합니다.' }
      }

      const command = `netsh interface portproxy delete v4tov4 listenaddress=* listenport=${listenPort}`
      await execCommand(command)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `PortProxy 규칙 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })

  // 모든 portproxy 규칙 삭제
  ipcMain.handle('portproxy:deleteAll', async (): Promise<PortProxyResult> => {
    try {
      const command = 'netsh interface portproxy reset'
      await execCommand(command)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: '모든 PortProxy 규칙 삭제에 실패했습니다.'
      }
    }
  })

  // 여러 규칙을 한번에 적용 (일괄 등록 / DNS 재연결 / 텍스트 붙여넣기 처리)
  ipcMain.handle('portproxy:applyRules', async (_event, rulesText: string): Promise<PortProxyResult> => {
    try {
      const rules = parseNetshOutputToRules(rulesText)

      if (rules.length === 0) return { success: true, message: '적용할 규칙이 없습니다.' }

      let successCount = 0
      for (const rule of rules) {
        try {
          const command = `netsh interface portproxy add v4tov4 listenport=${rule.listenPort} listenaddress=${rule.listenAddress} connectport=${rule.connectPort} connectaddress=${rule.connectAddress}`
          await execCommand(command)
          successCount++
        } catch (e) {
          console.error(`Failed to apply rule for port ${rule.listenPort}`, e)
        }
      }

      return {
        success: true,
        message: `${successCount}개의 규칙이 성공적으로 적용되었습니다.`
      }
    } catch (error) {
      return {
        success: false,
        error: `PortProxy 규칙 일괄 적용에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })
}
