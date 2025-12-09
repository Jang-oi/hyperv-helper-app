import { ipcMain } from 'electron'

/**
 * Notepad IPC Handler
 * 메모장 데이터 저장/로드 관리
 */
export function registerNotepadHandlers(store: any): void {
  // 특정 메모 로드
  ipcMain.handle('notepad:load', (_event, noteId: string) => {
    return store.get(`notepad.${noteId}`, '')
  })

  // 메모 저장
  ipcMain.handle('notepad:save', (_event, noteId: string, content: string) => {
    store.set(`notepad.${noteId}`, content)
    return true
  })

  // 모든 메모 로드
  ipcMain.handle('notepad:loadAll', () => {
    const notes: Record<string, string> = {}
    for (let i = 1; i <= 5; i++) {
      const noteId = `note-${i}`
      notes[noteId] = store.get(`notepad.${noteId}`, '') as string
    }
    return notes
  })
}
