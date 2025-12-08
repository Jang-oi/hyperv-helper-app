"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Trash2, Plus } from "lucide-react"

interface ProxyRule {
  id: string
  listenPort: string
  connectAddress: string
  connectPort: string
}

export default function PortProxyPage() {
  const [rules, setRules] = useState<ProxyRule[]>([
    {
      id: "1",
      listenPort: "8080",
      connectAddress: "192.168.1.100",
      connectPort: "80",
    },
  ])
  const [newRule, setNewRule] = useState({
    listenPort: "",
    connectAddress: "",
    connectPort: "",
  })

  const addRule = () => {
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

  const deleteRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id))
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">PortProxy 설정</h2>

      {/* Add New Rule */}
      <Card className="p-6 mb-6">
        <h3 className="text-base font-semibold text-foreground mb-5">새 규칙 추가</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">수신 포트</label>
            <Input
              type="text"
              placeholder="8080"
              value={newRule.listenPort}
              onChange={(e) => setNewRule({ ...newRule, listenPort: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">연결 주소</label>
            <Input
              type="text"
              placeholder="192.168.1.100"
              value={newRule.connectAddress}
              onChange={(e) => setNewRule({ ...newRule, connectAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">연결 포트</label>
            <Input
              type="text"
              placeholder="80"
              value={newRule.connectPort}
              onChange={(e) => setNewRule({ ...newRule, connectPort: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={addRule} className="mt-5 w-full">
          <Plus className="w-4 h-4 mr-2" />
          규칙 추가
        </Button>
      </Card>

      {/* Existing Rules */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">현재 규칙</h3>
        {rules.map((rule) => (
          <Card key={rule.id} className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">수신 포트</p>
                  <p className="text-sm font-semibold text-foreground">{rule.listenPort}</p>
                </div>
                <span className="text-muted-foreground text-lg">→</span>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">연결 대상</p>
                  <p className="text-sm font-semibold text-foreground">
                    {rule.connectAddress}:{rule.connectPort}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
