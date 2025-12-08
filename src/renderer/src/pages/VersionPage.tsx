"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle } from "lucide-react"

interface UpdateLog {
  version: string
  date: string
  changes: string[]
}

const updateHistory: UpdateLog[] = [
  {
    version: "1.2.0",
    date: "2024-01-15",
    changes: ["OTP 기능 추가", "UI 개선", "버그 수정"],
  },
  {
    version: "1.1.0",
    date: "2023-12-10",
    changes: ["북마크 기능 추가", "PortProxy 설정 기능 개선"],
  },
  {
    version: "1.0.0",
    date: "2023-11-01",
    changes: ["초기 릴리즈", "IP 변경 기능", "호스트네임 변경 기능"],
  },
]

export default function VersionPage() {
  const currentVersion = "1.2.0"
  const isLatest = true

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-foreground mb-6">버전 정보</h2>

      {/* Current Version */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">현재 버전</p>
            <p className="text-3xl font-bold text-foreground">{currentVersion}</p>
          </div>
          <div className="flex items-center gap-2">
            {isLatest ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">최신 버전</span>
              </div>
            ) : (
              <Button>
                <Download className="w-4 h-4 mr-2" />
                업데이트
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Update History */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">업데이트 내역</h3>
        {updateHistory.map((update) => (
          <Card key={update.version} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-lg font-semibold text-foreground">버전 {update.version}</h4>
                <p className="text-sm text-muted-foreground">{update.date}</p>
              </div>
            </div>
            <ul className="space-y-2">
              {update.changes.map((change, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-primary mt-1">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
