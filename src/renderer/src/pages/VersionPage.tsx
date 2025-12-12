import { useEffect, useState } from 'react'
import { CheckCircle, Download, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { GitHubRelease, VersionInfo } from '../../../shared/types'

export default function VersionPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [updateDownloaded, setUpdateDownloaded] = useState(false)
  // [추가] autoUpdater가 업데이트 가능 상태인지 추적하는 상태
  const [canDownload, setCanDownload] = useState(false)

  // 버전 정보 로드 (GitHub API)
  const loadVersionInfo = async () => {
    setLoading(true)
    try {
      const result = await window.api.version.getInfo()
      if (result.success && result.versionInfo) {
        setVersionInfo(result.versionInfo)
      } else {
        toast.error(result.error || '버전 정보를 가져올 수 없습니다.')
      }
    } catch (error) {
      toast.error('버전 정보 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // [추가] 업데이트 확인 공통 로직 (isManual: 수동 클릭 여부)
  const performUpdateCheck = async () => {
    try {
      const result = await window.api.version.checkForUpdates()

      if (result.success) {
        if (result.updateAvailable) {
          setCanDownload(true)
        } else {
          setCanDownload(false)
        }
        // UI 정보(릴리즈 노트 등)를 갱신
        await loadVersionInfo()
      } else {
        setCanDownload(false)
      }
    } catch (error) {
      setCanDownload(false)
    } finally {
    }
  }

  useEffect(() => {
    // 1. UI용 버전 정보 로드
    loadVersionInfo()
    performUpdateCheck()

    // electron-updater 이벤트 리스너 등록
    const unsubUpdateAvailable = window.api.version.onUpdateAvailable((info) => {
      console.log('업데이트 사용 가능:', info)
      // 토스트 메시지는 performUpdateCheck에서 처리하므로 여기서 제거합니다.
    })

    const unsubUpdateNotAvailable = window.api.version.onUpdateNotAvailable(() => {
      console.log('최신 버전입니다')
    })

    const unsubDownloadProgress = window.api.version.onDownloadProgress((progressInfo) => {
      setDownloadProgress(Math.round(progressInfo.percent))
    })

    const unsubUpdateDownloaded = window.api.version.onUpdateDownloaded(() => {
      setDownloading(false)
      setUpdateDownloaded(true)
      toast.success('업데이트 다운로드 완료! 재시작하여 설치하세요.')
    })

    const unsubUpdateError = window.api.version.onUpdateError((error) => {
      // 에러 발생 시 모든 로딩 상태 해제
      setDownloading(false)
      setChecking(false)
      setUpdating(false)

      // [개선] Please check update first 오류에 대한 토스트 메시지 개선
      if (error.includes('check update first')) {
        toast.error('업데이트 정보를 확인하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      } else {
        toast.error(`업데이트 오류: ${error}`)
      }
    })

    // cleanup
    return () => {
      unsubUpdateAvailable()
      unsubUpdateNotAvailable()
      unsubDownloadProgress()
      unsubUpdateDownloaded()
      unsubUpdateError()
    }
  }, [])

  // [수정] 업데이트 다운로드 (electron-updater)
  const handleUpdate = async () => {
    // 이미 자동 확인을 했지만, 혹시나 정보가 부족할 경우를 대비한 안전 장치 및 UI 피드백
    if (!versionInfo?.latestVersion || !canDownload) {
      toast.info('업데이트 정보를 다시 확인합니다...')
      await performUpdateCheck()

      if (!canDownload) {
        toast.error('다운로드할 업데이트 정보를 찾을 수 없습니다. 다시 시도해주세요.')
        return
      }
    }

    // 업데이트 다운로드 시작
    setUpdating(true)
    setDownloading(true)
    setDownloadProgress(0)

    try {
      const result = await window.api.version.downloadUpdate()
      if (!result.success) {
        // [중요] 중복 토스트 방지: 에러 토스트는 onUpdateError 리스너에 맡깁니다.
        console.error('다운로드 요청 실패:', result.error)
        setDownloading(false)
      }
    } catch (error) {
      // [중요] 중복 토스트 방지: 에러 토스트는 onUpdateError 리스너에 맡깁니다.
      console.error('업데이트 다운로드 중 오류가 발생했습니다:', error)
      setDownloading(false)
    } finally {
      setUpdating(false)
    }
  }

  // 재시작 및 설치
  const handleInstall = () => {
    window.api.version.quitAndInstall()
  }

  // 체인지 로그 파싱 (커밋 메시지를 사용자 친화적으로 변환)
  const parseChangeLog = (body: string): { category: string; items: string[] }[] => {
    if (!body) return []

    const lines = body.split('\n')
    const changeLog: { category: string; items: string[] }[] = []
    let currentCategory = '주요 변경사항'
    let currentItems: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()

      // 빈 줄이나 🤖 Generated 라인 건너뛰기
      if (!trimmed || trimmed.includes('🤖 Generated') || trimmed.includes('Co-Authored-By')) {
        continue
      }

      // 카테고리 감지 (헤더나 카테고리 이름)
      if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^[A-Z][a-zA-Z\s]+:$/)) {
        // 이전 카테고리 저장
        if (currentItems.length > 0) {
          changeLog.push({ category: currentCategory, items: [...currentItems] })
          currentItems = []
        }
        const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/)
        currentCategory = headerMatch ? headerMatch[1] : trimmed.replace(':', '')
        continue
      }

      // 리스트 항목 감지 (-, *, +, 숫자)
      let itemMatch = trimmed.match(/^[-*+]\s+(.+)/)
      if (!itemMatch) {
        itemMatch = trimmed.match(/^\d+\.\s+(.+)/)
      }

      if (itemMatch) {
        let item = itemMatch[1]
        // 이모지 제거 (선택사항)
        item = item.replace(/^[✅❌⚡🔧🛡️📦🎨🏗️]+\s*/, '')
        currentItems.push(item)
      }

      // 일반 텍스트 (카테고리가 아니고 리스트도 아닌 경우)
      else if (trimmed.length > 0 && !trimmed.match(/^[#-]/)) {
        currentItems.push(trimmed)
      }
    }

    // 마지막 카테고리 저장
    if (currentItems.length > 0) {
      changeLog.push({ category: currentCategory, items: currentItems })
    }

    // 결과가 없으면 원본 텍스트 일부 반환
    if (changeLog.length === 0) {
      return [{ category: '변경사항', items: [body.substring(0, 200)] }]
    }

    return changeLog
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <Loading fullScreen message="버전 정보 로드 중..." />
  }

  if (!versionInfo) {
    return (
      <div className="px-4">
        <h2 className="text-2xl font-bold text-foreground mb-6">버전 정보</h2>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">버전 정보를 불러올 수 없습니다.</p>
          <div className="mt-4 text-center">
            <Button onClick={loadVersionInfo}>다시 시도</Button>
          </div>
        </Card>
      </div>
    )
  }

  // 다운로드 버튼 활성화/비활성화 조건
  const isUpdateActionDisabled = updating || downloading || checking || !canDownload

  return (
    <div className="px-4">
      {(checking || (updating && !downloading)) && <Loading fullScreen message={checking ? '확인 중...' : '처리 중...'} />}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">버전 정보</h2>
      </div>

      {/* 현재 버전 카드 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">현재 버전</p>
            <p className="text-3xl font-bold text-foreground">v{versionInfo.currentVersion}</p>
          </div>
          <div className="flex items-center gap-3">
            {versionInfo.isLatest && !canDownload ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">최신 버전입니다</span>
              </div>
            ) : (
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">최신 버전</p>
                    <p className="text-sm font-semibold text-primary">v{versionInfo.latestVersion}</p>
                  </div>
                  {updateDownloaded ? (
                    <Button onClick={handleInstall} className="bg-green-600 hover:bg-green-700">
                      <RotateCw className="w-4 h-4 mr-2" />
                      재시작 및 설치
                    </Button>
                  ) : (
                    <Button onClick={handleUpdate} disabled={isUpdateActionDisabled}>
                      <Download className="w-4 h-4 mr-2" />
                      {downloading ? '다운로드 중...' : canDownload ? '업데이트' : '확인 중...'}
                    </Button>
                  )}
                </div>
                {downloading && (
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">다운로드 진행</span>
                      <span className="text-xs font-medium">{downloadProgress}%</span>
                    </div>
                    <Progress value={downloadProgress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 체인지 로그 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">체인지 로그</h3>
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-4">
            {versionInfo.releases.length > 0 ? (
              versionInfo.releases.map((release: GitHubRelease) => {
                const changeLogs = parseChangeLog(release.body)
                return (
                  <Card key={release.tag_name} className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-base font-semibold text-foreground">{release.name || release.tag_name}</h4>
                      {release.tag_name.replace(/^v/, '') === versionInfo.currentVersion && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">현재</span>
                      )}
                      <span className="text-sm text-muted-foreground ml-auto">{formatDate(release.published_at)}</span>
                    </div>

                    {/* 카테고리별 변경사항 표시 */}
                    <div className="space-y-3">
                      {changeLogs.map((log, logIndex) => (
                        <div key={logIndex}>
                          {changeLogs.length > 1 && <h5 className="text-sm font-semibold text-foreground mb-1.5">{log.category}</h5>}
                          <ul className="space-y-1.5">
                            {log.items.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                                <span className="break-words">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">체인지 로그가 없습니다.</p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
