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
    setConfig: (adapterName: string, config: any) => ipcRenderer.invoke('ip:setConfig', adapterName, config)
  },
  // 💡 북마크 API 추가
  bookmark: {
    add: (stage: string, name: string, url: string) => ipcRenderer.invoke('bookmark:add', stage, name, url),
    addAuto: (stage: string, ip: string) => ipcRenderer.invoke('bookmark:addAuto', stage, ip),
    get: (stage: string) => ipcRenderer.invoke('bookmark:get', stage)
  },
  // 💡 OTP API 추가
  otp: {
    getAccounts: () => ipcRenderer.invoke('otp:getAccounts'),
    addAccount: (alias: string, key: string) => ipcRenderer.invoke('otp:addAccount', alias, key),
    deleteAccount: (id: string) => ipcRenderer.invoke('otp:deleteAccount', id),
    getRefreshTime: () => ipcRenderer.invoke('otp:getRefreshTime')
  },
  // 💡 PortProxy API 추가
  portproxy: {
    getRules: () => ipcRenderer.invoke('portproxy:getRules'),
    insertRule: (listenPort: string, connectAddress: string, connectPort: string) =>
      ipcRenderer.invoke('portproxy:insertRule', listenPort, connectAddress, connectPort),
    deleteRule: (listenPort: string) => ipcRenderer.invoke('portproxy:deleteRule', listenPort),
    deleteAll: () => ipcRenderer.invoke('portproxy:deleteAll'),
    applyRules: (rules: any[]) => ipcRenderer.invoke('portproxy:applyRules', rules)
  },
  system: {
    restart: () => ipcRenderer.invoke('system:restart'),
    getShutdownSchedule: () => ipcRenderer.invoke('system:getShutdownSchedule'),
    setShutdownSchedule: (schedule: any) => ipcRenderer.invoke('system:setShutdownSchedule', schedule)
  },
  // 💡 Version API 추가
  version: {
    getInfo: () => ipcRenderer.invoke('version:getInfo'),
    checkForUpdates: () => ipcRenderer.invoke('version:checkForUpdates'),
    downloadUpdate: () => ipcRenderer.invoke('version:downloadUpdate'),
    quitAndInstall: () => ipcRenderer.invoke('version:quitAndInstall'),

    // 이벤트 리스너
    onUpdateAvailable: (callback: (info: any) => void) => {
      const listener = (_event: any, info: any) => callback(info)
      ipcRenderer.on('update-available', listener)
      return () => ipcRenderer.removeListener('update-available', listener)
    },
    onUpdateNotAvailable: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('update-not-available', listener)
      return () => ipcRenderer.removeListener('update-not-available', listener)
    },
    onDownloadProgress: (callback: (progressInfo: any) => void) => {
      const listener = (_event: any, progressInfo: any) => callback(progressInfo)
      ipcRenderer.on('download-progress', listener)
      return () => ipcRenderer.removeListener('download-progress', listener)
    },
    onUpdateDownloaded: (callback: () => void) => {
      const listener = () => callback()
      ipcRenderer.on('update-downloaded', listener)
      return () => ipcRenderer.removeListener('update-downloaded', listener)
    },
    onUpdateError: (callback: (error: string) => void) => {
      const listener = (_event: any, error: string) => callback(error)
      ipcRenderer.on('update-error', listener)
      return () => ipcRenderer.removeListener('update-error', listener)
    }
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
