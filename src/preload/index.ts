import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  notepad: {
    load: (noteId: string): Promise<string> => ipcRenderer.invoke('notepad:load', noteId),
    save: (noteId: string, content: string): Promise<boolean> => ipcRenderer.invoke('notepad:save', noteId, content),
    loadAll: (): Promise<Record<string, string>> => ipcRenderer.invoke('notepad:loadAll')
  },
  hostname: {
    get: () => ipcRenderer.invoke('hostname:get'),
    set: (newHostname: string) => ipcRenderer.invoke('hostname:set', newHostname)
  },
  ip: {
    getAdapters: () => ipcRenderer.invoke('ip:getAdapters'),
    getCurrentConfig: (adapterIndex: number) => ipcRenderer.invoke('ip:getCurrentConfig', adapterIndex),
    setConfig: (adapterIndex: number, config: any) => ipcRenderer.invoke('ip:setConfig', adapterIndex, config)
  },
  // 💡 북마크 API 추가
  bookmark: {
    add: (stage: string, name: string, url: string) => ipcRenderer.invoke('bookmark:add', stage, name, url),
    addAuto: (stage: string, ip: string) => ipcRenderer.invoke('bookmark:addAuto', stage, ip),
    get: (stage: string) => ipcRenderer.invoke('bookmark:get', stage),
  },
  // 💡 OTP API 추가
  otp: {
    getAccounts: () => ipcRenderer.invoke('otp:getAccounts'),
    addAccount: (alias: string, key: string) => ipcRenderer.invoke('otp:addAccount', alias, key),
    deleteAccount: (id: string) => ipcRenderer.invoke('otp:deleteAccount', id),
    getRefreshTime: () => ipcRenderer.invoke('otp:getRefreshTime'),
  },
  system: {
    restart: () => ipcRenderer.invoke('system:restart')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
