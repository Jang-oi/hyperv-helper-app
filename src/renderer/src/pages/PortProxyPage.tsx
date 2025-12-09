"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Plus, RefreshCw, ChevronDown, Info } from "lucide-react"
import { toast } from "sonner"

interface ProxyRule {
  id: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export default function PortProxyPage() {
  const [rules, setRules] = useState<ProxyRule[]>([])
  const [loading, setLoading] = useState(false)

  const [wasDevHost, setWasDevHost] = useState("")
  const [sapDevHost, setSapDevHost] = useState("")
  const [sapQasHost, setSapQasHost] = useState("")

  const [newRule, setNewRule] = useState({
    listenPort: "",
    connectAddress: "",
    connectPort: "",
  })

  const [pasteText, setPasteText] = useState("")
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 실제 Windows netsh에서 규칙 조회
  const loadRules = async () => {
    setLoading(true)
    try {
      const result = await window.api.portproxy.getRules()
      if (result.success && result.rules) {
        setRules(result.rules)
      } else {
        toast.error(result.error || "규칙 조회에 실패했습니다.")
        setRules([])
      }
    } catch (error) {
      toast.error("규칙 조회 중 오류가 발생했습니다.")
      console.error(error)
      setRules([])
    } finally {
      setLoading(false)
    }
  }

  // 페이지 로드 시 규칙 조회
  useEffect(() => {
    loadRules()
  }, [])

  useEffect(() => {
    const checkScroll = () => {
      const scrollElement = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollElement) {
        const hasScroll = scrollElement.scrollHeight > scrollElement.clientHeight
        setShowScrollIndicator(hasScroll)
      }
    }

    checkScroll()
    const timer = setTimeout(checkScroll, 100)
    return () => clearTimeout(timer)
  }, [rules])

