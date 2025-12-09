import type React from 'react'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NoteContent {
  [key: string]: string
}

export default function NotepadPage() {
  const [activeTab, setActiveTab] = useState('note-1')
  const [noteContents, setNoteContents] = useState<NoteContent>({
    'note-1': '',
    'note-2': '',
    'note-3': '',
    'note-4': '',
    'note-5': ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>, noteId: string) => {
    const newContent = e.target.value
    setNoteContents((prev) => ({
      ...prev,
      [noteId]: newContent
    }))
    // electron-store auto-save would happen here
    console.log(`[v0] Auto-saving ${noteId} to electron-store`)
  }

  const currentContent = noteContents[activeTab]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-foreground">메모장</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 ">
        <TabsList className="grid w-full grid-cols-5 mb-4 flex-shrink-0">
          <TabsTrigger value="note-1">메모 1</TabsTrigger>
          <TabsTrigger value="note-2">메모 2</TabsTrigger>
          <TabsTrigger value="note-3">메모 3</TabsTrigger>
          <TabsTrigger value="note-4">메모 4</TabsTrigger>
          <TabsTrigger value="note-5">메모 5</TabsTrigger>
        </TabsList>

        {['note-1', 'note-2', 'note-3', 'note-4', 'note-5'].map((noteId) => (
          <TabsContent key={noteId} value={noteId} className="flex-1 flex flex-col min-h-0 mt-0">
            <Card className="p-0 overflow-hidden flex-1 flex flex-col min-h-[488px]">
              <textarea
                value={noteContents[noteId]}
                onChange={(e) => handleChange(e, noteId)}
                placeholder="여기에 메모를 작성하세요..."
                className="w-full flex-1 min-h-full p-6 bg-background text-foreground resize-none focus:outline-none border-none"
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <p className="text-sm text-muted-foreground mt-4 flex-shrink-0">
        {currentContent.length} 글자 | {currentContent.split('\n').length} 줄 | electron-store를 통해 자동으로 저장됩니다
      </p>
    </div>
  )
}
