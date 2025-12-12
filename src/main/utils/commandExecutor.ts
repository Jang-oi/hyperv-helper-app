import { exec, ExecOptions } from 'child_process'
import iconv from 'iconv-lite'

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
 * 명령어 실행 (CP949 인코딩 처리)
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
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'buffer', ...options }, (err, stdout, stderr) => {
      if (err) {
        reject({
          stdout: '',
          stderr: iconv.decode(stderr as Buffer, 'cp949')
        })
      } else {
        resolve({
          stdout: iconv.decode(stdout as Buffer, 'cp949'),
          stderr: iconv.decode(stderr as Buffer, 'cp949')
        })
      }
    })
  })
}

export const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, { encoding: 'buffer' }, (err, stdout, stderr) => {
      if (err) {
        reject(iconv.decode(stderr, 'cp949'))
      } else {
        resolve(iconv.decode(stdout, 'cp949'))
      }
    })
  })
}
