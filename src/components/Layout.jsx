import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <div className="main-area">
        <header className="mobile-header">
          <button
            className="menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <span>milkmoth</span>
        </header>

        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout