import { NavLink } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'
import { LayoutDashboard, Users, Wallet, CalendarCheck, UserCog, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

const menu = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/santri', label: 'Santri', icon: Users },
  { to: '/keuangan', label: 'Keuangan', icon: Wallet },
  { to: '/absensi', label: 'Absensi', icon: CalendarCheck },
  { to: '/pengguna', label: 'Pengguna', icon: UserCog },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen } = useUIStore()
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