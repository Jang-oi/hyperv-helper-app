import { useEffect, useState } from 'react'
import { Info, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import Loading from '@/components/Loading'

// 타입 정의 (핸들러와 일치)
interface ProxyRule {
  listenAddress: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export default function PortProxyPage() {
  // rules는 배열로 관리
  const [rules, setRules] = useState<ProxyRule[]>([])
  // 화면 표시용 텍스트 상태
  const [rulesText, setRulesText] = useState('')

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('default')

  const [wasDevHost, setWasDevHost] = useState('')
  const [sapDevHost, setSapDevHost] = useState('')
  const [sapQasHost, setSapQasHost] = useState('')

  const [newRule, setNewRule] = useState({
    listenAddress: '',
    listenPort: '',
    connectAddress: '',
    connectPort: ''
  })

  // 💡 삭제할 포트 상태 추가
  const [deletePort, setDeletePort] = useState('')
  const [pasteText, setPasteText] = useState('')

  // 규칙 조회 및 포맷팅
  const loadRules = async () => {
    setLoading(true)
    try {
      const result = await window.api.portproxy.getRules()
      if (result.success && result.rules) {
        setRules(result.rules)

        // 배열을 간결한 테이블 형식으로 변환하여 Textarea에 표시
        if (result.rules.length > 0) {
          const header =
            '주소            포트        주소            포트\n' +
            '--------------- ----------  --------------- ----------\n'
          const body = result.rules
            .map(
              (r) =>
                `${r.listenAddress.padEnd(15)} ${r.listenPort.padEnd(11)} ${r.connectAddress.padEnd(15)} ${r.connectPort}`
            )
            .join('\n')
          setRulesText(header + body)
        } else {
          setRulesText('등록된 규칙이 없습니다.')
        }
      } else {
        setRules([])
        setRulesText('등록된 규칙이 없습니다.')
      }
    } catch (error) {
      toast.error('규칙 조회 중 오류가 발생했습니다.')
      setRules([])
      setRulesText('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === 'current') {
      loadRules()
    }
  }

  // --- 프리셋 추가 함수들 (기존 로직 유지) ---
  const addWasDevRules = async () => {
    if (!wasDevHost.trim()) {
      toast.warning('IP/호스트네임 입력 필요')
      return
    }
    setLoading(true)
    try {
      const ports = [
        { l: '80', c: '80' },
        { l: '443', c: '443' },
        { l: '8082', c: '8082' }
      ]
      for (const p of ports) await window.api.portproxy.insertRule(p.l, wasDevHost.trim(), p.c)
      setWasDevHost('')
      await loadRules()
      toast.success('WAS Dev 규칙 추가됨')
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const addSapDevRules = async () => {
    if (!sapDevHost.trim()) {
      toast.warning('IP/호스트네임 입력 필요')
      return
    }
    setLoading(true)
    try {
      const ports = [
        { l: '3200', c: '3200' },
        { l: '3300', c: '3300' }
      ]
      for (const p of ports) await window.api.portproxy.insertRule(p.l, sapDevHost.trim(), p.c)
      setSapDevHost('')
      await loadRules()
      toast.success('SAP Dev 규칙 추가됨')
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  const addSapQasRules = async () => {
    if (!sapQasHost.trim()) {
      toast.warning('IP/호스트네임 입력 필요')
      return
    }
    setLoading(true)
    try {
      const ports = [
        { l: '3201', c: '3200' },
        { l: '3301', c: '3300' }
      ]
      for (const p of ports) await window.api.portproxy.insertRule(p.l, sapQasHost.trim(), p.c)
      setSapQasHost('')
      await loadRules()
      toast.success('SAP QAS 규칙 추가됨')
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }
  // ----------------------------------------

  // 커스텀 단일 규칙 추가
  const addCustomRule = async () => {
    if (!newRule.listenPort || !newRule.connectAddress || !newRule.connectPort) {
      toast.warning('모든 필드를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const result = await window.api.portproxy.insertRule(
        newRule.listenPort.trim(),
        newRule.connectAddress.trim(),
        newRule.connectPort.trim()
      )
      if (result.success) {
        setNewRule({ listenAddress: '', listenPort: '', connectAddress: '', connectPort: '' })
        await loadRules()
        toast.success('규칙이 추가되었습니다.')
      } else {
        toast.error(result.error || '실패')
      }
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  // 💡 커스텀 규칙 삭제 (Listen Port 기준)
  const handleDeleteRule = async () => {
    if (!deletePort.trim()) {
      toast.warning('삭제할 리슨 포트를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const result = await window.api.portproxy.deleteRule(deletePort.trim())
      if (result.success) {
        toast.success(`Port ${deletePort.trim()} 규칙 삭제됨`)
        setDeletePort('')
        await loadRules()
      } else {
        toast.error(result.error || '삭제 실패')
      }
    } catch (e) {
      toast.error('통신 오류')
    } finally {
      setLoading(false)
    }
  }

  // 일괄 등록 (텍스트 붙여넣기 -> 파싱 -> 적용)
  const applyFromPaste = async () => {
    if (!pasteText.trim()) {
      toast.warning('내용을 붙여넣어주세요.')
      return
    }
    setLoading(true)
    try {
      // 💡 TODO가 구현된 applyRules 핸들러 호출
      const result = await window.api.portproxy.applyRules(pasteText)
      if (result.success) {
        setPasteText('')
        await loadRules()
        toast.success(result.message || '일괄 등록 완료')
      } else {
        toast.error(result.error || '일괄 등록 실패')
      }
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  // 💡 전체 초기화 (Reset)
  const handleResetRules = async () => {
    if (!confirm('정말 모든 PortProxy 규칙을 삭제하시겠습니까?')) return

    setLoading(true)
    try {
      const result = await window.api.portproxy.deleteAll()
      if (result.success) {
        toast.success('모든 규칙이 삭제되었습니다.')
        await loadRules()
      } else {
        toast.error(result.error || '초기화 실패')
      }
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  // DNS 재연결 (현재 로드된 규칙들을 문자열로 다시 변환해서 applyRules에 전달)
  const reapplyRules = async () => {
    if (rules.length === 0) {
      toast.warning('재적용할 규칙이 없습니다.')
      return
    }
    setLoading(true)
    try {
      // 규칙 배열을 netsh 포맷 문자열로 변환하여 전달 (핸들러가 문자열을 받도록 수정되었으므로)
      const rulesString = rules.map((r) => `${r.listenAddress} ${r.listenPort} ${r.connectAddress} ${r.connectPort}`).join('\n')
      const result = await window.api.portproxy.applyRules(rulesString)
      if (result.success) {
        await loadRules()
        toast.success('규칙이 재적용되었습니다.')
      } else {
        toast.error(result.error)
      }
    } catch (e) {
      toast.error('오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4">
      {loading && <Loading fullScreen message="처리 중..." />}

      <h2 className="text-2xl font-bold text-foreground mb-5">PortProxy 설정</h2>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="default">프리셋</TabsTrigger>
          <TabsTrigger value="custom">커스텀</TabsTrigger>
          <TabsTrigger value="paste">일괄등록</TabsTrigger>
          <TabsTrigger value="current">현재 규칙</TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="space-y-3 mt-4">
          {/* 프리셋 카드들 (기존 코드 유지) */}
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">WAS Dev</h3>
                <p className="text-xs text-muted-foreground">80, 443, 8082</p>
              </div>
              <Input
                placeholder="IP/Host"
                value={wasDevHost}
                onChange={(e) => setWasDevHost(e.target.value)}
                className="flex-1 h-9"
                disabled={loading}
              />
              <Button onClick={addWasDevRules} size="sm" className="h-9 px-4" disabled={loading}>
                추가
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">SAP Dev</h3>
                <p className="text-xs text-muted-foreground">3200, 3300</p>
              </div>
              <Input
                placeholder="IP/Host"
                value={sapDevHost}
                onChange={(e) => setSapDevHost(e.target.value)}
                className="flex-1 h-9"
                disabled={loading}
              />
              <Button onClick={addSapDevRules} size="sm" className="h-9 px-4" disabled={loading}>
                추가
              </Button>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">SAP QAS</h3>
                <p className="text-xs text-muted-foreground">3201→3200...</p>
              </div>
              <Input
                placeholder="IP/Host"
                value={sapQasHost}
                onChange={(e) => setSapQasHost(e.target.value)}
                className="flex-1 h-9"
                disabled={loading}
              />
              <Button onClick={addSapQasRules} size="sm" className="h-9 px-4" disabled={loading}>
                추가
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-4 space-y-5">
          {/* 규칙 추가 섹션 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">단건 규칙 추가</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">리슨 포트</label>
                <Input
                  type="text"
                  placeholder="8080"
                  value={newRule.listenPort}
                  onChange={(e) => setNewRule({ ...newRule, listenPort: e.target.value })}
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">커넥트 주소</label>
                <Input
                  type="text"
                  placeholder="192.168.1.100"
                  value={newRule.connectAddress}
                  onChange={(e) => setNewRule({ ...newRule, connectAddress: e.target.value })}
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">커넥트 포트</label>
                <Input
                  type="text"
                  placeholder="80"
                  value={newRule.connectPort}
                  onChange={(e) => setNewRule({ ...newRule, connectPort: e.target.value })}
                  className="h-9"
                  disabled={loading}
                />
              </div>
            </div>
            <Button onClick={addCustomRule} className="mt-3 w-full h-9" size="sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" /> 규칙 추가
            </Button>
          </Card>

          <hr />

          {/* 💡 규칙 삭제 섹션 */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 text-red-600">규칙 삭제 (Port 기준)</h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-foreground mb-1.5">삭제할 리슨 포트</label>
                <Input
                  type="number"
                  placeholder="예: 8080"
                  value={deletePort}
                  onChange={(e) => setDeletePort(e.target.value)}
                  className="h-9"
                  disabled={loading}
                />
              </div>
              <Button onClick={handleDeleteRule} className="h-9 w-32" variant="destructive" size="sm" disabled={loading || !deletePort}>
                <Trash2 className="w-4 h-4 mr-2" /> 삭제
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-foreground">netsh 출력 붙여넣기 (일괄 등록)</h3>
              <Button
                onClick={handleResetRules}
                variant="outline"
                size="sm"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={loading}
              >
                <Trash2 className="w-3 h-3 mr-1" /> 전체 초기화
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">netsh int portproxy show all</code> 결과를 붙여넣으세요.
            </p>
            <Textarea
              placeholder="Listen on ipv4: ... Connect to ipv4: ..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              className="font-mono text-xs mb-3"
              disabled={loading}
            />
            <Button onClick={applyFromPaste} className="w-full h-9" size="sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" /> 붙여넣기 내용 적용
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="mt-4">
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1.5">DNS 재연결</h4>
                <p className="text-xs text-blue-700 mb-3">기존 연결이 끊겼을 때, 현재 목록의 규칙들을 다시 적용합니다.</p>
                <Button onClick={reapplyRules} disabled={rules.length === 0 || loading} size="sm" className="h-9 w-full">
                  <RefreshCw className="w-4 h-4 mr-2" /> 재적용
                </Button>
              </div>
            </div>
          </Card>

          <h3 className="text-sm font-semibold text-foreground mb-3">등록된 규칙 목록</h3>
          <Textarea
            value={rulesText}
            readOnly
            rows={15}
            className="font-mono text-xs resize-none bg-black text-green-400 border-gray-700"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
