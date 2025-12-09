import { registerNotepadHandlers } from './notepadHandler'
import { registerHostnameHandlers } from './hostnameHandler'
import { registerIPHandlers } from './ipHandler'

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

  // 향후 추가될 핸들러들
  // registerPortProxyHandlers()
  // registerBookmarksHandlers(store)
  // registerOTPHandlers(store)
}
