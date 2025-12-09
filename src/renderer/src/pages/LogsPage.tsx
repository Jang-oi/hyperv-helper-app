import { useState } from 'react'
import { Download, Terminal, Trash2 } from 'lucide-react'
import { FadeInSection } from '../components/FadeInSection'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: new Date().toISOString(), level: 'info', message: 'Application started' },
    {
      id: '2',
      timestamp: new Date().toISOString(),
      level: 'success',
      message: 'Network configuration applied successfully'
    },
    { id: '3', timestamp: new Date().toISOString(), level: 'warning', message: 'DNS server response time is high' }
  ])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      case 'success':
        return 'text-green-400'
      default:
        return 'text-stone-400'
    }
  }

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-500/10'
      case 'warning':
        return 'bg-yellow-500/10'
      case 'error':
        return 'bg-red-500/10'
      case 'success':
        return 'bg-green-500/10'
      default:
        return 'bg-stone-500/10'
    }
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const handleExportLogs = () => {
    const logText = logs.map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`).join('\n')

    // In Electron, you would use dialog.showSaveDialog and fs.writeFile
    console.log('Exporting logs:', logText)
  }

  return (
    <div className="p-10 max-w-5xl mx-auto">
      <FadeInSection>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-serif font-light text-amber-400 flex items-center gap-3">
            <Terminal className="w-8 h-8" />
            System Logs
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleExportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </FadeInSection>

      {/* Logs Container */}
      <FadeInSection delay={0.1}>
        <div className="bg-stone-900/80 rounded-lg border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-stone-800/50">
            <p className="text-sm text-stone-400">
              Total Entries: <span className="text-stone-200 font-medium">{logs.length}</span>
            </p>
          </div>

          <div className="max-h-[600px] overflow-y-auto no-scrollbar">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No logs available</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {logs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-stone-800/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <span className="text-xs text-stone-500 font-mono whitespace-nowrap mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getLevelBg(log.level)} ${getLevelColor(log.level)} uppercase`}
                      >
                        {log.level}
                      </span>
                      <p className="flex-1 text-stone-200 font-mono text-sm">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeInSection>
    </div>
  )
}
