"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Save, FileDown } from "lucide-react"

export default function NotepadPage() {
  const [content, setContent] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    // electron-store auto-save would happen here
    console.log("[v0] Auto-saving to electron-store")
  }

  const handleSave = () => {
    console.log("[v0] Saving note:", content)
    // Electron file save would go here
  }

  const handleExport = () => {
    console.log("[v0] Exporting note")
    // Electron file export would go here
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">메모장</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="w-4 h-4 mr-2" />
            내보내기
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            저장
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="여기에 메모를 작성하세요..."
          className="w-full h-[calc(100vh-250px)] p-6 bg-background text-foreground resize-none focus:outline-none border-none"
        />
      </Card>

      <p className="text-sm text-muted-foreground mt-4">
        {content.length} 글자 | {content.split("\n").length} 줄 | electron-store를 통해 자동으로 저장됩니다
      </p>
    </div>
  )
}
