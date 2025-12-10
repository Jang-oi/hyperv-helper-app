/**
 * 공통 타입 정의
 * Main process와 Renderer process에서 공유하는 타입들
 */

// ==================== IP 관련 타입 ====================
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

// ==================== PortProxy 관련 타입 ====================
export interface ProxyRule {
  listenAddress: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export interface PortProxyResult {
  success: boolean
  error?: string
  rules?: ProxyRule[]
  message?: string
}

// ==================== Hostname 관련 타입 ====================
export interface HostnameResult {
  success: boolean
  hostname?: string
  message?: string
  error?: string
}

// ==================== Bookmark 관련 타입 ====================
export interface BookmarkItem {
  id: string
  name: string
  url: string
}

// ==================== OTP 관련 타입 ====================
// OTP 계정 타입 (main process에서 사용)
export interface OTPAccount {
  id: string
  alias: string
  key: string // 보안상 민감 정보, store에 저장됩니다.
  code: string // 실시간 생성되어 클라이언트에 전달됩니다.
}

// ==================== Version 관련 타입 ====================
export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  prerelease: boolean
}

export interface VersionInfo {
  currentVersion: string
  latestVersion?: string
  isLatest: boolean
  releases: GitHubRelease[]
}

export interface VersionResult {
  success: boolean
  error?: string
  versionInfo?: VersionInfo
}
