// ipHandler.ts 파일

import { ipcMain } from 'electron'
import type { IPConfig, IPResult, NetworkAdapter } from '../../shared/types'
import { execCommand } from '../utils/commandExecutor'
import { Validator } from '../utils/validator'

/**
 * ipconfig /all 출력을 파싱하여 어댑터별 정보를 추출
 */
interface ParsedAdapter {
  name: string
  ipv4?: string
  subnet?: string
  gateway?: string
  dns: string[]
}

function parseIpconfigAll(output: string): ParsedAdapter[] {
  const adapters: ParsedAdapter[] = []
  const lines = output.split('\n')

  let currentAdapter: ParsedAdapter | null = null
  let isDnsMultiline = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 어댑터 시작 감지 (더 포괄적인 패턴)
    // "이더넷 어댑터", "무선 LAN 어댑터", "Ethernet adapter", "Wireless LAN adapter" 등
    const adapterMatch = line.match(/^(?:이더넷|무선 LAN|Ethernet|Wireless LAN)\s*어댑터\s+(.+):/)
    if (adapterMatch) {
      if (currentAdapter && currentAdapter.ipv4) {
        adapters.push(currentAdapter)
      }
      currentAdapter = {
        name: adapterMatch[1].trim().replace(/:$/, ''),
        dns: []
      }
      isDnsMultiline = false
      continue
    }

    if (!currentAdapter) continue

    // IPv4 주소
    const ipv4Match = line.match(/IPv4 주소[\s.]*:\s*(.+?)(?:\(|$)/)
    if (ipv4Match) {
      currentAdapter.ipv4 = ipv4Match[1].trim()
      continue
    }

    // 서브넷 마스크
    const subnetMatch = line.match(/서브넷 마스크[\s.]*:\s*(.+)/)
    if (subnetMatch) {
      currentAdapter.subnet = subnetMatch[1].trim()
      continue
    }

    // 기본 게이트웨이
    const gatewayMatch = line.match(/기본 게이트웨이[\s.]*:\s*(.+)/)
    if (gatewayMatch) {
      const gateway = gatewayMatch[1].trim()
      if (gateway && gateway !== '') {
        currentAdapter.gateway = gateway
      }
      continue
    }

    // DNS 서버 (첫 줄)
    const dnsMatch = line.match(/DNS 서버[\s.]*:\s*(.+)/)
    if (dnsMatch) {
      const dns = dnsMatch[1].trim()
      if (dns && dns !== '') {
        currentAdapter.dns.push(dns)
        isDnsMultiline = true
      }
      continue
    }

    // DNS 서버 (추가 줄들 - 공백으로 시작하고 IP 주소 패턴)
    if (isDnsMultiline && line.match(/^\s+\d+\.\d+\.\d+\.\d+/)) {
      const additionalDns = line.trim()
      if (additionalDns && additionalDns !== '') {
        currentAdapter.dns.push(additionalDns)
        continue
      }
    }

    // 새로운 필드가 시작되면 DNS 멀티라인 종료
    if (line.match(/^\s+[가-힣A-Za-z]/)) {
      isDnsMultiline = false
    }
  }

  // 마지막 어댑터 추가
  if (currentAdapter && currentAdapter.ipv4) {
    adapters.push(currentAdapter)
  }

  return adapters
}

/**
 * Get-NetAdapter를 사용하여 어댑터 이름 → Index 매핑
 */
async function getAdapterIndexMapping(): Promise<Map<string, number>> {
  const command =
    'powershell -Command "Get-NetAdapter | Select-Object Name, InterfaceIndex | ConvertTo-Json"'

  try {
    const { stdout } = await execCommand(command)
    const data = JSON.parse(stdout.trim())
    const adapters = Array.isArray(data) ? data : [data]

    const mapping = new Map<string, number>()
    adapters.forEach((adapter: any) => {
      if (adapter.Name && adapter.InterfaceIndex) {
        mapping.set(adapter.Name, adapter.InterfaceIndex)
      }
    })

    return mapping
  } catch (error) {
    console.error('Failed to get adapter index mapping:', error)
    return new Map()
  }
}

