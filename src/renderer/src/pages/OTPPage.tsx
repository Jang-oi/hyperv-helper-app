"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Check, Plus, Trash2, ChevronDown } from "lucide-react"

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
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    // 스크롤 가능 여부 체크
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
  }, [accounts])

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

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">다음 갱신까지</span>
          <span className="text-xl font-bold text-primary">{timeLeft}초</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mt-3">
          <div
            className="bg-primary h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="relative mb-4">
        <div ref={scrollAreaRef}>
          <ScrollArea className="h-[420px]">
            <div className="space-y-3 pr-4">
              {accounts.map((account) => (
                <Card key={account.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground mb-1.5">{account.alias}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-primary tracking-wider">{account.code}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(account.code, account.id)}
                        >
                          {copiedId === account.id ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 font-mono">{account.key}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
        {showScrollIndicator && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none flex items-end justify-center pb-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronDown className="w-4 h-4 animate-bounce" />
              <span>아래로 스크롤하여 더보기</span>
            </div>
          </div>
        )}
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">새 OTP 계정 추가</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">계정명</label>
            <Input
              type="text"
              placeholder="예: Google 계정 3"
              className="h-9"
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">OTP 키</label>
            <Input
              type="text"
              placeholder="예: JBSWY3DPEHPK3PXP"
              className="h-9"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleAddAccount} className="w-full" disabled={!newAlias || !newKey}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            계정 추가
          </Button>
        </div>
      </Card>
    </div>
  )
}
