// ipHandler.ts 파일

import { exec } from 'child_process'
import { promisify } from 'util'
import { ipcMain } from 'electron'
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
 * TS2345 오류 해결을 위해 mask 배열 타입을 number[]로 명시
 */
function prefixToSubnet(prefix: number): string {
  const mask: number[] = [] // number[]로 타입 명시
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
  // 네트워크 어댑터 목록 조회 (IPv4 주소를 가진 어댑터만)
  ipcMain.handle('ip:getAdapters', async (): Promise<IPResult> => {
    try {
      // Get-NetIPAddress를 사용하여 IPv4 주소를 가진 어댑터 정보(Alias, Index)를 가져옴
      const command =
        'powershell -NoProfile -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, InterfaceIndex, IPAddress | ConvertTo-Json"'

      const { stdout } = await execAsync(command, { encoding: 'utf8' })
      const adaptersData = JSON.parse(stdout.trim())

      // JSON이 단일 객체일 경우 배열로 변환
      const rawAdapters = Array.isArray(adaptersData) ? adaptersData : [adaptersData].filter((a) => a.InterfaceAlias)

      // Alias를 name으로, Index를 index로 매핑 (중복 Index 제거)
      const uniqueAdapters = new Map<number, NetworkAdapter>()
      rawAdapters.forEach((adapter: any) => {
        // 이미 IP 주소를 가지고 있는 어댑터만 목록에 표시
        if (adapter.IPAddress && !uniqueAdapters.has(adapter.InterfaceIndex)) {
          uniqueAdapters.set(adapter.InterfaceIndex, {
            // UI 렌더링을 위해 Alias 사용
            name: adapter.InterfaceAlias,
            index: adapter.InterfaceIndex,
            // description 필드는 Get-NetIPAddress에서 가져오기 어려우므로 비워둡니다.
            description: adapter.InterfaceAlias
          })
        }
      })

      const result: NetworkAdapter[] = Array.from(uniqueAdapters.values())

      if (result.length === 0) {
        return {
          success: false,
          error: 'IPv4 주소가 할당된 어댑터를 찾을 수 없습니다.',
          adapters: []
        }
      }

      return {
        success: true,
        adapters: result
      }
    } catch (error) {
      console.error('Adapter loading failed:', error)
      return {
        success: false,
        error: '네트워크 어댑터 조회에 실패했습니다.',
        adapters: []
      }
    }
  })

  // 현재 IP 설정 조회 (오류 발생 시 빈 값으로 처리하도록 try/catch 블록 추가)
  ipcMain.handle('ip:getCurrentConfig', async (_event, adapterIndex: number): Promise<IPResult> => {
    // 기본값 초기화
    let ipRawData: any = {}
    let actualGateway = ''
    let dnsData: any = { ServerAddresses: [] }

    // 1. IP 주소 조회 (오류 시에도 다음 로직이 실행되도록 개별 try/catch 사용)
    try {
      const ipCommand = `powershell -Command "Get-NetIPAddress -InterfaceIndex ${adapterIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object IPAddress, PrefixLength | ConvertTo-Json"`
      const { stdout } = await execAsync(ipCommand)
      const ipData = stdout.trim() ? JSON.parse(stdout.trim()) : []

      // IP 주소 데이터가 배열일 경우 (여러 개 할당된 경우 첫 번째 사용)
      ipRawData = Array.isArray(ipData) ? ipData.find((d) => d.IPAddress) : ipData
    } catch (e) {
      console.log(`[Index ${adapterIndex}] IP lookup failed, proceeding with empty data.`)
    }

    // 2. 게이트웨이 조회 (오류 시에도 다음 로직이 실행되도록 개별 try/catch 사용)
    try {
      const gatewayCommand = `powershell -Command "Get-NetRoute -InterfaceIndex ${adapterIndex} -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Select-Object NextHop | ConvertTo-Json"`
      const { stdout: gatewayStdout } = await execAsync(gatewayCommand)

      // 출력된 JSON이 비어있을 수 있음
      const gatewayRawData = gatewayStdout.trim() ? JSON.parse(gatewayStdout.trim()) : []

      const gatewayData = Array.isArray(gatewayRawData) ? gatewayRawData : [gatewayRawData]

      // NextHop이 0.0.0.0이 아닌 게이트웨이를 찾습니다.
      actualGateway = gatewayData.find((route: any) => route.NextHop && route.NextHop !== '0.0.0.0')?.NextHop || ''
    } catch (e) {
      console.log(`[Index ${adapterIndex}] Gateway lookup failed, proceeding with empty data.`)
    }

    // 3. DNS 서버 조회 (오류 시에도 다음 로직이 실행되도록 개별 try/catch 사용)
    try {
      const dnsCommand = `powershell -Command "Get-DnsClientServerAddress -InterfaceIndex ${adapterIndex} -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object ServerAddresses | ConvertTo-Json"`
      const { stdout: dnsStdout } = await execAsync(dnsCommand)

      // 출력된 JSON이 비어있을 수 있음
      dnsData = dnsStdout.trim() ? JSON.parse(dnsStdout.trim()) : { ServerAddresses: [] }
    } catch (e) {
      console.log(`[Index ${adapterIndex}] DNS lookup failed, proceeding with empty data.`)
    }

    // 최종 설정 객체 생성
    const currentConfig: IPConfig = {
      ip: ipRawData?.IPAddress || '',
      subnet: ipRawData?.PrefixLength ? prefixToSubnet(ipRawData.PrefixLength) : '255.255.255.0',
      gateway: actualGateway,
      dns1: dnsData.ServerAddresses?.[0] || '',
      dns2: dnsData.ServerAddresses?.[1] || ''
    }

    // IP 주소가 없어도 (DHCP 상태 또는 미할당 상태여도) 성공적으로 현재 설정을 반환
    return {
      success: true,
      currentConfig
    }
  })

  // IP 설정 변경 (InterfaceAlias 대신 InterfaceIndex 사용)
  ipcMain.handle('ip:setConfig', async (_event, adapterIndex: number, config: IPConfig): Promise<IPResult> => {
    try {
      // ... (유효성 검사 로직은 변경 없음)
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
      // ... (유효성 검사 로직은 변경 없음)

      // 기존 IP 제거 후 새 IP 설정
      try {
        await execAsync(
          `powershell -Command "Remove-NetIPAddress -InterfaceIndex ${adapterIndex} -Confirm:$false -ErrorAction SilentlyContinue"`
        )
        await execAsync(
          `powershell -Command "Remove-NetRoute -InterfaceIndex ${adapterIndex} -DestinationPrefix '0.0.0.0/0' -Confirm:$false -ErrorAction SilentlyContinue"`
        )
      } catch {
        // 기존 설정이 없을 수 있으므로 에러 무시
      }

      // IP 주소 설정
      const ipCommand = `powershell -Command "New-NetIPAddress -InterfaceIndex ${adapterIndex} -IPAddress '${config.ip}' -PrefixLength 24 -DefaultGateway '${config.gateway}' -ErrorAction Stop"`
      await execAsync(ipCommand)

      // DNS 서버 설정
      const dnsServers = config.dns2 ? `'${config.dns1}','${config.dns2}'` : `'${config.dns1}'`
      const dnsCommand = `powershell -Command "Set-DnsClientServerAddress -InterfaceIndex ${adapterIndex} -ServerAddresses ${dnsServers}"`
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
