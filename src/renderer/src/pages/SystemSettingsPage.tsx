import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

interface ShutdownSchedule {
  enabled: boolean
  hour: number
  minute: number
  second: number
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<ShutdownSchedule>({
    enabled: false,
    hour: 23,
    minute: 59,
    second: 59
  })

  // 설정 로드
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const result = await window.api.system.getShutdownSchedule()
      if (result.success && result.schedule) {
        setSchedule(result.schedule)
      }
    } catch (error) {
      console.error('Failed to load system settings:', error)
      toast.error('시스템 설정을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setSaving(true)
    const newSchedule = { ...schedule, enabled: checked }

    try {
      const result = await window.api.system.setShutdownSchedule(newSchedule)
      if (result.success) {
        setSchedule(newSchedule)
        toast.success(result.message || (checked ? '자동 종료가 활성화되었습니다.' : '자동 종료가 비활성화되었습니다.'))
      } else {
        toast.error(result.error || '설정 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
      toast.error('설정 변경 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loading fullScreen message="시스템 설정 로드 중..." />
  }

  return (
    <div className="px-4">
      {saving && <Loading fullScreen message="설정 적용 중..." />}

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-foreground">시스템 설정</h2>
      </div>

      {/* 자동 종료 스케줄 카드 */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">자동 종료 스케줄</h3>
            <p className="text-sm text-muted-foreground mb-4">매일 지정된 시간에 시스템을 자동으로 종료합니다.</p>

            <div className="space-y-4">
              {/* 활성화 토글 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">스케줄 활성화</span>
                <Switch checked={schedule.enabled} onCheckedChange={handleToggle} />
              </div>

            </div>
          </div>
        </div>
      </Card>

      {/* 추가 정보 카드 */}
      <Card className="p-6 bg-secondary/50">
        <h3 className="text-sm font-semibold text-foreground mb-2">주의사항</h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• 자동 종료는 매일 23시 59분 59초에 Windows 작업 스케줄러를 통해 실행됩니다.</li>
          <li>• 시스템이 실행 중이지 않으면 종료 작업은 수행되지 않습니다.</li>
          <li>• 저장하지 않은 작업이 있으면 강제 종료되므로 주의하세요.</li>
        </ul>
      </Card>
    </div>
  )
}
