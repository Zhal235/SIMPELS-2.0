import { useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/santri': 'Santri',
  '/keuangan': 'Keuangan',
  '/absensi': 'Absensi',
  '/pengguna': 'Pengguna',
  '/pengaturan': 'Pengaturan',
}

export default function Topbar() {
  const location = useLocation()
  const { toggleSidebar } = useUIStore()
  const title = titles[location.pathname] ?? 'Halaman'
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <button className="btn btn-primary" onClick={toggleSidebar}>Menu</button>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium">Admin</div>
          <div className="text-xs text-gray-500">admin@example.com</div>
        </div>
        <img className="h-8 w-8 rounded-full" src="https://api.dicebear.com/7.x/initials/svg?seed=AZ" alt="avatar" />
      </div>
    </header>
  )
}