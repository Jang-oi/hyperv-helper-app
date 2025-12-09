import { ipcMain } from 'electron'

const STORE_KEY_PREFIX = 'notepad'

/**
 * Notepad IPC Handler
 * 메모장 데이터 저장/로드 관리
 */
export function registerNotepadHandlers(store: any): void {
  // 특정 메모 로드
  ipcMain.handle('notepad:load', (_event, noteId: string) => {
    // 상수를 사용하여 키 구성
    return store.get(`${STORE_KEY_PREFIX}.${noteId}`, '')
  })

  // 메모 저장
  ipcMain.handle('notepad:save', (_event, noteId: string, content: string) => {
    // 상수를 사용하여 키 구성
    store.set(`${STORE_KEY_PREFIX}.${noteId}`, content)
    return true
  })

  // 모든 메모 로드
  ipcMain.handle('notepad:loadAll', () => {
    const notes: Record<string, string> = {}
    for (let i = 1; i <= 5; i++) {
      const noteId = `note-${i}`
      // 상수를 사용하여 키 구성
      notes[noteId] = store.get(`${STORE_KEY_PREFIX}.${noteId}`, '') as string
    }
    return notes
  })
}
