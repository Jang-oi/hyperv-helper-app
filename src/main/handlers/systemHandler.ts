// systemHandler.ts 파일

import { ipcMain } from 'electron'
import type { ShutdownSchedule, SystemResult } from '../../shared/types'
import { execCommand } from '../utils/commandExecutor'

const SCHEDULE_KEY = 'shutdownSchedule'
const TASK_NAME = 'HyperVHelperShutdown'

/**
 * Windows 작업 스케줄러를 사용한 자동 종료 스케줄 관리
 */

/**
 * 시스템 관련 IPC 핸들러 등록
 * @param store Electron Store 인스턴스
 */
export function registerSystemHandlers(store: any): void {
  // 종료 스케줄 조회
  ipcMain.handle('system:getShutdownSchedule', async (): Promise<SystemResult> => {
    try {
      const schedule = store.get(SCHEDULE_KEY, {
        enabled: false,
        hour: 23,
        minute: 59,
        second: 59
      }) as ShutdownSchedule

      return {
        success: true,
        schedule
      }
    } catch (error: any) {
      return {
        success: false,
        error: `스케줄 조회 실패: ${error.message || '알 수 없는 오류'}`
      }
    }
  })

  // 종료 스케줄 설정
  ipcMain.handle('system:setShutdownSchedule', async (_event, schedule: ShutdownSchedule): Promise<SystemResult> => {
    try {
      // 유효성 검사
      if (schedule.hour < 0 || schedule.hour > 23) {
        return { success: false, error: '시간은 0-23 사이여야 합니다.' }
      }
      if (schedule.minute < 0 || schedule.minute > 59) {
        return { success: false, error: '분은 0-59 사이여야 합니다.' }
      }

      // 설정 저장
      store.set(SCHEDULE_KEY, schedule)

      // 기존 작업 삭제 (있다면)
      try {
        await execCommand(`schtasks /Delete /TN "${TASK_NAME}" /F`)
      } catch {
        // 작업이 없으면 오류 무시
      }

      // 스케줄이 활성화된 경우 작업 생성
      if (schedule.enabled) {
        const time = `${schedule.hour.toString().padStart(2, '0')}:${schedule.minute.toString().padStart(2, '0')}`

        // Windows 작업 스케줄러에 종료 작업 등록
        const createTaskCommand = `schtasks /Create /TN "${TASK_NAME}" /TR "shutdown /s /f /t 0" /SC DAILY /ST ${time} /F`

        await execCommand(createTaskCommand)

        return {
          success: true,
          message: `자동 종료가 ${time}에 예약되었습니다.`
        }
      } else {
        return {
          success: true,
          message: '자동 종료 스케줄이 비활성화되었습니다.'
        }
      }
    } catch (error: any) {
      console.error('Failed to set shutdown schedule:', error)
      return {
        success: false,
        error: `스케줄 설정 실패: ${error.message || '알 수 없는 오류'}`
      }
    }
  })
}
