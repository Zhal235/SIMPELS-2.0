import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'
import { LayoutDashboard, Users, Wallet, CalendarCheck, UserCog, Settings, Building2, Home, ArrowDownUp, LogIn, LogOut, GraduationCap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  // Kesantrian akan dibuat sebagai parent collapsible, submenus di bawah
  { to: '/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/absensi', label: 'Absensi', icon: CalendarCheck },
  { to: '/pengguna', label: 'Pengguna', icon: UserCog },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen } = useUIStore()
  const [kesantrianOpen, setKesantrianOpen] = useState(true)
  const location = useLocation()
  const kesantrianActive = location.pathname.startsWith('/kesantrian')
  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="h-screen border-r border-gray-200 bg-[#F5F5F5]"
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brand" />
          {sidebarOpen && <span className="font-semibold">SIMPELS v2</span>}
        </div>
      </div>
      <nav className="px-2 space-y-1">
        {/* Kesantrian parent */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setKesantrianOpen((v) => !v)}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${kesantrianActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
          >
            <Users className="w-5 h-5" />
            {sidebarOpen && <span>Kesantrian</span>}
          </button>
          <AnimatePresence initial={false}>
            {kesantrianOpen && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="ml-1 space-y-1 overflow-hidden"
              >
                <li>
                  <NavLink
                    to="/kesantrian/santri"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <Users className="w-5 h-5" />
                    {sidebarOpen && <span>Data Santri</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/kesantrian/kelas"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <Building2 className="w-5 h-5" />
                    {sidebarOpen && <span>Kelas</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/kesantrian/asrama"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <Home className="w-5 h-5" />
                    {sidebarOpen && <span>Asrama</span>}
                  </NavLink>
                </li>
                {/* Mutasi group header (non-clickable) */}
                <li>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-500">
                    <ArrowDownUp className="w-5 h-5" />
                    {sidebarOpen && <span>Mutasi</span>}
                  </div>
                </li>
                <li>
                  <NavLink
                    to="/kesantrian/mutasi/masuk"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <LogIn className="w-5 h-5" />
                    {sidebarOpen && <span>Masuk</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/kesantrian/mutasi/keluar"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <LogOut className="w-5 h-5" />
                    {sidebarOpen && <span>Keluar</span>}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/kesantrian/alumni"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                    }
                  >
                    <GraduationCap className="w-5 h-5" />
                    {sidebarOpen && <span>Alumni</span>}
                  </NavLink>
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        {menu.map((m) => {
          const Icon = m.icon
          return (
            <NavLink
              key={m.to}
              to={m.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span>{m.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </motion.aside>
  )
}