import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../stores/useUIStore'
import {
  LayoutDashboard, Users, Wallet, UserCog, Settings, Building2, Home,
  ArrowDownUp, LogIn, LogOut, GraduationCap, CreditCard, Receipt,
  BookOpen, FileText, AlertCircle, ListChecks, DollarSign, Calendar, CheckCircle, Briefcase, Megaphone, MessageCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, hasAccess } from '../stores/useAuthStore'
import { useState, useEffect } from 'react'
import { SidebarSection, SidebarNavLink } from './SidebarHelpers'

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const [kesantrianOpen, setKesantrianOpen] = useState(false)
  const [kesantrianMutasiOpen, setKesantrianMutasiOpen] = useState(false)
  const [keuanganOpen, setKeuanganOpen] = useState(false)
  const [keuanganTunggakanOpen, setKeuanganTunggakanOpen] = useState(false)
  const [keuanganPengaturanOpen, setKeuanganPengaturanOpen] = useState(false)
  const [dompetOpen, setDompetOpen] = useState(false)
  const [akademikOpen, setAkademikOpen] = useState(false)
  const [kepegawaianOpen, setKepegawaianOpen] = useState(false)
  const location = useLocation()

  const isPath = (p: string) => location.pathname.startsWith(p)

  useEffect(() => {
    const p = location.pathname
    if (p.startsWith('/kesantrian')) setKesantrianOpen(true)
    if (p.startsWith('/kesantrian/mutasi')) setKesantrianMutasiOpen(true)
    if (p.startsWith('/keuangan')) setKeuanganOpen(true)
    if (p.startsWith('/keuangan/tunggakan')) setKeuanganTunggakanOpen(true)
    if (p.startsWith('/keuangan/pengaturan')) setKeuanganPengaturanOpen(true)
    if (p.startsWith('/dompet')) setDompetOpen(true)
    if (p.startsWith('/akademik')) setAkademikOpen(true)
    if (p.startsWith('/kepegawaian')) setKepegawaianOpen(true)
  }, [])

  const nl = (to: string, icon: any, label: string) => (
    <NavLink to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}>
      {(() => { const Icon = icon; return <Icon className="w-4 h-4" /> })()}{sidebarOpen && <span>{label}</span>}
    </NavLink>
  )

  const collapse = (open: boolean, children: React.ReactNode) => (
    <AnimatePresence initial={false}>
      {open && sidebarOpen && (
        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{type:'tween',duration:0.2}} className="overflow-hidden">
          <ul className="ml-5 space-y-1 border-l border-gray-300 pl-3">{children}</ul>
        </motion.div>
      )}
    </AnimatePresence>
  )

  const parentBtn = (label: string, icon: any, active: boolean, onToggle: () => void) => {
    const Icon = icon
    return <button type="button" onClick={onToggle} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? 'bg-white text-brand shadow-sm' : 'text-gray-700 hover:bg-white'}`}><Icon className="w-5 h-5" />{sidebarOpen && <span>{label}</span>}</button>
  }

  return (
    <motion.aside initial={{width:260}} animate={{width:sidebarOpen?260:72}} transition={{type:'spring',stiffness:200,damping:25}}
      onMouseEnter={() => { if(!sidebarOpen) toggleSidebar() }}
      className="h-screen border-r border-gray-200 bg-[#F5F5F5] flex flex-col relative">
      <div className="px-4 py-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded bg-brand" />{sidebarOpen && <span className="font-semibold">SIMPELS v2</span>}</div></div>
      <nav className="px-2 space-y-1 flex flex-col h-[calc(100vh-64px)]">
        <div className="flex-1 space-y-1 overflow-y-auto">
          {hasAccess('dashboard') && <SidebarNavLink to="/" icon={LayoutDashboard} label="Dashboard" open={sidebarOpen} />}
          {(hasAccess('pengumuman')||hasAccess('pengumuman.edit')||hasAccess('pengumuman.delete')) && <SidebarNavLink to="/pengumuman" icon={Megaphone} label="Pengumuman" open={sidebarOpen} />}

          {/* Kesantrian */}
          {(hasAccess('kesantrian.santri')||hasAccess('kesantrian.kelas')||hasAccess('kesantrian.asrama')||hasAccess('kesantrian.koreksi_data')||hasAccess('kesantrian.mutasi.masuk')||hasAccess('kesantrian.mutasi.keluar')||hasAccess('kesantrian.alumni')) && (
            <div className="space-y-1">
              {parentBtn('Kesantrian', Users, isPath('/kesantrian'), () => setKesantrianOpen(v=>!v))}
              {collapse(kesantrianOpen, <>
                {hasAccess('kesantrian.santri') && <li>{nl('/kesantrian/santri', Users, 'Data Santri')}</li>}
                {hasAccess('kesantrian.kelas') && <li>{nl('/kesantrian/kelas', Building2, 'Kelas')}</li>}
                {hasAccess('kesantrian.asrama') && <li>{nl('/kesantrian/asrama', Home, 'Asrama')}</li>}
                {hasAccess('kesantrian.koreksi_data') && <li>{nl('/kesantrian/koreksi-data', CheckCircle, 'Koreksi Data')}</li>}
                {(hasAccess('kesantrian.mutasi.masuk')||hasAccess('kesantrian.mutasi.keluar')) && (
                  <li>
                    <button type="button" onClick={()=>setKesantrianMutasiOpen(v=>!v)} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isPath('/kesantrian/mutasi')?'bg-white text-brand shadow-sm':'text-gray-700 hover:bg-white'}`}>
                      <ArrowDownUp className="w-4 h-4" />{sidebarOpen && <span>Mutasi</span>}
                    </button>
                    {collapse(kesantrianMutasiOpen, <>
                      {hasAccess('kesantrian.mutasi.masuk') && <li>{nl('/kesantrian/mutasi/masuk', LogIn, 'Masuk')}</li>}
                      {hasAccess('kesantrian.mutasi.keluar') && <li>{nl('/kesantrian/mutasi/keluar', LogOut, 'Keluar')}</li>}
                    </>)}
                  </li>
                )}
                {hasAccess('kesantrian.alumni') && <li>{nl('/kesantrian/alumni', GraduationCap, 'Alumni')}</li>}
              </>)}
            </div>
          )}

          {/* Keuangan */}
          {(hasAccess('keuangan.pembayaran')||hasAccess('keuangan.transaksi-kas')||hasAccess('keuangan.buku-kas')||hasAccess('keuangan.laporan')||hasAccess('keuangan.tagihan')||hasAccess('keuangan.bukti-transfer')||hasAccess('keuangan.rekening-bank')||hasAccess('keuangan.tunggakan')||hasAccess('keuangan.pengaturan')) && (
            <div className="space-y-1">
              {parentBtn('Keuangan', Wallet, isPath('/keuangan'), () => setKeuanganOpen(v=>!v))}
              {collapse(keuanganOpen, <>
                {hasAccess('keuangan.pembayaran') && <li>{nl('/keuangan/pembayaran', CreditCard, 'Pembayaran Santri')}</li>}
                {hasAccess('keuangan.transaksi-kas') && <li>{nl('/keuangan/transaksi-kas', Receipt, 'Transaksi Kas')}</li>}
                {hasAccess('keuangan.buku-kas') && <li>{nl('/keuangan/buku-kas', BookOpen, 'Buku Kas')}</li>}
                {hasAccess('keuangan.laporan') && <li>{nl('/keuangan/laporan', FileText, 'Laporan')}</li>}
                {hasAccess('keuangan.tagihan') && <li>{nl('/keuangan/tagihan', FileText, 'Tagihan Santri')}</li>}
                {hasAccess('keuangan.bukti-transfer') && <li>{nl('/keuangan/bukti-transfer', FileText, 'Bukti Transfer')}</li>}
                {hasAccess('keuangan.rekening-bank') && <li>{nl('/keuangan/rekening-bank', CreditCard, 'Rekening Bank')}</li>}
                {hasAccess('keuangan.tabungan') && <li>{nl('/keuangan/tabungan', Wallet, 'Tabungan Santri')}</li>}
                {hasAccess('keuangan.tunggakan') && (
                  <li>
                    <button type="button" onClick={()=>setKeuanganTunggakanOpen(v=>!v)} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isPath('/keuangan/tunggakan')?'bg-white text-brand shadow-sm':'text-gray-700 hover:bg-white'}`}>
                      <AlertCircle className="w-4 h-4" />{sidebarOpen && <span>Tunggakan Santri</span>}
                    </button>
                    {collapse(keuanganTunggakanOpen, <>
                      <li>{nl('/keuangan/tunggakan/mutasi', ArrowDownUp, 'Mutasi')}</li>
                      <li>{nl('/keuangan/tunggakan/alumni', GraduationCap, 'Alumni')}</li>
                    </>)}
                  </li>
                )}
                {hasAccess('keuangan.pengaturan') && (
                  <li>
                    <button type="button" onClick={()=>setKeuanganPengaturanOpen(v=>!v)} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isPath('/keuangan/pengaturan')?'bg-white text-brand shadow-sm':'text-gray-700 hover:bg-white'}`}>
                      <Settings className="w-4 h-4" />{sidebarOpen && <span>Pengaturan</span>}
                    </button>
                    {collapse(keuanganPengaturanOpen, <>
                      <li>{nl('/keuangan/pengaturan/jenis-tagihan', ListChecks, 'Jenis Tagihan')}</li>
                      <li>{nl('/keuangan/pengaturan/keringanan', DollarSign, 'Keringanan Tagihan')}</li>
                    </>)}
                  </li>
                )}
              </>)}
            </div>
          )}

          {/* Dompet Digital */}
          {(hasAccess('dompet.dompet-santri')||hasAccess('dompet.manajemen-keuangan')||hasAccess('dompet.history')||hasAccess('dompet.laporan')||hasAccess('dompet.tagihan')||hasAccess('dompet.kebutuhan')||hasAccess('dompet.rfid')||hasAccess('dompet.settings')) && (
            <div className="space-y-1">
              {parentBtn('Dompet Digital', DollarSign, isPath('/dompet'), () => setDompetOpen(v=>!v))}
              {collapse(dompetOpen, <>
                {hasAccess('dompet.dompet-santri') && <li>{nl('/dompet/dompet-santri', CreditCard, 'Dompet Santri')}</li>}
                {hasAccess('dompet.manajemen-keuangan') && <li>{nl('/dompet/manajemen-keuangan', DollarSign, 'Manajemen Keuangan')}</li>}
                {hasAccess('dompet.history') && <li>{nl('/dompet/history-transaksi', FileText, 'History Transaksi')}</li>}
                {hasAccess('dompet.laporan') && <li>{nl('/dompet/laporan-keuangan', Receipt, 'Laporan Keuangan')}</li>}
                {hasAccess('dompet.tagihan') && <li>{nl('/dompet/tagihan-kolektif', Receipt, 'Tagihan Kolektif')}</li>}
                {(hasAccess('dompet.kebutuhan') || hasAccess('dompet.dompet-santri')) && <li>{nl('/dompet/kebutuhan-orders', ListChecks, 'Pesanan Kebutuhan')}</li>}
                {hasAccess('dompet.rfid') && <li>{nl('/dompet/rfid', Users, 'Kelola RFID')}</li>}
                {hasAccess('dompet.settings') && <li>{nl('/dompet/settings', Settings, 'Pengaturan Dompet')}</li>}
              </>)}
            </div>
          )}

          {/* Akademik */}
          {hasAccess('akademik.tahun-ajaran') && (
            <div className="space-y-1">
              {parentBtn('Akademik', Calendar, isPath('/akademik'), () => setAkademikOpen(v=>!v))}
              {collapse(akademikOpen, <>
                <li>{nl('/akademik/tahun-ajaran', Calendar, 'Tahun Ajaran')}</li>
              </>)}
            </div>
          )}

          {/* Kepegawaian */}
          {(hasAccess('kepegawaian.data-pegawai')||hasAccess('kepegawaian.struktur-jabatan')) && (
            <div className="space-y-1">
              {parentBtn('Guru & Kepegawaian', Briefcase, isPath('/kepegawaian'), () => setKepegawaianOpen(v=>!v))}
              {collapse(kepegawaianOpen, <>
                {hasAccess('kepegawaian.data-pegawai') && <li>{nl('/kepegawaian/data-pegawai', Users, 'Data Pegawai')}</li>}
                {hasAccess('kepegawaian.struktur-jabatan') && <li>{nl('/kepegawaian/struktur-jabatan', Building2, 'Struktur dan Jabatan')}</li>}
              </>)}
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 space-y-1">
            {hasAccess('pengguna') && <SidebarNavLink to="/pengguna" icon={UserCog} label="Pengguna" open={sidebarOpen} />}
            {hasAccess('wa-gateway') && <SidebarNavLink to="/wa-gateway" icon={MessageCircle} label="WA Gateway" open={sidebarOpen} />}
            {hasAccess('pengaturan') && <SidebarNavLink to="/pengaturan" icon={Settings} label="Pengaturan" open={sidebarOpen} />}
          </div>
        </div>
      </nav>
    </motion.aside>
  )
}