"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Trash2, ExternalLink, Plus } from "lucide-react"

interface Bookmark {
  id: string
  title: string
  url: string
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: "1", title: "Hyper-V 관리자", url: "https://docs.microsoft.com/hyper-v" },
    { id: "2", title: "PowerShell 문서", url: "https://docs.microsoft.com/powershell" },
  ])
  const [newBookmark, setNewBookmark] = useState({ title: "", url: "" })

  const addBookmark = () => {
    if (newBookmark.title && newBookmark.url) {
      setBookmarks([...bookmarks, { id: Date.now().toString(), ...newBookmark }])
      setNewBookmark({ title: "", url: "" })
    }
  }

  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
  }

  const openBookmark = (url: string) => {
    console.log("[v0] Opening bookmark:", url)
    // Electron shell.openExternal would go here
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-foreground mb-6">북마크 설정</h2>

      {/* Add New Bookmark */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-medium text-foreground mb-4">새 북마크 추가</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">제목</label>
            <Input
              type="text"
              placeholder="북마크 제목"
              value={newBookmark.title}
              onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">URL</label>
            <Input
              type="text"
              placeholder="https://example.com"
              value={newBookmark.url}
              onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={addBookmark} className="mt-4 w-full">
          <Plus className="w-4 h-4 mr-2" />
          북마크 추가
        </Button>
      </Card>

      {/* Bookmark List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bookmarks.map((bookmark) => (
          <Card key={bookmark.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground mb-1">{bookmark.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{bookmark.url}</p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="ghost" size="sm" onClick={() => openBookmark(bookmark.url)}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteBookmark(bookmark.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
