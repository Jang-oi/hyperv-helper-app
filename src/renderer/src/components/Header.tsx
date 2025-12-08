import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface MenuItem {
  label: string
  id: string
  children?: { label: string; id: string }[]
}

const menuItems: MenuItem[] = [
  {
    label: "인프라",
    id: "infrastructure",
    children: [
      { label: "IP 변경", id: "ip-change" },
      { label: "호스트네임 변경", id: "hostname-change" },
      { label: "PortProxy 설정", id: "portproxy" },
      { label: "북마크 설정", id: "bookmarks" },
    ],
  },
  {
    label: "OTP",
    id: "otp",
  },
  {
    label: "메모장",
    id: "notepad",
  },
  {
    label: "버전 조회",
    id: "version",
  },
]

interface HeaderProps {
  activePage: string
  onPageChange: (pageId: string) => void
}

export default function Header({ activePage, onPageChange }: HeaderProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const handleMenuClick = (menuItem: MenuItem) => {
    if (menuItem.children) {
      setOpenDropdown(openDropdown === menuItem.id ? null : menuItem.id)
    } else {
      onPageChange(menuItem.id)
      setOpenDropdown(null)
    }
  }

  const handleSubMenuClick = (id: string) => {
    onPageChange(id)
    setOpenDropdown(null)
  }

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 drag-region">
      <div className="mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0 no-drag">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Hyper-V Help</h1>
        </div>

        {/* Center Navigation */}
        <nav className="flex items-center gap-1 no-drag">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleMenuClick(item)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                  activePage === item.id || (item.children && item.children.some((child) => child.id === activePage))
                    ? "text-primary bg-secondary"
                    : "text-foreground hover:text-primary hover:bg-secondary/50"
                }`}
              >
                {item.label}
                {item.children && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${openDropdown === item.id ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {item.children && openDropdown === item.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg overflow-hidden"
                  >
                    {item.children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => handleSubMenuClick(child.id)}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                          activePage === child.id
                            ? "text-primary bg-secondary font-medium"
                            : "text-foreground hover:bg-secondary/50"
                        }`}
                      >
                        {child.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Right spacer for balance */}
        <div className="flex-shrink-0 w-32" />
      </div>
    </header>
  )
}
