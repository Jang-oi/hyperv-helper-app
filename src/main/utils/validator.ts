/**
 * 입력 검증 유틸리티
 */
export class Validator {
  /**
   * 호스트네임 유효성 검증
   * - 1-15자
   * - 영문, 숫자, 하이픈만 허용
   * - 하이픈으로 시작/종료 불가
   */
  static isValidHostname(hostname: string): { valid: boolean; error?: string } {
    if (!hostname || hostname.trim().length === 0) {
      return { valid: false, error: '호스트네임을 입력해주세요.' }
    }

    const trimmed = hostname.trim()

    if (trimmed.length > 15) {
      return { valid: false, error: '호스트네임은 15자 이하여야 합니다.' }
    }

    if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
      return { valid: false, error: '영문, 숫자, 하이픈(-)만 사용 가능합니다.' }
    }

    if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
      return { valid: false, error: '하이픈(-)으로 시작하거나 끝날 수 없습니다.' }
    }

    return { valid: true }
  }

  /**
   * IP 주소 유효성 검증
   */
  static isValidIP(ip: string): { valid: boolean; error?: string } {
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/

    if (!ipPattern.test(ip)) {
      return { valid: false, error: '올바른 IP 주소 형식이 아닙니다.' }
    }

    const parts = ip.split('.')
    for (const part of parts) {
      const num = parseInt(part, 10)
      if (num < 0 || num > 255) {
        return { valid: false, error: 'IP 주소는 0-255 범위여야 합니다.' }
      }
    }

    return { valid: true }
  }

  /**
   * 포트 번호 유효성 검증
   */
  static isValidPort(port: number | string): { valid: boolean; error?: string } {
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port

    if (isNaN(portNum)) {
      return { valid: false, error: '올바른 포트 번호가 아닙니다.' }
    }

    if (portNum < 1 || portNum > 65535) {
      return { valid: false, error: '포트 번호는 1-65535 범위여야 합니다.' }
    }

    return { valid: true }
  }
}