/**
 * IP 변경 관련 IPC 핸들러 등록
 */
export function registerIPHandlers(): void {
  // 네트워크 어댑터 목록 조회 (ipconfig /all 사용)
  ipcMain.handle('ip:getAdapters', async (): Promise<IPResult> => {
    try {
      // ipconfig /all 실행
      const { stdout } = await execCommand('ipconfig /all')
      const parsedAdapters = parseIpconfigAll(stdout)

      // IPv4 주소가 있는 어댑터만 필터링
      const validAdapters = parsedAdapters.filter((a) => a.ipv4)

      if (validAdapters.length === 0) {
        return {
          success: false,
          error: 'IPv4 주소가 할당된 어댑터를 찾을 수 없습니다.',
          adapters: []
        }
      }

      // Index 매핑 가져오기
      const indexMapping = await getAdapterIndexMapping()

      // 최종 어댑터 목록 생성
      const result: NetworkAdapter[] = validAdapters.map((adapter) => ({
        name: adapter.name,
        index: indexMapping.get(adapter.name) || 0,
        description: adapter.name
      }))

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

  // 현재 IP 설정 조회 (ipconfig /all 사용)
  ipcMain.handle('ip:getCurrentConfig', async (_event, adapterIndex: number): Promise<IPResult> => {
    try {
      // Index로 어댑터 이름 찾기
      const indexMapping = await getAdapterIndexMapping()
      let adapterName: string | undefined

      for (const [name, index] of indexMapping.entries()) {
        if (index === adapterIndex) {
          adapterName = name
          break
        }
      }

      if (!adapterName) {
        return {
          success: false,
          error: '어댑터를 찾을 수 없습니다.'
        }
      }

      // ipconfig /all 실행 및 파싱
      const { stdout } = await execCommand('ipconfig /all')
      const parsedAdapters = parseIpconfigAll(stdout)

      // 해당 어댑터 찾기
      const adapter = parsedAdapters.find((a) => a.name === adapterName)

      if (!adapter) {
        return {
          success: true,
          currentConfig: {
            ip: '',
            subnet: '255.255.255.0',
            gateway: '',
            dns1: '',
            dns2: ''
          }
        }
      }

      // 최종 설정 객체 생성
      const currentConfig: IPConfig = {
        ip: adapter.ipv4 || '',
        subnet: adapter.subnet || '255.255.255.0',
        gateway: adapter.gateway || '',
        dns1: adapter.dns[0] || '',
        dns2: adapter.dns[1] || ''
      }

      return {
        success: true,
        currentConfig
      }
    } catch (error) {
      console.error('Failed to get current config:', error)
      return {
        success: true,
        currentConfig: {
          ip: '',
          subnet: '255.255.255.0',
          gateway: '',
          dns1: '',
          dns2: ''
        }
      }
    }
  })

  // IP 설정 변경 (netsh 사용)
  ipcMain.handle('ip:setConfig', async (_event, adapterIndex: number, config: IPConfig): Promise<IPResult> => {
    try {
      // 유효성 검사
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

      // Index로 어댑터 이름 찾기
      const indexMapping = await getAdapterIndexMapping()
      let adapterName: string | undefined

      for (const [name, index] of indexMapping.entries()) {
        if (index === adapterIndex) {
          adapterName = name
          break
        }
      }

      if (!adapterName) {
        return {
          success: false,
          error: '어댑터를 찾을 수 없습니다.'
        }
      }

      // netsh를 사용하여 IP 설정
      // IP 주소 및 게이트웨이 설정
      const ipCommand = `netsh interface ip set address name="${adapterName}" static ${config.ip} ${config.subnet} ${config.gateway}`
      await execCommand(ipCommand)

      // DNS 서버 설정
      const dns1Command = `netsh interface ip set dns name="${adapterName}" static ${config.dns1}`
      await execCommand(dns1Command)

      if (config.dns2) {
        const dns2Command = `netsh interface ip add dns name="${adapterName}" ${config.dns2} index=2`
        await execCommand(dns2Command)
      }

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
