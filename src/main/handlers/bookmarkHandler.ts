import * as fs from 'fs/promises'
import * as os from 'os'
import * as path from 'path'
import { ipcMain } from 'electron'

// 💡 ID 생성을 위한 uuid 라이브러리 사용 가정 (프로젝트에 설치되어 있어야 합니다)
// import { v4 as uuidv4 } from 'uuid';

// 💡 Chrome 북마크 파일 경로를 가져오는 함수 (Windows 기준)
function getChromeBookmarkPath(): string {
  const homeDir = os.homedir()
  // 프로필 이름을 'Default'로 가정 (사용자 환경에 따라 다를 수 있음)
  return path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Bookmarks')
}

/**
 * 북마크 파일을 읽어 JSON 객체로 반환합니다.
 */
async function readBookmarks(): Promise<any> {
  const filePath = getChromeBookmarkPath()
  const fileContent = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

/**
 * JSON 객체를 파일에 기록합니다. (Chrome이 사용 중일 경우 문제가 발생할 수 있습니다.)
 */
async function writeBookmarks(data: any): Promise<void> {
  const filePath = getChromeBookmarkPath()
  // 예쁜 포맷으로 저장 (선택 사항)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

const STAGES = ['DEV', 'QAS', 'PRD'] // 헬퍼 상수

export function registerBookmarksHandlers(): void {
  /**
   * 💡 북마크 목록 조회 핸들러 (요청하신 get 기능)
   * 특정 스테이지(폴더)에 속한 북마크 목록을 반환합니다.
   * @param stage 'DEV', 'QAS', 'PRD'
   * @returns 북마크 목록 (id, name, url을 포함)
   */
  ipcMain.handle('bookmark:get', async (_event, stage: string): Promise<any> => {
    try {
      if (!STAGES.includes(stage)) {
        return [] // 유효하지 않은 스테이지는 빈 배열 반환
      }

      const bookmarksData = await readBookmarks()
      const bookmarkBar = bookmarksData.roots.bookmark_bar

      // 해당 스테이지 폴더 찾기
      const targetFolder = bookmarkBar.children.find((child: any) => child.type === 'folder' && child.name === stage)

      if (!targetFolder || !targetFolder.children) {
        return [] // 폴더가 없거나 비어있으면 빈 배열 반환
      }

      // URL 타입의 북마크만 필터링하여 필요한 정보(id, name, url)만 추출
      return targetFolder.children
        .filter((child: any) => child.type === 'url' && child.url)
        .map((child: any) => ({
          // ⚠️ ID 생성 방식은 uuid 대신 기존 id를 그대로 사용하거나, 프로젝트의 ID 생성 방식을 적용하세요.
          id: child.id,
          name: child.name,
          url: child.url
        })) // array of BookmarkItem
    } catch (error) {
      console.error('Failed to get bookmarks:', error)
      return []
    }
  })

  /**
   * 💡 북마크 추가 핸들러 (BookmarksPage.tsx 로직에 맞게 수정)
   * @param stage 'DEV', 'QAS', 'PRD'
   * @param name 북마크 이름
   * @param url 북마크 URL
   */
  ipcMain.handle(
    'bookmark:add',
    async (_event, stage: string, name: string, url: string): Promise<{ success: boolean; error?: string }> => {
      try {
        if (!STAGES.includes(stage)) {
          return { success: false, error: '유효하지 않은 환경(Stage)입니다.' }
        }
        if (!name || !url) {
          return { success: false, error: '이름과 URL을 모두 입력해야 합니다.' }
        }

        const bookmarksData = await readBookmarks()
        const bookmarkBar = bookmarksData.roots.bookmark_bar
        let targetFolder = bookmarkBar.children.find((child: any) => child.type === 'folder' && child.name === stage)

        // 1. 해당 폴더가 없으면 생성
        if (!targetFolder) {
          targetFolder = {
            date_added: String(Date.now()),
            // ⚠️ ID 생성 방식에 유의하세요.
            id: String(Math.floor(Math.random() * 1000000)),
            name: stage,
            type: 'folder',
            children: []
          }
          bookmarkBar.children.push(targetFolder)
        }

        // 2. URL 객체 생성 및 폴더에 추가 (단일 북마크)
        const newBookmark = {
          date_added: String(Date.now()),
          // ⚠️ ID 생성 방식에 유의하세요.
          id: String(Math.floor(Math.random() * 1000000)),
          name: name,
          type: 'url',
          url: url
        }

        targetFolder.children.push(newBookmark)
        await writeBookmarks(bookmarksData)

        return { success: true }
      } catch (error) {
        console.error('Failed to add bookmark:', error)
        return { success: false, error: `북마크 추가 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }
      }
    }
  )

  // 2. 💡 자동 추가 핸들러 (새로운 bookmark:addAuto) - 요청하신 로직 구현
  ipcMain.handle('bookmark:addAuto', async (_event, stage: string, ip: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!STAGES.includes(stage)) {
        return { success: false, error: '유효하지 않은 환경(Stage)입니다.' }
      }
      if (!ip) {
        return { success: false, error: 'IP 또는 도메인을 입력해야 합니다.' }
      }

      const bookmarksData = await readBookmarks()
      const bookmarkBar = bookmarksData.roots.bookmark_bar
      let targetFolder = bookmarkBar.children.find((child: any) => child.type === 'folder' && child.name === stage)

      // 해당 폴더가 없으면 생성 (생성 로직은 기존과 동일)
      if (!targetFolder) {
        // ... (폴더 생성 로직 유지) ...
        targetFolder = {
          date_added: String(Date.now()),
          id: String(Math.floor(Math.random() * 1000000)),
          name: stage,
          type: 'folder',
          children: []
        }
        bookmarkBar.children.push(targetFolder)
      }

      // 💡 2개의 자동 북마크 객체 생성
      const newBookmarks = [
        {
          date_added: String(Date.now()),
          id: String(Math.floor(Math.random() * 1000000) + 1),
          name: `${stage} 이어카운팅`, // 요청하신 이름
          type: 'url',
          url: `http://${ip}` // 80 포트 (HTTP 기본)
        },
        {
          date_added: String(Date.now()),
          id: String(Math.floor(Math.random() * 1000000) + 2),
          name: `${stage} Jenkins`, // 요청하신 이름
          type: 'url',
          url: `http://${ip}:8082` // 8082 포트
        }
      ]

      targetFolder.children.push(...newBookmarks)
      await writeBookmarks(bookmarksData)

      return { success: true }
    } catch (error) {
      console.error('Failed to add auto bookmarks:', error)
      return { success: false, error: `자동 북마크 추가 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` }
    }
  })
}
