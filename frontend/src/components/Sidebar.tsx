import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'
import { 
  LayoutDashboard, Users, Wallet, UserCog, Settings, Building2, Home, 
  ArrowDownUp, LogIn, LogOut, GraduationCap, CreditCard, Receipt, 
  BookOpen, FileText, AlertCircle, ListChecks, DollarSign, Calendar, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, hasAccess } from '../stores/useAuthStore'
import { useState } from 'react'

  const bottomMenu = [
  // Pengguna is admin-only; we'll conditionally render it below
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [kesantrianOpen, setKesantrianOpen] = useState(true)
  const [kesantrianMutasiOpen, setKesantrianMutasiOpen] = useState(false)
  const [keuanganOpen, setKeuanganOpen] = useState(true)
  const [keuanganTunggakanOpen, setKeuanganTunggakanOpen] = useState(false)
  const [keuanganPengaturanOpen, setKeuanganPengaturanOpen] = useState(false)
  const [akademikOpen, setAkademikOpen] = useState(true)
  const [dompetOpen, setDompetOpen] = useState(false)
  const location = useLocation()
  const currentUser = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const currentRole = roles?.find((r: any) => r.slug === currentUser?.role)

  const dompetActive = location.pathname.startsWith('/dompet')
  const kesantrianActive = location.pathname.startsWith('/kesantrian')
  const keuanganActive = location.pathname.startsWith('/keuangan')
  const akademikActive = location.pathname.startsWith('/akademik')
  
  // Handler untuk menampilkan sidebar saat ada sentuhan di area sidebar saat collapsed
  const handleSidebarHover = () => {
    if (!sidebarOpen) {
      toggleSidebar()
    }
  }
  return (
    <motion.aside
      initial={{ width: 260 }}
      animate={{ width: sidebarOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      onMouseEnter={handleSidebarHover}
      className="h-screen border-r border-gray-200 bg-[#F5F5F5] flex flex-col relative"
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brand" />
          {sidebarOpen && <span className="font-semibold">SIMPELS v2</span>}
        </div>
      </div>
      <nav className="px-2 space-y-1 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        {hasAccess('dashboard') && (
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
              isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          {sidebarOpen && <span>Dashboard</span>}
        </NavLink>)}

        {/* Kesantrian parent */}
        {(hasAccess('kesantrian.santri') || hasAccess('kesantrian.kelas') || hasAccess('kesantrian.asrama') || hasAccess('kesantrian.koreksi_data') || hasAccess('kesantrian.mutasi.masuk') || hasAccess('kesantrian.mutasi.keluar') || hasAccess('kesantrian.alumni')) && (
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
            {kesantrianOpen && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                    <li>
                    {hasAccess('kesantrian.santri') && (
                    <NavLink
                      to="/kesantrian/santri"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Users className="w-5 h-5" />
                      {sidebarOpen && <span>Data Santri</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('kesantrian.kelas') && (
                    <NavLink
                      to="/kesantrian/kelas"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Building2 className="w-5 h-5" />
                      {sidebarOpen && <span>Kelas</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('kesantrian.asrama') && (
                    <NavLink
                      to="/kesantrian/asrama"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Home className="w-5 h-5" />
                      {sidebarOpen && <span>Asrama</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('kesantrian.koreksi_data') && (
                    <NavLink
                      to="/kesantrian/koreksi-data"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <CheckCircle className="w-5 h-5" />
                      {sidebarOpen && <span>Koreksi Data</span>}
                    </NavLink>)}
                  </li>
                  {/* Mutasi parent dengan submenu */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setKesantrianMutasiOpen((v) => !v)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${location.pathname.startsWith('/kesantrian/mutasi') ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      <ArrowDownUp className="w-5 h-5" />
                      {sidebarOpen && <span>Mutasi</span>}
                    </button>
                    <AnimatePresence initial={false}>
                      {kesantrianMutasiOpen && sidebarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'tween', duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                              <li>
                              {hasAccess('kesantrian.mutasi.masuk') && (
                              <NavLink
                                to="/kesantrian/mutasi/masuk"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <LogIn className="w-4 h-4" />
                                  {sidebarOpen && <span>Masuk</span>}
                                </NavLink>)}
                            </li>
                              <li>
                              {hasAccess('kesantrian.mutasi.keluar') && (
                              <NavLink
                                to="/kesantrian/mutasi/keluar"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <LogOut className="w-4 h-4" />
                                  {sidebarOpen && <span>Keluar</span>}
                                </NavLink>)}
                            </li>
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                  <li>
                    {hasAccess('kesantrian.alumni') && (
                    <NavLink
                      to="/kesantrian/alumni"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <GraduationCap className="w-5 h-5" />
                      {sidebarOpen && <span>Alumni</span>}
                    </NavLink>)}
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Keuangan parent */}
        {(hasAccess('keuangan.pembayaran') || hasAccess('keuangan.transaksi-kas') || hasAccess('keuangan.buku-kas') || hasAccess('keuangan.laporan') || hasAccess('keuangan.tagihan') || hasAccess('keuangan.bukti-transfer') || hasAccess('keuangan.rekening-bank') || hasAccess('keuangan.tunggakan') || hasAccess('keuangan.pengaturan')) && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setKeuanganOpen((v) => !v)}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${keuanganActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
          >
            <Wallet className="w-5 h-5" />
            {sidebarOpen && <span>Keuangan</span>}
          </button>
          <AnimatePresence initial={false}>
            {keuanganOpen && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                  <li>
                    {hasAccess('keuangan.pembayaran') && (
                    <NavLink
                      to="/keuangan/pembayaran"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <CreditCard className="w-5 h-5" />
                      {sidebarOpen && <span>Pembayaran Santri</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('keuangan.transaksi-kas') && (
                    <NavLink
                      to="/keuangan/transaksi-kas"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Receipt className="w-5 h-5" />
                      {sidebarOpen && <span>Transaksi Kas</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('keuangan.buku-kas') && (
                    <NavLink
                      to="/keuangan/buku-kas"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <BookOpen className="w-5 h-5" />
                      {sidebarOpen && <span>Buku Kas</span>}
                    </NavLink>)}
                  </li>
                  <li>
                    {hasAccess('keuangan.laporan') && (
                      <NavLink
                        to="/keuangan/laporan"
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                        }
                      >
                        <FileText className="w-5 h-5" />
                        {sidebarOpen && <span>Laporan</span>}
                      </NavLink>
                    )}
                  </li>
                  <li>
                    {hasAccess('keuangan.tagihan') && (
                    <NavLink
                      to="/keuangan/tagihan"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <FileText className="w-5 h-5" />
                      {sidebarOpen && <span>Tagihan Santri</span>}
                    </NavLink>)}
                  </li>
                  
                  {/* Bukti Transfer */}
                  <li>
                    {hasAccess('keuangan.bukti-transfer') && (
                    <NavLink
                      to="/keuangan/bukti-transfer"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <FileText className="w-5 h-5" />
                      {sidebarOpen && <span>Bukti Transfer</span>}
                    </NavLink>)}
                  </li>
                  
                  {/* Rekening Bank */}
                  <li>
                    {hasAccess('keuangan.rekening-bank') && (
                    <NavLink
                      to="/keuangan/rekening-bank"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <CreditCard className="w-5 h-5" />
                      {sidebarOpen && <span>Rekening Bank</span>}
                    </NavLink>)}
                  </li>
                  
                  {/* Tunggakan Santri dengan submenu */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setKeuanganTunggakanOpen((v) => !v)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${location.pathname.startsWith('/keuangan/tunggakan') ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      <AlertCircle className="w-5 h-5" />
                      {sidebarOpen && <span>Tunggakan Santri</span>}
                    </button>
                    <AnimatePresence initial={false}>
                      {keuanganTunggakanOpen && sidebarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'tween', duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                            {hasAccess('keuangan.tunggakan') && (
                            <li>
                              <NavLink
                                to="/keuangan/tunggakan/mutasi"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <ArrowDownUp className="w-4 h-4" />
                                {sidebarOpen && <span>Mutasi</span>}
                              </NavLink>
                            </li>)}
                            {hasAccess('keuangan.tunggakan') && (
                            <li>
                              <NavLink
                                to="/keuangan/tunggakan/alumni"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <GraduationCap className="w-4 h-4" />
                                {sidebarOpen && <span>Alumni</span>}
                              </NavLink>
                            </li>)}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Pengaturan Keuangan dengan submenu */}
                  <li>
                    <button
                      type="button"
                      onClick={() => setKeuanganPengaturanOpen((v) => !v)}
                      className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${location.pathname.startsWith('/keuangan/pengaturan') ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
                    >
                      <Settings className="w-5 h-5" />
                      {sidebarOpen && <span>Pengaturan</span>}
                    </button>
                    <AnimatePresence initial={false}>
                      {keuanganPengaturanOpen && sidebarOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'tween', duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                            {hasAccess('keuangan.pengaturan') && (
                            <li>
                              <NavLink
                                to="/keuangan/pengaturan/jenis-tagihan"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <ListChecks className="w-4 h-4" />
                                {sidebarOpen && <span>Jenis Tagihan</span>}
                              </NavLink>
                            </li>)}
                            {hasAccess('keuangan.pengaturan') && (
                            <li>
                              <NavLink
                                to="/keuangan/pengaturan/keringanan"
                                className={({ isActive }) =>
                                  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                                }
                              >
                                <DollarSign className="w-4 h-4" />
                                {sidebarOpen && <span>Keringanan Tagihan</span>}
                              </NavLink>
                            </li>)}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Dompet Digital (top-level) */}
        {(hasAccess('dompet.dompet-santri') || hasAccess('dompet.manajemen-keuangan') || hasAccess('dompet.history') || hasAccess('dompet.laporan') || hasAccess('dompet.tagihan') || hasAccess('dompet.rfid') || hasAccess('dompet.settings') || hasAccess('dompet.manage') || hasAccess('dompet.withdrawals')) && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setDompetOpen((v) => !v)}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${dompetActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
          >
            <DollarSign className="w-5 h-5" />
                      {sidebarOpen && <span>Dompet Digital</span>}
          </button>
          <AnimatePresence initial={false}>
            {dompetOpen && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                  {hasAccess('dompet.dompet-santri') && (
                  <li>
                    <NavLink
                      to="/dompet/dompet-santri"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <CreditCard className="w-5 h-5" />
                      {sidebarOpen && <span>Dompet Santri</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.manajemen-keuangan') && (
                  <li>
                    <NavLink
                      to="/dompet/manajemen-keuangan"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <DollarSign className="w-5 h-5" />
                      {sidebarOpen && <span>Manajemen Keuangan</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.history') && (
                  <li>
                    <NavLink
                      to="/dompet/history-transaksi"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <FileText className="w-5 h-5" />
                      {sidebarOpen && <span>History Transaksi</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.laporan') && (
                  <li>
                    <NavLink
                      to="/dompet/laporan-keuangan"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Receipt className="w-5 h-5" />
                      {sidebarOpen && <span>Laporan Keuangan</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.tagihan') && (
                  <li>
                    <NavLink
                      to="/dompet/tagihan-kolektif"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Receipt className="w-5 h-5" />
                      {sidebarOpen && <span>Tagihan Kolektif</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.rfid') && (
                  <li>
                    <NavLink
                      to="/dompet/rfid"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Users className="w-5 h-5" />
                      {sidebarOpen && <span>Kelola RFID</span>}
                    </NavLink>
                  </li>)}
                  {hasAccess('dompet.settings') && (
                  <li>
                    <NavLink
                      to="/dompet/settings"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Settings className="w-5 h-5" />
                      {sidebarOpen && <span>Pengaturan Dompet</span>}
                    </NavLink>
                  </li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}

        {/* Akademik parent */}
        {hasAccess('akademik.tahun-ajaran') && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setAkademikOpen((v) => !v)}
            className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${akademikActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}
          >
            <Calendar className="w-5 h-5" />
            {sidebarOpen && <span>Akademik</span>}
          </button>
          <AnimatePresence initial={false}>
            {akademikOpen && sidebarOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="overflow-hidden"
              >
                <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">
                  {hasAccess('akademik.tahun-ajaran') && (
                  <li>
                    <NavLink
                      to="/akademik/tahun-ajaran"
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`
                      }
                    >
                      <Calendar className="w-5 h-5" />
                      {sidebarOpen && <span>Tahun Ajaran</span>}
                    </NavLink>
                  </li>)}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        )}
        <div className="border-t border-gray-200 pt-2 space-y-1">
          {sidebarOpen && hasAccess('pengguna') && (
            <NavLink to="/pengguna" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}>
              <UserCog className="w-5 h-5" />
              {sidebarOpen && <span>Pengguna</span>}
            </NavLink>
          )}
          {sidebarOpen && hasAccess('pengumuman') && (
            <NavLink to="/pengumuman" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              {sidebarOpen && <span>Pengumuman</span>}
            </NavLink>
          )}

          {bottomMenu.map((m) => {
            const Icon = m.icon
            if (!hasAccess('pengaturan')) return null
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
        </div>
        </div>
      </nav>
    </motion.aside>
  )
}