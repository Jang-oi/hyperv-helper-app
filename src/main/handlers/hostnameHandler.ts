import os from 'os'
import { ipcMain } from 'electron'
import type { HostnameResult } from '../../shared/types'
import { execCommand } from '../utils/commandExecutor'
import { Validator } from '../utils/validator'

/**
 * Hostname IPC Handler
 * 호스트네임 조회 및 변경 관리
 */
export function registerHostnameHandlers(): void {
  // 현재 호스트네임 조회
  ipcMain.handle('hostname:get', async (): Promise<HostnameResult> => {
    try {
      const hostname = os.hostname()
      return {
        success: true,
        hostname
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // 호스트네임 변경 (Windows 전용)
  ipcMain.handle('hostname:set', async (_event, newHostname: string): Promise<HostnameResult> => {
    try {
      // 입력 검증
      const validation = Validator.isValidHostname(newHostname)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Windows에서만 동작
      if (process.platform !== 'win32') {
        return {
          success: false,
          error: 'Windows 시스템에서만 사용 가능합니다.'
        }
      }

      // PowerShell 명령어로 호스트네임 변경
      const command = `powershell -Command "Rename-Computer -NewName '${newHostname}' -Force"`

      await execCommand(command)

      return {
        success: true,
        hostname: newHostname,
        message: '호스트네임이 변경되었습니다. 재시작 후 적용됩니다.'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })

  // 시스템 재시작
  ipcMain.handle('system:restart', async (): Promise<HostnameResult> => {
    try {
      if (process.platform !== 'win32') {
        return {
          success: false,
          error: 'Windows 시스템에서만 사용 가능합니다.'
        }
      }

      // 재시작 확인 후 실행
      const command = 'shutdown /r /t 3'
      await execCommand(command)

      return {
        success: true,
        message: '3초 후 시스템이 재시작됩니다.'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })
}
