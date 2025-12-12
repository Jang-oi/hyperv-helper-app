import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from '@/components/ui/sonner'
import Header from './components/Header'
import BookmarksPage from './pages/BookmarksPage'
import HostnameChangePage from './pages/HostnameChangePage'
import IPChangePage from './pages/IPChangePage'
import NotepadPage from './pages/NotepadPage'
import OTPPage from './pages/OTPPage'
import PortProxyPage from './pages/PortProxyPage'
import SystemSettingsPage from './pages/SystemSettingsPage'
import VersionPage from './pages/VersionPage'

function App() {
  const [activePage, setActivePage] = useState('hostname-change')

  const renderPage = () => {
    switch (activePage) {
      case 'ip-change':
        return <IPChangePage />
      case 'hostname-change':
        return <HostnameChangePage />
      case 'portproxy':
        return <PortProxyPage />
      case 'bookmarks':
        return <BookmarksPage />
      case 'otp':
        return <OTPPage />
      case 'notepad':
        return <NotepadPage />
      case 'system-settings':
        return <SystemSettingsPage />
      case 'version':
        return <VersionPage />
      default:
        return <IPChangePage />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header activePage={activePage} onPageChange={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{
                duration: 0.2,
                ease: 'easeOut'
              }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Toaster richColors position={'top-center'} />
    </div>
  )
}

export default App
