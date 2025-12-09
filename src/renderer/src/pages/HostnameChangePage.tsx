import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function HostnameChangePage() {
  const [hostname, setHostname] = useState('')
  const [currentHostname, setCurrentHostname] = useState('로딩 중...')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
    setMessage(null)

    try {
      const result = await window.api.hostname.set(hostname)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || '호스트네임이 변경되었습니다.' })
        setCurrentHostname(hostname)
        setHostname('')
      } else {
        setMessage({ type: 'error', text: result.error || '변경에 실패했습니다.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!confirm('시스템을 재시작하시겠습니까?')) return

    try {
      const result = await window.api.system.restart()
      if (result.success) {
        setMessage({ type: 'success', text: result.message || '재시작 중...' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '재시작에 실패했습니다.' })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">호스트네임 변경</h2>

      <Card className="p-6">
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">현재 호스트네임</p>
          <p className="text-lg font-semibold text-foreground">{currentHostname}</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">새 호스트네임</label>
            <Input
              type="text"
              placeholder="새로운 컴퓨터 이름 입력"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!hostname || loading}>
            {loading ? '변경 중...' : '호스트네임 변경'}
          </Button>

          <Button onClick={handleRestart} variant="outline" className="w-full">
            시스템 재시작
          </Button>

          <p className="text-xs text-muted-foreground">
            ⚠️ 호스트네임 변경 후 시스템 재시작이 필요합니다. (관리자 권한 필요)
          </p>
        </div>
      </Card>
    </div>
  )
}
