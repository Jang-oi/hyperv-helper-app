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
    getCurrentConfig: (adapterName: string) => ipcRenderer.invoke('ip:getCurrentConfig', adapterName),
    setConfig: (adapterName: string, config: any) => ipcRenderer.invoke('ip:setConfig', adapterName, config),
    setDHCP: (adapterName: string) => ipcRenderer.invoke('ip:setDHCP', adapterName)
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
