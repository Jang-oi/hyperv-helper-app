import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import Loading from '@/components/Loading'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { IPConfig, NetworkAdapter } from '../../../shared/types'

export default function IPChangePage() {
  const [adapters, setAdapters] = useState<NetworkAdapter[]>([])
  // 선택된 어댑터의 이름을 저장
  const [selectedAdapterName, setSelectedAdapterName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [loadingAdapters, setLoadingAdapters] = useState(true)

  // IP 설정 상태 (현재 활성 어댑터의 값으로 채워질 예정)
  const [ipAddress, setIpAddress] = useState('')
  const [subnetMask, setSubnetMask] = useState('255.255.255.0')
  const [gateway, setGateway] = useState('')
  const [dns1, setDns1] = useState('')
  const [dns2, setDns2] = useState('')

  // 현재 설정 표시용 상태는 Input에 직접 값을 넣으므로 제거하거나 내부적으로 사용합니다.

  // 네트워크 어댑터 목록 로드
  useEffect(() => {
    const loadAdapters = async () => {
      try {
        const result = await window.api.ip.getAdapters()
        if (result.success && result.adapters && result.adapters.length > 0) {
          setAdapters(result.adapters)
          // 첫 번째 어댑터의 이름을 기본 선택
          const firstAdapterName = result.adapters[0].name
          setSelectedAdapterName(firstAdapterName)
          // 현재 설정 로드
          await loadCurrentConfig(firstAdapterName)
        } else {
          toast.error('IPv4 주소가 할당된 어댑터를 찾을 수 없습니다.')
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

  // 현재 IP 설정 로드 및 Input 필드 값 설정
  const loadCurrentConfig = async (adapterName: string) => {
    if (!adapterName) return

    try {
      const result = await window.api.ip.getCurrentConfig(adapterName)

      if (result.success && result.currentConfig) {
        const config = result.currentConfig

        // 현재 설정 값을 Input State에 바로 반영
        setIpAddress(config.ip || '')
        // 서브넷 마스크는 기본 추천값으로 설정하거나 현재 설정값을 따릅니다.
        setSubnetMask(config.subnet || '255.255.255.0')
        setGateway(config.gateway || '')
        setDns1(config.dns1 || '')
        setDns2(config.dns2 || '')
      } else {
        // 설정 조회 실패 시 기본 추천 값으로 초기화 (IP 주소, 게이트웨이, DNS만)
        setIpAddress('')
        setSubnetMask('255.255.255.0')
        setGateway('192.168.12.1')
        setDns1('164.124.101.2')
        setDns2('8.8.8.8')
      }
    } catch (error) {
      console.error('Failed to load current config:', error)
      // 오류 발생 시 기본 추천 값으로 초기화
      setIpAddress('')
      setSubnetMask('255.255.255.0')
      setGateway('192.168.12.1')
      setDns1('164.124.101.2')
      setDns2('8.8.8.8')
    }
  }

  // 어댑터 변경 시 현재 설정 다시 로드
  const handleAdapterChange = async (adapterName: string) => {
    setSelectedAdapterName(adapterName)
    setLoading(true)
    try {
      await loadCurrentConfig(adapterName)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedAdapterName) {
      toast.error('네트워크 어댑터를 선택해주세요.')
      return
    }

    // IP 유효성 검사 (사용자 코드 유지)
    if (!ipAddress.trim()) {
      toast.error('IP 주소를 입력해주세요.')
      return
    }
    if (!ipAddress.startsWith('192.168.12.')) {
      toast.error('IP 주소는 192.168.12.XXX 형식이어야 합니다.')
      return
    }
    // ... (나머지 유효성 검사 로직은 백엔드에서 처리됨)

    setLoading(true)

    try {
      const config: IPConfig = {
        ip: ipAddress,
        subnet: subnetMask,
        gateway: gateway,
        dns1: dns1,
        dns2: dns2
      }

      const result = await window.api.ip.setConfig(selectedAdapterName, config)

      if (result.success) {
        toast.success('IP 설정이 성공적으로 변경되었습니다.')
        // 설정 후 현재 설정 다시 로드하여 Input 필드 업데이트
        await loadCurrentConfig(selectedAdapterName)
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

  if (loadingAdapters) {
    return <Loading fullScreen message="네트워크 어댑터를 검색 중..." />
  }

  return (
    <div>
      {loading && <Loading fullScreen message="처리 중..." />}

      <h2 className="text-2xl font-bold text-foreground mb-6">IP 주소 변경</h2>
      <Card className="p-6">
        <div className="space-y-5">
          {/* 네트워크 어댑터 선택 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">네트워크 어댑터</label>
            <Select value={selectedAdapterName} onValueChange={handleAdapterChange} disabled={loading}>
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
            <label className="text-sm font-medium text-foreground">
              IP 주소
              <span className="ml-2 text-xs font-normal text-destructive font-bold">(권장: 192.168.12.XXX)</span>
            </label>
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
            <label className="text-sm font-medium text-foreground">
              서브넷 마스크
              <span className="ml-2 text-xs font-normal text-destructive font-bold">(권장: 255.255.255.0)</span>
            </label>
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
            <label className="text-sm font-medium text-foreground">
              게이트웨이
              <span className="ml-2 text-xs font-normal text-destructive font-bold">(권장: 192.168.12.1)</span>
            </label>
            <Input type="text" placeholder="192.168.12.1" value={gateway} onChange={(e) => setGateway(e.target.value)} disabled={loading} />
          </div>

          {/* 기본 DNS */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              기본 DNS
              <span className="ml-2 text-xs font-normal text-destructive font-bold">(권장: 164.124.101.2)</span>
            </label>
            <Input type="text" placeholder="164.124.101.2" value={dns1} onChange={(e) => setDns1(e.target.value)} disabled={loading} />
          </div>

          {/* 보조 DNS */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              보조 DNS
              <span className="ml-2 text-xs font-normal text-destructive font-bold">(권장: 8.8.8.8)</span>
            </label>
            <Input type="text" placeholder="8.8.8.8" value={dns2} onChange={(e) => setDns2(e.target.value)} disabled={loading} />
          </div>

          {/* 적용 버튼 */}
          <Button onClick={handleSubmit} className="w-full" disabled={!ipAddress || loading}>
            {loading ? '설정 중...' : 'IP 설정 적용'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
