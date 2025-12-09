import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CommandResult {
  success: boolean
  stdout?: string
  stderr?: string
  error?: string
}

/**
 * 명령어 실행 유틸리티
 * Windows 시스템 명령어를 안전하게 실행
 */
export class CommandExecutor {
  /**
   * PowerShell 명령어 실행
   */
  static async executePowerShell(command: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(`powershell -Command "${command}"`)
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * CMD 명령어 실행
   */
  static async executeCmd(command: string): Promise<CommandResult> {
    try {
      const { stdout, stderr } = await execAsync(command)
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 관리자 권한 필요 여부 확인
   */
  static async isAdmin(): Promise<boolean> {
    try {
      const result = await this.executePowerShell('([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)')
      return result.stdout === 'True'
    } catch {
      return false
    }
  }
}
