import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Shirt,
  Receipt,
  Settings,
  LogOut,
  X,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

function Sidebar({ mobileOpen, closeMobile }) {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  const navigation = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Products',
      path: '/products',
      icon: Shirt,
    },
    {
      name: 'Sales',
      path: '/sales',
      icon: Receipt,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ]

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`sidebar ${
          mobileOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="sidebar-header">
          <div>
            <h1>milkmoth</h1>
            <span>POS</span>
          </div>

          <button
            className="sidebar-close"
            onClick={closeMobile}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive ? 'nav-item-active' : ''
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} strokeWidth={1.8} />
          <span>Sign out</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar