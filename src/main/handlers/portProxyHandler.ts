import { ipcMain } from 'electron'
import type { PortProxyResult, ProxyRule } from '../../shared/types'
import { execCommand } from '../utils/commandExecutor'

function parseNetshOutputToRules(stdout: string): ProxyRule[] {
  const rules: ProxyRule[] = []
  const lines = stdout.split('\n')

  // 헤더 및 구분선에 포함될 수 있는 키워드들
  const headerKeywords = ['ipv4', '주소', '포트', 'Address', 'Port', 'Listen', 'Connect', '수신', '대기', '연결']

  for (const line of lines) {
    const trimmed = line.trim()

    // 빈 줄 스킵
    if (trimmed.length === 0) continue

    // 구분선(---) 스킵
    if (trimmed.includes('---')) continue

    // 공백을 기준으로 분리
    const parts = trimmed.split(/\s+/).filter(Boolean)

    // 최소 4개의 필드가 필요 (listenAddress, listenPort, connectAddress, connectPort)
    if (parts.length < 4) continue

    // 헤더 키워드가 포함된 줄 스킵
    const hasHeaderKeyword = parts.some((part) => headerKeywords.some((keyword) => part.toLowerCase().includes(keyword.toLowerCase())))
    if (hasHeaderKeyword) continue

    // 포트 번호가 실제 숫자인지 확인 (parts[1]과 parts[3]이 포트)
    const listenPort = parts[1]
    const connectPort = parts[3]
    if (!/^\d+$/.test(listenPort) || !/^\d+$/.test(connectPort)) continue

    // listenAddress 검증 (*, 또는 IP 주소 형식)
    const listenAddress = parts[0]
    if (listenAddress !== '*' && !/^\d+\./.test(listenAddress)) continue

    // connectAddress 검증 (숫자로 시작하는 IP 또는 호스트명)
    const connectAddress = parts[2]
    if (!/^[\d\w]/.test(connectAddress)) continue

    // 유효한 규칙 추가
    rules.push({
      listenAddress,
      listenPort,
      connectAddress,
      connectPort
    })
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
