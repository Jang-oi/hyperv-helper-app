import { useEffect, useState } from 'react'
import { CheckCircle, Download, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import Loading from '@/components/Loading'
import type { GitHubRelease, VersionInfo } from '../../../shared/types'

export default function VersionPage() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)

  // 버전 정보 로드
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

  useEffect(() => {
    loadVersionInfo()
  }, [])

  // 업데이트 확인
  const handleCheckUpdate = async () => {
    setChecking(true)
    try {
      await loadVersionInfo()
      toast.success('최신 버전 확인 완료')
    } finally {
      setChecking(false)
    }
  }

  // 업데이트 다운로드 (GitHub 릴리즈 페이지로 이동)
  const handleUpdate = async () => {
    if (!versionInfo?.latestVersion) return

    setUpdating(true)
    try {
      // GitHub 릴리즈 페이지 열기
      const releaseUrl = `https://github.com/Jang-oi/hyperv-helper-app/releases/latest`
      window.open(releaseUrl, '_blank')
      toast.info('GitHub 릴리즈 페이지에서 최신 버전을 다운로드하세요.')
    } catch (error) {
      toast.error('릴리즈 페이지를 여는데 실패했습니다.')
    } finally {
      setUpdating(false)
    }
  }

  // 릴리즈 노트 파싱 (마크다운을 간단한 리스트로 변환)
  const parseReleaseNotes = (body: string): string[] => {
    if (!body) return []

    // 마크다운 리스트 항목 추출 (-, *, + 로 시작하는 라인)
    const lines = body.split('\n')
    const items: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      // 마크다운 리스트 항목 감지
      if (trimmed.match(/^[-*+]\s+(.+)/)) {
        const match = trimmed.match(/^[-*+]\s+(.+)/)
        if (match) {
          items.push(match[1])
        }
      }
      // 숫자 리스트 항목 감지
      else if (trimmed.match(/^\d+\.\s+(.+)/)) {
        const match = trimmed.match(/^\d+\.\s+(.+)/)
        if (match) {
          items.push(match[1])
        }
      }
    }

    return items.length > 0 ? items : [body.substring(0, 200)]
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

  return (
    <div className="px-4">
      {(checking || updating) && <Loading fullScreen message={checking ? '확인 중...' : '처리 중...'} />}

      <h2 className="text-2xl font-bold text-foreground mb-5">버전 정보</h2>

      {/* 현재 버전 카드 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">현재 버전</p>
            <p className="text-3xl font-bold text-foreground">v{versionInfo.currentVersion}</p>
          </div>
          <div className="flex items-center gap-2">
            {versionInfo.isLatest ? (
              <>
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">최신 버전</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCheckUpdate} disabled={checking}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                  {checking ? '확인 중...' : '업데이트 확인'}
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">최신 버전</p>
                  <p className="text-sm font-semibold text-primary">v{versionInfo.latestVersion}</p>
                </div>
                <Button onClick={handleUpdate} disabled={updating}>
                  <Download className="w-4 h-4 mr-2" />
                  {updating ? '다운로드 중...' : '업데이트'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 릴리즈 내역 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">릴리즈 내역</h3>
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-4">
            {versionInfo.releases.length > 0 ? (
              versionInfo.releases.map((release: GitHubRelease) => (
                <Card key={release.tag_name} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-foreground">
                          {release.name || release.tag_name}
                        </h4>
                        {release.tag_name.replace(/^v/, '') === versionInfo.currentVersion && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                            현재
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(release.published_at)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(release.html_url, '_blank')}
                      className="text-primary hover:text-primary"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <ul className="space-y-2">
                    {parseReleaseNotes(release.body).map((note, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))
            ) : (
              <Card className="p-6">
                <p className="text-center text-muted-foreground">릴리즈 내역이 없습니다.</p>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
