"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function IPChangePage() {
  const [ipAddress, setIpAddress] = useState("")
  const [subnetMask, setSubnetMask] = useState("")
  const [gateway, setGateway] = useState("")
  const [dns, setDns] = useState("")

  const handleSubmit = () => {
    console.log("[v0] IP Change submitted:", { ipAddress, subnetMask, gateway, dns })
    // Electron IPC call would go here
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-foreground mb-6">IP 주소 변경</h2>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">IP 주소</label>
            <Input
              type="text"
              placeholder="예: 192.168.1.100"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">서브넷 마스크</label>
            <Input
              type="text"
              placeholder="예: 255.255.255.0"
              value={subnetMask}
              onChange={(e) => setSubnetMask(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">게이트웨이</label>
            <Input
              type="text"
              placeholder="예: 192.168.1.1"
              value={gateway}
              onChange={(e) => setGateway(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">DNS 서버</label>
            <Input type="text" placeholder="예: 8.8.8.8" value={dns} onChange={(e) => setDns(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            IP 설정 적용
          </Button>
        </div>
      </Card>
    </div>
  )
}
