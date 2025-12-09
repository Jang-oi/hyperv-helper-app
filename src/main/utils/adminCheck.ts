import { exec } from 'child_process'
import { promisify } from 'util'
import { app, dialog } from 'electron'

const execAsync = promisify(exec)

/**
 * 관리자 권한 확인 및 재시작 유틸리티
 */
export class AdminCheck {
  /**
   * 관리자 권한으로 실행 중인지 확인
   */
  static async isAdmin(): Promise<boolean> {
    if (process.platform !== 'win32') {
      return true // Windows가 아니면 항상 true 반환
    }

    try {
      const { stdout } = await execAsync(
        'powershell -Command "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"'
      )
      return stdout.trim() === 'True'
    } catch {
      return false
    }
  }

  /**
   * 관리자 권한이 없으면 사용자에게 알림 표시
   */
  static async checkAndNotify(): Promise<void> {
    const isAdmin = await this.isAdmin()

    if (!isAdmin) {
      const result = await dialog.showMessageBox({
        type: 'warning',
        title: '관리자 권한 필요',
        message: '이 애플리케이션은 관리자 권한이 필요합니다.',
        detail:
          '호스트네임 변경, IP 설정 등의 기능을 사용하려면 관리자 권한으로 실행해야 합니다.\n\n프로그램을 종료한 후 마우스 오른쪽 버튼을 클릭하여 "관리자 권한으로 실행"을 선택하세요.',
        buttons: ['확인', '계속 사용'],
        defaultId: 0,
        cancelId: 1
      })

      if (result.response === 0) {
        app.quit()
      }
    }
  }
}
