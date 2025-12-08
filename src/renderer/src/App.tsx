import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "./components/Header"
import IPChangePage from "./pages/IPChangePage"
import HostnameChangePage from "./pages/HostnameChangePage"
import PortProxyPage from "./pages/PortProxyPage"
import BookmarksPage from "./pages/BookmarksPage"
import OTPPage from "./pages/OTPPage"
import NotepadPage from "./pages/NotepadPage"
import VersionPage from "./pages/VersionPage"

function App() {
  const [activePage, setActivePage] = useState("ip-change")

  const renderPage = () => {
    switch (activePage) {
      case "ip-change":
        return <IPChangePage />
      case "hostname-change":
        return <HostnameChangePage />
      case "portproxy":
        return <PortProxyPage />
      case "bookmarks":
        return <BookmarksPage />
      case "otp":
        return <OTPPage />
      case "notepad":
        return <NotepadPage />
      case "version":
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

export default App
