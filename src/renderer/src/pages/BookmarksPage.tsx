import { useEffect, useState } from 'react'
import { Edit3, ExternalLink, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BookmarkItem {
  id: string
  name: string
  url: string
}

const STAGES = ['DEV', 'QAS', 'PRD']

export default function BookmarksPage() {
  const [stage, setStage] = useState<string>('DEV')
  const [name, setName] = useState<string>('') // 북마크 이름 추가 입력 필드
  const [wasUrl, setWasUrl] = useState<string>('')
  const [autoAddIp, setAutoAddIp] = useState<string>('')
  const [addMode, setAddMode] = useState<'auto' | 'manual'>('auto')

  const [bookmarks, setBookmarks] = useState<Record<string, BookmarkItem[]>>({
    DEV: [],
    QAS: [],
    PRD: []
  })
  const [loading, setLoading] = useState(false)

  // ---------------------------------------------------
  // 1. 북마크 로드 로직 (IPC 사용)
  // ---------------------------------------------------
  const loadBookmarks = async () => {
    setLoading(true)
    const newBookmarks: Record<string, BookmarkItem[]> = { DEV: [], QAS: [], PRD: [] }
    let hasError = false

    try {
      // 모든 스테이지의 북마크를 순차적으로 로드
      for (const s of STAGES) {
        const result = await window.api.bookmark.get(s)

        // 핸들러가 해당 스테이지의 북마크 배열을 직접 반환한다고 가정
        if (Array.isArray(result)) {
          newBookmarks[s] = result as BookmarkItem[]
        } else {
          // 오류 발생 시
          console.error(`[IPC Error] Failed to load bookmarks for stage ${s}:`, result)
          hasError = true
        }
      }
      setBookmarks(newBookmarks)

      if (hasError) {
        toast.error('일부 북마크 스테이지를 로드하는 데 실패했습니다.')
      } else {
        console.log('북마크 로드 완료')
      }
    } catch (e) {
      toast.error('IPC 통신 오류: 북마크 데이터를 가져올 수 없습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------
  // 2. 수동 북마크 추가 로직 (기존 함수 재활용)
  // ---------------------------------------------------
  const addManualBookmark = async () => {
    // name, wasUrl 사용 (기존 로직 유지)
    if (!name.trim() || !wasUrl.trim()) {
      toast.warning('북마크 이름과 URL을 모두 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      // 💡 IPC 호출: name, url 모두 전달
      const result = await (window as any).api.bookmark.add(stage, name, wasUrl)

      if (result && result.success) {
        toast.success(`'${name}' 북마크가 [${stage}] 환경에 수동으로 추가되었습니다.`)
        setName('')
        setWasUrl('')
        await loadBookmarks()
      } else {
        toast.error(result?.error || '북마크 추가에 실패했습니다.')
      }
    } catch (e) {
      toast.error('IPC 통신 오류: 북마크 추가에 실패했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------
  // 3. 💡 WAS IP 자동 북마크 추가 로직 (새 함수)
  // ---------------------------------------------------
  const addAutoBookmarks = async () => {
    if (!autoAddIp.trim()) {
      toast.warning('WAS IP 또는 도메인을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      // 💡 새로운 IPC 호출 (자동 추가용)
      // stage와 IP만 전달하고, 이름/포트는 핸들러에서 결정
      const result = await (window as any).api.bookmark.addAuto(stage, autoAddIp)

      if (result && result.success) {
        toast.success(`[${stage}] 환경에 2개의 WAS 북마크가 자동으로 추가되었습니다.`)
        setAutoAddIp('')
        await loadBookmarks()
      } else {
        toast.error(result?.error || '자동 북마크 추가에 실패했습니다. (유효하지 않은 IP일 수 있습니다.)')
      }
    } catch (e) {
      toast.error('IPC 통신 오류: 자동 북마크 추가에 실패했습니다.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadBookmarks()
  }, []) // 최초 1회만 로드

  const openBookmark = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-5">Chrome 북마크</h2>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-10 mb-4">
          <TabsTrigger value="list">내 북마크</TabsTrigger>
          <TabsTrigger value="add">북마크 추가</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card className="p-5">
            <div className="mb-5">
              <label className="text-sm font-semibold text-foreground mb-3 block">추가 방식 선택</label>
              <RadioGroup value={addMode} onValueChange={(value) => setAddMode(value as 'auto' | 'manual')} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <label htmlFor="auto" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    자동 추가 (80, 8082)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <label htmlFor="manual" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-gray-600" />
                    수동 추가
                  </label>
                </div>
              </RadioGroup>
            </div>

            <div className="h-px bg-border mb-5" />

            <div className="space-y-3">
              {/* 공통: 환경 선택 */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">환경 선택</label>
                <Select value={stage} onValueChange={setStage} disabled={loading}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="환경 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {addMode === 'auto' ? (
                <>
                  {/* 자동 추가 모드 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">WAS IP 또는 도메인</label>
                    <Input
                      type="text"
                      placeholder="예: 192.168.12.15 또는 was.company.com"
                      className="h-9"
                      value={autoAddIp}
                      onChange={(e) => setAutoAddIp(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground mt-1">자동으로 80번(HTTP), 8082번(Jenkins) 포트 북마크가 생성됩니다.</p>
                  </div>
                  <Button size="sm" onClick={addAutoBookmarks} className="w-full h-9 mt-2" disabled={loading || !autoAddIp.trim()}>
                    자동 북마크 추가
                  </Button>
                </>
              ) : (
                <>
                  {/* 수동 추가 모드 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">북마크 이름</label>
                    <Input
                      type="text"
                      placeholder="예: VPN 관련"
                      className="h-9"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">URL</label>
                    <Input
                      type="url"
                      placeholder="http://192.168.1.10:9080/"
                      className="h-9"
                      value={wasUrl}
                      onChange={(e) => setWasUrl(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={addManualBookmark}
                    className="w-full h-9 mt-2"
                    disabled={loading || !name.trim() || !wasUrl.trim()}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    수동 북마크 추가
                  </Button>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card className="p-4">
            <div className="space-y-6">
              {STAGES.map((env) => (
                <div key={env}>
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-foreground">{env}</h4>
                    {/* 데이터 로딩 중이거나 목록이 비어 있으면 '0개'로 표시됨 */}
                    <span className="text-xs text-muted-foreground">({bookmarks[env]?.length || 0}개)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pl-4">
                    {loading ? (
                      <p className="text-sm text-muted-foreground py-2">북마크를 로드 중입니다...</p>
                    ) : bookmarks[env]?.length > 0 ? (
                      <ScrollArea className="h-[120px]">
                        {bookmarks[env].map((bookmark) => (
                          <div
                            key={bookmark.id}
                            className="flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0 max-w-sm">
                              <p className="font-medium text-sm text-foreground">{bookmark.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openBookmark(bookmark.url)}>
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">{env} 환경에 등록된 북마크가 없습니다.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
