import { ipcMain } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { Validator } from '../utils/validator'

const execAsync = promisify(exec)

export interface NetworkAdapter {
  name: string
  index: number
  description: string
}

export interface IPConfig {
  ip: string
  subnet: string
  gateway: string
  dns1: string
  dns2: string
}

export interface IPResult {
  success: boolean
  message?: string
  error?: string
  adapters?: NetworkAdapter[]
  currentConfig?: IPConfig
}

/**
 * Prefix Length를 서브넷 마스크로 변환하는 헬퍼 함수
 */
function prefixToSubnet(prefix: number): string {
  const mask = []
  for (let i = 0; i < 4; i++) {
    const n = Math.min(prefix, 8)
    mask.push(256 - Math.pow(2, 8 - n))
    prefix -= n
  }
  return mask.join('.')
}

/**
 * IP 변경 관련 IPC 핸들러 등록
 */
export function registerIPHandlers(): void {
  // 네트워크 어댑터 목록 조회 (이더넷 또는 Ethernet으로 시작하는 어댑터 찾기)
  ipcMain.handle('ip:getAdapters', async (): Promise<IPResult> => {
    try {
      const command =
        'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-NetAdapter | Where-Object {$_.Name -like \'이더넷*\' -or $_.Name -like \'Ethernet*\'} | Select-Object Name, InterfaceIndex, InterfaceDescription | ConvertTo-Json"'

      const { stdout } = await execAsync(command, { encoding: 'utf8' })
      const adaptersData = JSON.parse(stdout.trim())

      // 단일 어댑터인 경우 배열로 변환
      const adapters = Array.isArray(adaptersData) ? adaptersData : [adaptersData]

      const result: NetworkAdapter[] = adapters.map((adapter) => ({
        name: adapter.Name,
        index: adapter.InterfaceIndex,
        description: adapter.InterfaceDescription
      }))

      return {
        success: true,
        adapters: result
      }
    } catch (error) {
      return {
        success: false,
        error: '네트워크 어댑터 조회에 실패했습니다.',
        adapters: []
      }
    }
  })

  // 현재 IP 설정 조회
  ipcMain.handle('ip:getCurrentConfig', async (_event, adapterName: string): Promise<IPResult> => {
    try {
      const command = `powershell -Command "Get-NetIPAddress -InterfaceAlias '${adapterName}' -AddressFamily IPv4 | Select-Object IPAddress, PrefixLength | ConvertTo-Json"`

      const { stdout } = await execAsync(command)
      const ipData = JSON.parse(stdout.trim())

      // 게이트웨이 조회
      const gatewayCommand = `powershell -Command "Get-NetRoute -InterfaceAlias '${adapterName}' -DestinationPrefix '0.0.0.0/0' | Select-Object NextHop | ConvertTo-Json"`
      const { stdout: gatewayStdout } = await execAsync(gatewayCommand)
      const gatewayData = JSON.parse(gatewayStdout.trim())

      // DNS 서버 조회
      const dnsCommand = `powershell -Command "Get-DnsClientServerAddress -InterfaceAlias '${adapterName}' -AddressFamily IPv4 | Select-Object ServerAddresses | ConvertTo-Json"`
      const { stdout: dnsStdout } = await execAsync(dnsCommand)
      const dnsData = JSON.parse(dnsStdout.trim())

      const currentConfig: IPConfig = {
        ip: ipData.IPAddress || '',
        subnet: ipData.PrefixLength ? prefixToSubnet(ipData.PrefixLength) : '255.255.255.0',
        gateway: gatewayData.NextHop || '',
        dns1: dnsData.ServerAddresses?.[0] || '',
        dns2: dnsData.ServerAddresses?.[1] || ''
      }

      return {
        success: true,
        currentConfig
      }
    } catch (error) {
      return {
        success: false,
        error: '현재 IP 설정 조회에 실패했습니다.'
      }
    }
  })

  // IP 설정 변경
  ipcMain.handle('ip:setConfig', async (_event, adapterName: string, config: IPConfig): Promise<IPResult> => {
    try {
      // IP 유효성 검사
      const ipValidation = Validator.isValidIP(config.ip)
      if (!ipValidation.valid) {
        return { success: false, error: ipValidation.error }
      }

      const gatewayValidation = Validator.isValidIP(config.gateway)
      if (!gatewayValidation.valid) {
        return { success: false, error: `게이트웨이: ${gatewayValidation.error}` }
      }

      const dns1Validation = Validator.isValidIP(config.dns1)
      if (!dns1Validation.valid) {
        return { success: false, error: `기본 DNS: ${dns1Validation.error}` }
      }

      if (config.dns2) {
        const dns2Validation = Validator.isValidIP(config.dns2)
        if (!dns2Validation.valid) {
          return { success: false, error: `보조 DNS: ${dns2Validation.error}` }
        }
      }

      // 기존 IP 제거 후 새 IP 설정
      try {
        await execAsync(
          `powershell -Command "Remove-NetIPAddress -InterfaceAlias '${adapterName}' -Confirm:$false -ErrorAction SilentlyContinue"`
        )
        await execAsync(
          `powershell -Command "Remove-NetRoute -InterfaceAlias '${adapterName}' -DestinationPrefix '0.0.0.0/0' -Confirm:$false -ErrorAction SilentlyContinue"`
        )
      } catch {
        // 기존 설정이 없을 수 있으므로 에러 무시
      }

      // IP 주소 설정
      const ipCommand = `powershell -Command "New-NetIPAddress -InterfaceAlias '${adapterName}' -IPAddress '${config.ip}' -PrefixLength 24 -DefaultGateway '${config.gateway}' -ErrorAction Stop"`
      await execAsync(ipCommand)

      // DNS 서버 설정
      const dnsServers = config.dns2 ? `'${config.dns1}','${config.dns2}'` : `'${config.dns1}'`
      const dnsCommand = `powershell -Command "Set-DnsClientServerAddress -InterfaceAlias '${adapterName}' -ServerAddresses ${dnsServers}"`
      await execAsync(dnsCommand)

      return {
        success: true,
        message: 'IP 설정이 성공적으로 변경되었습니다.'
      }
    } catch (error: any) {
      return {
        success: false,
        error: `IP 설정 변경 실패: ${error.message || '알 수 없는 오류'}`
      }
    }
  })

}
