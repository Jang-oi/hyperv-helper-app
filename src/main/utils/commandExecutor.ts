import { exec, ExecOptions } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Command execution result
 */
export interface CommandResult {
  stdout: string
  stderr: string
}

/**
 * UTF-8 인코딩을 적용한 명령어 실행 유틸리티
 * Windows에서 한글 및 특수문자를 올바르게 처리하기 위해 chcp 65001(UTF-8) 적용
 */

/**
 * 명령어 실행 (chcp 65001 UTF-8 인코딩 자동 적용)
 * @param command 실행할 명령어 (netsh, powershell 등 모든 cmd 명령어)
 * @param options execAsync 옵션 (선택사항)
 * @returns CommandResult
 *
 * @example
 * // netsh 명령어
 * await execCommand('netsh interface portproxy show all')
 *
 * // PowerShell 명령어
 * await execCommand('powershell -Command "Get-NetIPAddress"')
 */
export async function execCommand(command: string, options?: ExecOptions): Promise<CommandResult> {
  // chcp 65001로 UTF-8 인코딩 설정 후 명령어 실행
  const wrappedCommand = `chcp 65001 >nul && ${command}`

  const result = await execAsync(wrappedCommand, {
    encoding: 'utf8',
    ...options
  })

  // encoding: 'utf8'을 지정했으므로 stdout과 stderr는 항상 string입니다
  return {
    stdout: result.stdout as string,
    stderr: result.stderr as string
  }
}
