import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { useAuthStore } from '../stores/useAuthStore'
import AnnouncementBadge from './AnnouncementBadge'

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleSidebar } = useUIStore()
  const { user, logout } = useAuthStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors"
          >
            <div className="text-right">
              <div className="text-sm font-medium">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500">{user?.email || 'user@example.com'}</div>
            </div>
            <img 
              className="h-8 w-8 rounded-full" 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} 
              alt="avatar" 
            />
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  <div className="text-gray-500">{user?.email || 'user@example.com'}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Role: {user?.role || 'user'}
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowDropdown(false)
                    navigate('/pengaturan')
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pengaturan
                </button>
                
                <hr className="my-1" />
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}