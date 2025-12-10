import https from 'https'
import { app, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { GitHubRelease, VersionInfo, VersionResult } from '../../shared/types'

const GITHUB_REPO = 'Jang-oi/hyperv-helper-app'
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases`

/**
 * GitHub API를 통해 릴리즈 정보를 가져오는 헬퍼 함수
 */
function fetchGitHubReleases(): Promise<GitHubRelease[]> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'hyperv-helper-app',
        Accept: 'application/vnd.github.v3+json'
      }
    }

    https
      .get(GITHUB_API_URL, options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const releases = JSON.parse(data)
              resolve(releases)
            } else {
              reject(new Error(`GitHub API returned status ${res.statusCode}`))
            }
          } catch (error) {
            reject(error)
          }
        })
      })
      .on('error', (error) => {
        reject(error)
      })
  })
}

/**
 * Version 관련 IPC 핸들러 등록
 */
export function registerVersionHandlers(): void {
  // 버전 정보 및 릴리즈 목록 조회
  ipcMain.handle('version:getInfo', async (): Promise<VersionResult> => {
    try {
      const currentVersion = app.getVersion()
      const releases = await fetchGitHubReleases()

      // 정식 릴리즈만 필터링 (prerelease 제외)
      const stableReleases = releases.filter((r) => !r.prerelease)

      let latestVersion: string | undefined
      let isLatest = true

      if (stableReleases.length > 0) {
        // tag_name에서 'v' 제거하여 버전 비교
        latestVersion = stableReleases[0].tag_name.replace(/^v/, '')
        isLatest = currentVersion === latestVersion
      }

      const versionInfo: VersionInfo = {
        currentVersion,
        latestVersion,
        isLatest,
        releases: stableReleases
      }

      return {
        success: true,
        versionInfo
      }
    } catch (error) {
      return {
        success: false,
        error: `버전 정보를 가져올 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })

  // electron-updater: 업데이트 확인
  ipcMain.handle('version:checkForUpdates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()

      if (result && result.updateInfo) {
        const serverVersion = result.updateInfo.version
        const currentVersion = app.getVersion()

        // 👉 동일 버전이면 업데이트 없음으로 처리
        if (serverVersion === currentVersion) {
          return {
            success: true,
            updateAvailable: false
          }
        }

        return {
          success: true,
          updateAvailable: true,
          updateInfo: {
            version: serverVersion,
            releaseDate: result.updateInfo.releaseDate,
            releaseNotes: result.updateInfo.releaseNotes
          }
        }
      }

      return {
        success: true,
        updateAvailable: false
      }
    } catch (error) {
      return {
        success: false,
        updateAvailable: false,
        error: `업데이트 확인 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })

  // electron-updater: 업데이트 다운로드
  ipcMain.handle('version:downloadUpdate', async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await autoUpdater.downloadUpdate()
      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: `업데이트 다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  })

  // electron-updater: 종료 후 설치
  ipcMain.handle('version:quitAndInstall', () => {
    autoUpdater.quitAndInstall(false, true)
  })
}