  // WAS Dev 프리셋 추가 (80, 443, 8082)
  const addWasDevRules = async () => {
    if (!wasDevHost.trim()) {
      toast.warning("IP 또는 호스트네임을 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      // 3개의 규칙을 순차적으로 추가
      const ports = [
        { listen: "80", connect: "80" },
        { listen: "443", connect: "443" },
        { listen: "8082", connect: "8082" },
      ]

      for (const port of ports) {
        const result = await window.api.portproxy.addRule(
          port.listen,
          wasDevHost.trim(),
          port.connect
        )
        if (!result.success) {
          toast.error(`포트 ${port.listen} 추가 실패: ${result.error}`)
          await loadRules()
          return
        }
      }

      toast.success("WAS Dev 규칙 3개가 추가되었습니다.")
      setWasDevHost("")
      await loadRules()
    } catch (error) {
      toast.error("WAS Dev 규칙 추가 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // SAP Dev 프리셋 추가 (3200, 3300)
  const addSapDevRules = async () => {
    if (!sapDevHost.trim()) {
      toast.warning("IP 또는 호스트네임을 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      const ports = [
        { listen: "3200", connect: "3200" },
        { listen: "3300", connect: "3300" },
      ]

      for (const port of ports) {
        const result = await window.api.portproxy.addRule(
          port.listen,
          sapDevHost.trim(),
          port.connect
        )
        if (!result.success) {
          toast.error(`포트 ${port.listen} 추가 실패: ${result.error}`)
          await loadRules()
          return
        }
      }

      toast.success("SAP Dev 규칙 2개가 추가되었습니다.")
      setSapDevHost("")
      await loadRules()
    } catch (error) {
      toast.error("SAP Dev 규칙 추가 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // SAP QAS 프리셋 추가 (3201→3200, 3301→3300)
  const addSapQasRules = async () => {
    if (!sapQasHost.trim()) {
      toast.warning("IP 또는 호스트네임을 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      const ports = [
        { listen: "3201", connect: "3200" },
        { listen: "3301", connect: "3300" },
      ]

      for (const port of ports) {
        const result = await window.api.portproxy.addRule(
          port.listen,
          sapQasHost.trim(),
          port.connect
        )
        if (!result.success) {
          toast.error(`포트 ${port.listen} 추가 실패: ${result.error}`)
          await loadRules()
          return
        }
      }

      toast.success("SAP QAS 규칙 2개가 추가되었습니다.")
      setSapQasHost("")
      await loadRules()
    } catch (error) {
      toast.error("SAP QAS 규칙 추가 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 커스텀 단일 규칙 추가
  const addCustomRule = async () => {
    if (!newRule.listenPort || !newRule.connectAddress || !newRule.connectPort) {
      toast.warning("모든 필드를 입력해주세요.")
      return
    }

    setLoading(true)
    try {
      const result = await window.api.portproxy.addRule(
        newRule.listenPort.trim(),
        newRule.connectAddress.trim(),
        newRule.connectPort.trim()
      )

      if (result.success) {
        toast.success("규칙이 추가되었습니다.")
        setNewRule({ listenPort: "", connectAddress: "", connectPort: "" })
        await loadRules()
      } else {
        toast.error(result.error || "규칙 추가에 실패했습니다.")
      }
    } catch (error) {
      toast.error("규칙 추가 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // netsh 출력 붙여넣기로 일괄 등록
  const addFromPaste = async () => {
    if (!pasteText.trim()) {
      toast.warning("netsh 출력 내용을 붙여넣어주세요.")
      return
    }

    const lines = pasteText.split("\n")
    const parsedRules: { listenPort: string; connectAddress: string; connectPort: string }[] = []

    lines.forEach((line) => {
      const trimmed = line.trim()
      const parts = trimmed.split(/\s+/)
      // 0.0.0.0 포트 주소 포트 형식 파싱
      if (parts.length >= 4 && parts[1].match(/^\d+$/)) {
        parsedRules.push({
          listenPort: parts[1],
          connectAddress: parts[2],
          connectPort: parts[3],
        })
      }
    })

    if (parsedRules.length === 0) {
      toast.warning("유효한 규칙을 찾을 수 없습니다.")
      return
    }

    setLoading(true)
    try {
      let successCount = 0
      for (const rule of parsedRules) {
        const result = await window.api.portproxy.addRule(
          rule.listenPort,
          rule.connectAddress,
          rule.connectPort
        )
        if (result.success) {
          successCount++
        }
      }

      toast.success(`${successCount}개의 규칙이 추가되었습니다.`)
      setPasteText("")
      await loadRules()
    } catch (error) {
      toast.error("일괄 등록 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // DNS 재연결 (모든 규칙 재적용)
  const reapplyRules = async () => {
    if (rules.length === 0) {
      toast.warning("재적용할 규칙이 없습니다.")
      return
    }

    setLoading(true)
    try {
      const result = await window.api.portproxy.applyRules(rules)
      if (result.success) {
        toast.success("모든 규칙이 재적용되었습니다.")
        await loadRules()
      } else {
        toast.error(result.error || "규칙 재적용에 실패했습니다.")
      }
    } catch (error) {
      toast.error("규칙 재적용 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 단일 규칙 삭제
  const deleteRule = async (listenPort: string) => {
    setLoading(true)
    try {
      const result = await window.api.portproxy.deleteRule(listenPort)
      if (result.success) {
        toast.success(`포트 ${listenPort} 규칙이 삭제되었습니다.`)
        await loadRules()
      } else {
        toast.error(result.error || "규칙 삭제에 실패했습니다.")
      }
    } catch (error) {
      toast.error("규칙 삭제 중 오류가 발생했습니다.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4">
      <h2 className="text-2xl font-bold text-foreground mb-5">PortProxy 설정</h2>

      <Tabs defaultValue="default" className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-10">
          <TabsTrigger value="default">프리셋</TabsTrigger>
          <TabsTrigger value="custom">커스텀</TabsTrigger>
          <TabsTrigger value="paste">일괄등록</TabsTrigger>
          <TabsTrigger value="current">현재 규칙 ({rules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="space-y-3 mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-32 flex-shrink-0">
                <h3 className="text-sm font-semibold text-foreground">WAS Dev</h3>
                <p className="text-xs text-muted-foreground">80, 443, 8082</p>
              </div>
              <Input
                placeholder="IP 또는 호스트네임"
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
                placeholder="IP 또는 호스트네임"
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
                <p className="text-xs text-muted-foreground">3201→3200, 3301→3300</p>
              </div>
              <Input
                placeholder="IP 또는 호스트네임"
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

        <TabsContent value="custom" className="mt-4">
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
              <Plus className="w-4 h-4 mr-2" />
              규칙 추가
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="paste" className="mt-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">netsh 출력 붙여넣기</h3>
            <p className="text-xs text-muted-foreground mb-3">
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">netsh int portproxy show all</code> 결과를
              붙여넣으세요.
            </p>
            <Textarea
              placeholder="Listen on ipv4:             Connect to ipv4:&#10;&#10;Address         Port        Address         Port&#10;--------------- ----------  --------------- ----------&#10;0.0.0.0         8080        192.168.1.100   80"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              className="font-mono text-xs mb-3"
              disabled={loading}
            />
            <Button onClick={addFromPaste} className="w-full h-9" size="sm" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              붙여넣기 내용 적용
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="current" className="mt-4">
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1.5">DNS 재연결이란?</h4>
                <p className="text-xs text-blue-700 mb-3">
                  서버 이중화나 DNS 변경으로 기존 연결이 끊겼을 때, 현재 등록된 모든 규칙을 다시 적용하여 연결을
                  복구합니다. SAP 서버나 WAS가 페일오버되어 DNS가 변경된 경우 유용합니다.
                </p>
                <Button onClick={reapplyRules} disabled={rules.length === 0 || loading} size="sm" className="h-9 w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  DNS 재연결 (모든 규칙 재적용)
                </Button>
              </div>
            </div>
          </Card>

          <h3 className="text-sm font-semibold text-foreground mb-3">등록된 규칙 ({rules.length})</h3>
          {loading ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">규칙을 불러오는 중...</p>
            </Card>
          ) : rules.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">등록된 규칙이 없습니다.</p>
            </Card>
          ) : (
            <div ref={scrollAreaRef} className="relative">
              <ScrollArea className="h-[320px]">
                <div className="space-y-2.5 pr-3">
                  {rules.map((rule) => (
                    <Card key={rule.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">리슨 포트</p>
                            <p className="text-sm font-semibold text-foreground">{rule.listenPort}</p>
                          </div>
                          <span className="text-muted-foreground">→</span>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">커넥트 대상</p>
                            <p className="text-sm font-semibold text-foreground">
                              {rule.connectAddress}:{rule.connectPort}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.listenPort)}
                          className="h-8 w-8 p-0"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              {showScrollIndicator && (
                <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end justify-center pointer-events-none">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/90 px-2 py-1 rounded">
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                    <span>아래로 스크롤</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
