import { registerBookmarksHandlers } from './bookmarkHandler'
import { registerHostnameHandlers } from './hostnameHandler'
import { registerIPHandlers } from './ipHandler'
import { registerNotepadHandlers } from './notepadHandler'
import { registerOTPHandlers } from './otpHandler'
import { registerPortProxyHandlers } from './portProxyHandler'
import { registerSystemHandlers } from './systemHandler'
import { registerVersionHandlers } from './versionHandler'

/**
 * 모든 IPC 핸들러 등록
 * 확장성을 위해 도메인별로 핸들러를 분리하여 관리
 */
export function registerAllHandlers(store: any): void {
  // Notepad 핸들러
  registerNotepadHandlers(store)

  // Hostname 핸들러
  registerHostnameHandlers()

  // IP 핸들러
  registerIPHandlers()

  // 북마크 핸들러
  registerBookmarksHandlers()

  // OTP 핸들러
  registerOTPHandlers(store)

  // PortProxy 핸들러
  registerPortProxyHandlers()

  // System 핸들러
  registerSystemHandlers(store)

  // Version 핸들러
  registerVersionHandlers()
}
