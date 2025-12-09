import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export default function IPChangePage() {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([])
  const [selectedAdapter, setSelectedAdapter] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingAdapters, setLoadingAdapters] = useState(true)

  // IP 설정 상태 (기본값 설정)
  const [ipAddress, setIpAddress] = useState('')
  const [subnetMask, setSubnetMask] = useState('255.255.255.0')
  const [gateway, setGateway] = useState('192.168.12.1')
  const [dns1, setDns1] = useState('164.124.101.2')
  const [dns2, setDns2] = useState('8.8.8.8')

  // 현재 설정 표시용
  const [currentConfig, setCurrentConfig] = useState<IPConfig | null>(null)

  // 네트워크 어댑터 목록 로드
  useEffect(() => {
    const loadAdapters = async () => {
      try {
        const result = await window.api.ip.getAdapters()
        if (result.success && result.adapters && result.adapters.length > 0) {
          setAdapters(result.adapters)
          // 첫 번째 어댑터를 기본 선택
          const firstAdapter = result.adapters[0].name
          setSelectedAdapter(firstAdapter)
          // 현재 설정 로드
          await loadCurrentConfig(firstAdapter)
        } else {
          toast.error('이더넷 어댑터를 찾을 수 없습니다.')
        }
      } catch (error) {
        console.error('Failed to load adapters:', error)
        toast.error('네트워크 어댑터 조회에 실패했습니다.')
      } finally {
        setLoadingAdapters(false)
      }
    }
    loadAdapters()
  }, [])

  // 현재 IP 설정 로드
  const loadCurrentConfig = async (adapterName: string) => {
    try {
      const result = await window.api.ip.getCurrentConfig(adapterName)
      if (result.success && result.currentConfig) {
        setCurrentConfig(result.currentConfig)
      }
    } catch (error) {
      console.error('Failed to load current config:', error)
    }
  }

  // 어댑터 변경 시 현재 설정 다시 로드
  const handleAdapterChange = async (adapterName: string) => {
    setSelectedAdapter(adapterName)
    await loadCurrentConfig(adapterName)
  }

  // IP 설정 적용
  const handleSubmit = async () => {
    if (!selectedAdapter) {
      toast.error('네트워크 어댑터를 선택해주세요.')
      return
    }

    if (!ipAddress.trim()) {
      toast.error('IP 주소를 입력해주세요.')
      return
    }

    // IP 주소가 192.168.12.XXX 형식인지 확인
    if (!ipAddress.startsWith('192.168.12.')) {
      toast.error('IP 주소는 192.168.12.XXX 형식이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const config: IPConfig = {
        ip: ipAddress,
        subnet: subnetMask,
        gateway: gateway,
        dns1: dns1,
        dns2: dns2
      }

      const result = await window.api.ip.setConfig(selectedAdapter, config)

      if (result.success) {
        toast.success('IP 설정이 성공적으로 변경되었습니다.')
        // 현재 설정 다시 로드
        await loadCurrentConfig(selectedAdapter)
      } else {
        toast.error(result.error || 'IP 설정 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to set IP config:', error)
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // DHCP로 변경
  const handleDHCP = async () => {
    if (!selectedAdapter) {
      toast.error('네트워크 어댑터를 선택해주세요.')
      return
    }

    setLoading(true)

    try {
      const result = await window.api.ip.setDHCP(selectedAdapter)

      if (result.success) {
        toast.success('DHCP로 변경되었습니다.')
        // 현재 설정 다시 로드
        await loadCurrentConfig(selectedAdapter)
      } else {
        toast.error(result.error || 'DHCP 설정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to set DHCP:', error)
      toast.error('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingAdapters) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">IP 주소 변경</h2>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">네트워크 어댑터를 검색 중...</p>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">IP 주소 변경</h2>

      {/* 현재 설정 표시 */}
      {currentConfig && (
        <Card className="p-4 mb-4 bg-muted">
          <p className="text-sm font-semibold text-foreground mb-2">현재 설정</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">IP:</span> {currentConfig.ip || 'DHCP'}
            </div>
            <div>
              <span className="font-medium">서브넷:</span> {currentConfig.subnet}
            </div>
            <div>
              <span className="font-medium">게이트웨이:</span> {currentConfig.gateway}
            </div>
            <div>
              <span className="font-medium">DNS:</span> {currentConfig.dns1}
              {currentConfig.dns2 && `, ${currentConfig.dns2}`}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="space-y-5">
          {/* 네트워크 어댑터 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">네트워크 어댑터</label>
            <Select value={selectedAdapter} onValueChange={handleAdapterChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="어댑터 선택" />
              </SelectTrigger>
              <SelectContent>
                {adapters.map((adapter) => (
                  <SelectItem key={adapter.name} value={adapter.name}>
                    {adapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* IP 주소 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">IP 주소 (192.168.12.XXX)</label>
            <Input
              type="text"
              placeholder="예: 192.168.12.100"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 서브넷 마스크 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">서브넷 마스크</label>
            <Input
              type="text"
              placeholder="255.255.255.0"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* 게이트웨이 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">게이트웨이</label>
            <Input type="text" placeholder="192.168.12.1" value={gateway} onChange={(e) => setGateway(e.target.value)} disabled={loading} />
          </div>

          {/* 기본 DNS */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">기본 DNS</label>
            <Input type="text" placeholder="164.124.101.2" value={dns1} onChange={(e) => setDns1(e.target.value)} disabled={loading} />
          </div>

          {/* 보조 DNS */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">보조 DNS</label>
            <Input type="text" placeholder="8.8.8.8" value={dns2} onChange={(e) => setDns2(e.target.value)} disabled={loading} />
          </div>

          {/* 버튼 그룹 */}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={!ipAddress || loading}>
              {loading ? '설정 중...' : 'IP 설정 적용'}
            </Button>
            <Button onClick={handleDHCP} variant="outline" disabled={loading}>
              DHCP
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">⚠️ 관리자 권한이 필요한 작업입니다.</p>
        </div>
      </Card>
    </div>
  )
}
