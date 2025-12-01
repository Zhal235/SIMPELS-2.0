import { Link, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'
import AnnouncementBadge from './AnnouncementBadge'

export default function Topbar() {
  const location = useLocation()
  const { toggleSidebar } = useUIStore()

  // Build breadcrumb based on pathname
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs: { name: string; to: string }[] = (() => {
    if (segments.length === 0) return [{ name: 'Dashboard', to: '/' }]
    if (segments[0] === 'kesantrian') {
      const items: { name: string; to: string }[] = [{ name: 'Kesantrian', to: '/kesantrian' }]
      if (segments[1] === 'mutasi') {
        items.push({ name: 'Mutasi', to: '/kesantrian/mutasi' })
        if (segments[2] === 'masuk') items.push({ name: 'Masuk', to: '/kesantrian/mutasi/masuk' })
        else if (segments[2] === 'keluar') items.push({ name: 'Keluar', to: '/kesantrian/mutasi/keluar' })
        return items
      }
      const subMap: Record<string, string> = {
        santri: 'Data Santri',
        kelas: 'Kelas',
        asrama: 'Asrama',
        alumni: 'Alumni',
      }
      const label = subMap[segments[1]] ?? ''
      if (label) items.push({ name: label, to: `/kesantrian/${segments[1]}` })
      return items
    }
    const topMap: Record<string, string> = {
      '': 'Dashboard',
      keuangan: 'Keuangan',
      absensi: 'Absensi',
      pengguna: 'Pengguna',
      pengaturan: 'Pengaturan',
    }
    const name = topMap[segments[0]] ?? 'Halaman'
    return [{ name, to: `/${segments[0]}` }]
  })()

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={toggleSidebar}>Menu</button>
        <nav className="flex items-center gap-2 text-sm">
          {breadcrumbs.map((bc, idx) => (
            <span key={idx} className="inline-flex items-center gap-2">
              <Link to={bc.to} className="text-gray-800 font-medium hover:text-brand">{bc.name}</Link>
              {idx < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <AnnouncementBadge />
        <div className="text-right">
          <div className="text-sm font-medium">Admin</div>
          <div className="text-xs text-gray-500">admin@example.com</div>
        </div>
        <img className="h-8 w-8 rounded-full" src="https://api.dicebear.com/7.x/initials/svg?seed=AZ" alt="avatar" />
      </div>
    </header>
  )
}