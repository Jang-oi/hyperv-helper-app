"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Trash2, Plus, RefreshCw, ChevronDown, Info } from "lucide-react"

interface ProxyRule {
  id: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export default function PortProxyPage() {
  const [rules, setRules] = useState<ProxyRule[]>([])

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

  const addWasDevRules = () => {
    if (!wasDevHost.trim()) return
    const newRules: ProxyRule[] = [
      { id: `was-80-${Date.now()}`, listenPort: "80", connectAddress: wasDevHost, connectPort: "80" },
      { id: `was-443-${Date.now()}`, listenPort: "443", connectAddress: wasDevHost, connectPort: "443" },
      { id: `was-8082-${Date.now()}`, listenPort: "8082", connectAddress: wasDevHost, connectPort: "8082" },
    ]
    setRules([...rules, ...newRules])
    setWasDevHost("")
  }

  const addSapDevRules = () => {
    if (!sapDevHost.trim()) return
    const newRules: ProxyRule[] = [
      { id: `sapdev-3200-${Date.now()}`, listenPort: "3200", connectAddress: sapDevHost, connectPort: "3200" },
      { id: `sapdev-3300-${Date.now()}`, listenPort: "3300", connectAddress: sapDevHost, connectPort: "3300" },
    ]
    setRules([...rules, ...newRules])
    setSapDevHost("")
  }

  const addSapQasRules = () => {
    if (!sapQasHost.trim()) return
    const newRules: ProxyRule[] = [
      { id: `sapqas-3201-${Date.now()}`, listenPort: "3201", connectAddress: sapQasHost, connectPort: "3200" },
      { id: `sapqas-3301-${Date.now()}`, listenPort: "3301", connectAddress: sapQasHost, connectPort: "3300" },
    ]
    setRules([...rules, ...newRules])
    setSapQasHost("")
  }

  const addCustomRule = () => {
    if (newRule.listenPort && newRule.connectAddress && newRule.connectPort) {
      setRules([
        ...rules,
        {
          id: Date.now().toString(),
          ...newRule,
        },
      ])
      setNewRule({ listenPort: "", connectAddress: "", connectPort: "" })
    }
  }

  const addFromPaste = () => {
    if (!pasteText.trim()) return

    const lines = pasteText.split("\n")
    const parsedRules: ProxyRule[] = []

    lines.forEach((line) => {
      const trimmed = line.trim()
      const parts = trimmed.split(/\s+/)
      if (parts.length >= 4 && parts[1].match(/^\d+$/)) {
        parsedRules.push({
          id: `paste-${Date.now()}-${Math.random()}`,
          listenPort: parts[1],
          connectAddress: parts[2],
          connectPort: parts[3],
        })
      }
    })

    if (parsedRules.length > 0) {
      setRules([...rules, ...parsedRules])
      setPasteText("")
    }
  }

  const reapplyRules = async () => {
    try {
      const result = await window.api.portproxy.applyRules(rules)
      if (result.success) {
        console.log("모든 PortProxy 규칙이 성공적으로 재적용되었습니다.")
      } else {
        console.error("PortProxy 규칙 재적용 실패:", result.error)
      }
    } catch (error) {
      console.error("PortProxy 규칙 재적용 중 오류 발생:", error)
    }
  }

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
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
              />
              <Button onClick={addWasDevRules} size="sm" className="h-9 px-4">
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
              />
              <Button onClick={addSapDevRules} size="sm" className="h-9 px-4">
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
              />
              <Button onClick={addSapQasRules} size="sm" className="h-9 px-4">
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
                />
              </div>
            </div>
            <Button onClick={addCustomRule} className="mt-3 w-full h-9" size="sm">
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
            />
            <Button onClick={addFromPaste} className="w-full h-9" size="sm">
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
                <Button onClick={reapplyRules} disabled={rules.length === 0} size="sm" className="h-9 w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  DNS 재연결 (모든 규칙 재적용)
                </Button>
              </div>
            </div>
          </Card>

          <h3 className="text-sm font-semibold text-foreground mb-3">등록된 규칙 ({rules.length})</h3>
          {rules.length === 0 ? (
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
                        <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)} className="h-8 w-8 p-0">
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
