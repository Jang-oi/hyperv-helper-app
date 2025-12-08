"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function HostnameChangePage() {
  const [hostname, setHostname] = useState("")
  const [currentHostname, setCurrentHostname] = useState("DESKTOP-ABC123")

  const handleSubmit = () => {
    console.log("[v0] Hostname change submitted:", hostname)
    // Electron IPC call would go here
    setCurrentHostname(hostname)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-foreground mb-6">호스트네임 변경</h2>
      <Card className="p-6">
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">현재 호스트네임</p>
          <p className="text-lg font-medium text-foreground">{currentHostname}</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">새 호스트네임</label>
            <Input
              type="text"
              placeholder="새로운 컴퓨터 이름 입력"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={!hostname}>
            호스트네임 변경
          </Button>
          <p className="text-xs text-muted-foreground">호스트네임 변경 후 시스템 재시작이 필요할 수 있습니다.</p>
        </div>
      </Card>
    </div>
  )
}
