"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Check, Plus, Trash2 } from "lucide-react"

interface OTPAccount {
  id: string
  alias: string
  key: string
  code: string
}

export default function OTPPage() {
  const [accounts, setAccounts] = useState<OTPAccount[]>([
    {
      id: "1",
      alias: "Google 계정 1",
      key: "JBSWY3DPEHPK3PXP",
      code: "123456",
    },
    {
      id: "2",
      alias: "Google 계정 2",
      key: "HXDMVJECJJWSRB3H",
      code: "654321",
    },
  ])
  const [timeLeft, setTimeLeft] = useState(30)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // New account form
  const [newAlias, setNewAlias] = useState("")
  const [newKey, setNewKey] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setAccounts((prevAccounts) =>
            prevAccounts.map((account) => ({
              ...account,
              code: Math.floor(100000 + Math.random() * 900000).toString(),
            })),
          )
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleAddAccount = () => {
    if (newAlias && newKey) {
      const newAccount: OTPAccount = {
        id: Date.now().toString(),
        alias: newAlias,
        key: newKey,
        code: Math.floor(100000 + Math.random() * 900000).toString(),
      }
      setAccounts([...accounts, newAccount])
      setNewAlias("")
      setNewKey("")
    }
  }

  const handleDeleteAccount = (id: string) => {
    setAccounts(accounts.filter((account) => account.id !== id))
  }

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const progress = (timeLeft / 30) * 100

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">OTP 관리</h2>

      <Card className="p-6 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">다음 갱신까지</span>
            <span className="text-2xl font-bold text-primary">{timeLeft}초</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Card>

      <ScrollArea className="h-[350px] mb-6">
        <div className="space-y-4 pr-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">{account.alias}</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-bold text-primary tracking-wider">{account.code}</p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(account.code, account.id)}>
                      {copiedId === account.id ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">{account.key}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAccount(account.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-foreground mb-5">새 OTP 계정 추가</h3>
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">계정명 (Alias)</label>
            <Input
              type="text"
              placeholder="예: Google 계정 3"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">OTP 키</label>
            <Input
              type="text"
              placeholder="예: JBSWY3DPEHPK3PXP"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <Button onClick={handleAddAccount} className="w-full" disabled={!newAlias || !newKey}>
            <Plus className="w-4 h-4 mr-2" />
            OTP 계정 추가
          </Button>
        </div>
      </Card>
    </div>
  )
}
