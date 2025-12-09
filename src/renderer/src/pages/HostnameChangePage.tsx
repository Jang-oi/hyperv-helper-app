import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function HostnameChangePage() {
  const [hostname, setHostname] = useState('')
  const [currentHostname, setCurrentHostname] = useState('로딩 중...')
  const [loading, setLoading] = useState(false)
  const [showRestartDialog, setShowRestartDialog] = useState(false)

  // 현재 호스트네임 로드
  useEffect(() => {
    const loadHostname = async () => {
      try {
        const result = await window.api.hostname.get()
        if (result.success && result.hostname) {
          setCurrentHostname(result.hostname)
        }
      } catch (error) {
        console.error('Failed to load hostname:', error)
        setCurrentHostname('조회 실패')
      }
    }
    loadHostname()
  }, [])

  const handleSubmit = async () => {
    if (!hostname.trim()) return

    setLoading(true)

    try {
      const result = await window.api.hostname.set(hostname)

      if (result.success) {
        setCurrentHostname(hostname)
        setHostname('')
        toast.info('호스트네임이 변경되었습니다. 재시작 후 적용됩니다.')
        setShowRestartDialog(true)
      } else {
        toast.error(result.error || '변경에 실패했습니다.')
      }
    } catch (error) {
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    try {
      const result = await window.api.system.restart()
      if (result.success) {
        toast.success('10초 후 시스템이 재시작됩니다.')
        setShowRestartDialog(false)
      } else {
        toast.error('재시작에 실패했습니다.')
      }
    } catch (error) {
      toast.error('재시작에 실패했습니다.')
    }
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">호스트네임 변경</h2>

        <Card className="p-6">
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">현재 호스트네임</p>
            <p className="text-lg font-semibold text-foreground">{currentHostname}</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">새 호스트네임</label>
              <Input
                type="text"
                placeholder="새로운 컴퓨터 이름 입력"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={!hostname || loading}>
              {loading ? '변경 중...' : '호스트네임 변경'}
            </Button>

            <p className="text-xs text-muted-foreground">⚠️ 호스트네임 변경 후 시스템 재시작이 필요합니다.</p>
          </div>
        </Card>
      </div>

      {/* 재시작 확인 다이얼로그 */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>시스템 재시작</AlertDialogTitle>
            <AlertDialogDescription>
              호스트네임 변경을 적용하려면 시스템을 재시작해야 합니다. 지금 재시작하시겠습니까?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>나중에</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>재시작</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
