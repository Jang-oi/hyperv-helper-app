// =========================================================
// index.d.ts (필수 전역 API 타입 선언 파일)
// =========================================================

import { ElectronAPI } from '@electron-toolkit/preload'

// Hostname 관련 타입
interface HostnameResult {
  success: boolean
  hostname?: string
  message?: string
  error?: string
}

// IP 관련 타입 (생략)
interface IPResult {
  success: boolean
  message?: string
  error?: string
  adapters?: any[]
  currentConfig?: any
}

// 💡 OTP 계정 타입
interface OTPAccount {
  id: string
  alias: string
  key: string
  code: string
}

// 💡 Bookmark API
interface BookmarkAPI {
  add: (stage: string, name: string, url: string) => Promise<any>
  get: (stage: string) => Promise<any>
}

// 💡 OTP API
interface OTPAPI {
  getAccounts: () => Promise<{ success: boolean; accounts?: OTPAccount[]; error?: string }>
  addAccount: (alias: string, key: string) => Promise<{ success: boolean; account?: OTPAccount; error?: string }>
  deleteAccount: (id: string) => Promise<{ success: boolean; error?: string }>
  getRefreshTime: () => Promise<{ success: boolean; timeLeft?: number }>
}

// Notepad API
interface NotepadAPI {
  load: (noteId: string) => Promise<string>
  save: (noteId: string, content: string) => Promise<boolean>
  loadAll: () => Promise<Record<string, string>>
}

// PortProxy 관련 타입
interface ProxyRule {
  listenAddress: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export interface PortProxyResult {
  success: boolean
  error?: string
  rules?: ProxyRule[] // 배열 형태로 복구
  message?: string
}

interface PortProxyAPI {
  getRules: () => Promise<PortProxyResult>
  insertRule: (listenPort: string, connectAddress: string, connectPort: string) => Promise<PortProxyResult>
  deleteRule: (listenPort: string) => Promise<PortProxyResult>
  deleteAll: () => Promise<PortProxyResult>
  applyRules: (pasteText: string) => Promise<PortProxyResult>
}

// Hostname, IP, System 등 나머지 API 인터페이스 (이전 내용과 동일)
interface HostnameAPI {
  get: () => Promise<HostnameResult>
  set: (newHostname: string) => Promise<HostnameResult>
}

interface IPAPI {
  getAdapters: () => Promise<IPResult>
  getCurrentConfig: (adapterIndex: number) => Promise<IPResult>
  setConfig: (adapterIndex: number, config: any) => Promise<IPResult>
}

interface SystemAPI {
  restart: () => Promise<HostnameResult>
}

// 💡 Version 관련 타입
interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
  prerelease: boolean
}

interface VersionInfo {
  currentVersion: string
  latestVersion?: string
  isLatest: boolean
  releases: GitHubRelease[]
}

interface VersionResult {
  success: boolean
  error?: string
  versionInfo?: VersionInfo
}

interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes?: string
}

interface UpdateProgressInfo {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

interface VersionAPI {
  getInfo: () => Promise<VersionResult>
  checkForUpdates: () => Promise<{ success: boolean; updateAvailable: boolean; updateInfo?: UpdateInfo; error?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  quitAndInstall: () => void
  onUpdateAvailable: (callback: (info: UpdateInfo) => void) => () => void
  onUpdateNotAvailable: (callback: () => void) => () => void
  onDownloadProgress: (callback: (progressInfo: UpdateProgressInfo) => void) => () => void
  onUpdateDownloaded: (callback: () => void) => () => void
  onUpdateError: (callback: (error: string) => void) => () => void
}

// 전체 API 인터페이스 (모든 핸들러 포함)
interface API {
  notepad: NotepadAPI
  hostname: HostnameAPI
  ip: IPAPI
  system: SystemAPI
  bookmark: BookmarkAPI
  otp: OTPAPI
  portproxy: PortProxyAPI
  version: VersionAPI
}

// 전역 window 객체에 api 속성을 선언
declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
