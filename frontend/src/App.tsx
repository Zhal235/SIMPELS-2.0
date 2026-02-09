import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { Suspense, lazy, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import { useAuthStore } from './stores/useAuthStore'
import { getCurrentUser } from './api/auth'
import { listRoles } from './api/roles'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SantriLegacy = lazy(() => import('./pages/Santri'))
const Pengguna = lazy(() => import('./pages/Pengguna'))
const Pengaturan = lazy(() => import('./pages/Pengaturan'))
const Pengumuman = lazy(() => import('./pages/Pengumuman'))
const Login = lazy(() => import('./pages/Login'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const ResetPasswordWali = lazy(() => import('./pages/ResetPasswordWali'))
// Kesantrian subpages
const KesantrianSantri = lazy(() => import('./pages/kesantrian/Santri'))
const KesantrianKelas = lazy(() => import('./pages/kesantrian/Kelas'))
const KoreksiDataSantri = lazy(() => import('./pages/kesantrian/KoreksiDataSantri'))
const KesantrianAsrama = lazy(() => import('./pages/kesantrian/Asrama'))
const MutasiMasuk = lazy(() => import('./pages/kesantrian/MutasiMasuk'))
const MutasiKeluar = lazy(() => import('./pages/kesantrian/MutasiKeluar'))
const Alumni = lazy(() => import('./pages/kesantrian/Alumni'))
// Keuangan subpages
const PembayaranSantri = lazy(() => import('./pages/keuangan/PembayaranSantri'))
const TransaksiKas = lazy(() => import('./pages/keuangan/TransaksiKas'))
const BukuKas = lazy(() => import('./pages/keuangan/BukuKas'))
const TagihanSantri = lazy(() => import('./pages/keuangan/TagihanSantri'))
const BuktiTransfer = lazy(() => import('./pages/keuangan/BuktiTransfer'))
const TunggakanMutasi = lazy(() => import('./pages/keuangan/TunggakanMutasi'))
const TunggakanAlumni = lazy(() => import('./pages/keuangan/TunggakanAlumni'))
const JenisTagihan = lazy(() => import('./pages/keuangan/JenisTagihan'))
const KeringananTagihan = lazy(() => import('./pages/keuangan/KeringananTagihan'))
const RekeningBank = lazy(() => import('./pages/keuangan/RekeningBank'))
// Laporan Keuangan
const LaporanIndex = lazy(() => import('./pages/keuangan/LaporanIndex'))
const LaporanDashboard = lazy(() => import('./pages/keuangan/LaporanDashboard'))
const LaporanTagihanSantri = lazy(() => import('./pages/keuangan/LaporanTagihanSantri'))
const LaporanTunggakanSantri = lazy(() => import('./pages/keuangan/LaporanTunggakanSantri'))
const LaporanArusKas = lazy(() => import('./pages/keuangan/LaporanArusKas'))
const LaporanLabaRugi = lazy(() => import('./pages/keuangan/LaporanLabaRugi'))
const LaporanPerBukuKas = lazy(() => import('./pages/keuangan/LaporanPerBukuKas'))
const LaporanDetailTransaksi = lazy(() => import('./pages/keuangan/LaporanDetailTransaksi'))
const LaporanRingkasan = lazy(() => import('./pages/keuangan/Ringkasan'))
const LaporanByCategory = lazy(() => import('./pages/keuangan/PengeluaranKategori'))
// Dompet Digital subpages
const DompetSantri = lazy(() => import('./pages/dompet/DompetSantri'))
const DompetRFID = lazy(() => import('./pages/dompet/RFID'))
const DompetHistory = lazy(() => import('./pages/dompet/History'))
const DompetSettings = lazy(() => import('./pages/dompet/Settings'))
const DompetWithdrawals = lazy(() => import('./pages/dompet/Withdrawals'))
// New Dompet pages
const ManajemenKeuangan = lazy(() => import('./pages/dompet/ManajemenKeuangan'))
const HistoryTransaksi = lazy(() => import('./pages/dompet/HistoryTransaksi'))
const LaporanKeuanganDompet = lazy(() => import('./pages/dompet/LaporanKeuangan'))
const TagihanKolektif = lazy(() => import('./pages/dompet/TagihanKolektif'))
// Akademik subpages
const AkademikTahunAjaran = lazy(() => import('./pages/akademik/TahunAjaran'))
const PindahTahunAjaran = lazy(() => import('./pages/akademik/PindahTahunAjaran'))

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Layout Component with Sidebar and Topbar
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F5F5F5] overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const token = useAuthStore((state) => state.token)
  const setUser = useAuthStore((state) => state.setUser)
  const setRoles = useAuthStore((state) => state.setRoles)

  // When the app mounts (or when token changes), fetch the current user if we have a token
  useEffect(() => {
    if (!token) return
    (async () => {
      try {
        const res: any = await getCurrentUser()
        if (res?.user) setUser(res.user)
        // load roles into store for permission checks
        try {
          const rolesPayload: any = await listRoles()
          if (rolesPayload?.success) {
            setRoles(rolesPayload.data || [])
          }
        } catch (err) {
          console.error('Failed to load roles:', err)
        }
      } catch (e) {
        // ignore - interceptor in api will logout on 401
      }
    })()
  }, [token, setUser, setRoles])
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors expand />
      <HotToaster position="top-right" />
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat halaman...</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* legacy route redirect to kesantrian/santri */}
            <Route path="/santri" element={<Navigate to="/kesantrian/santri" replace />} />
            
            {/* intermediate breadcrumb routes */}
            <Route path="/kesantrian" element={<Navigate to="/kesantrian/santri" replace />} />
            <Route path="/kesantrian/mutasi" element={<Navigate to="/kesantrian/mutasi/masuk" replace />} />
            <Route path="/keuangan" element={<Navigate to="/keuangan/pembayaran" replace />} />
            <Route path="/keuangan/tunggakan" element={<Navigate to="/keuangan/tunggakan/mutasi" replace />} />
            <Route path="/keuangan/pengaturan" element={<Navigate to="/keuangan/pengaturan/jenis-tagihan" replace />} />
            <Route path="/dompet" element={<Navigate to="/dompet/dompet-santri" replace />} />
            <Route path="/akademik" element={<Navigate to="/akademik/tahun-ajaran" replace />} />
            
            {/* kesantrian submenus */}
            <Route path="/kesantrian/santri" element={
              <ProtectedRoute>
                <AppLayout>
                  <KesantrianSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/kelas" element={
              <ProtectedRoute>
                <AppLayout>
                  <KesantrianKelas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/asrama" element={
              <ProtectedRoute>
                <AppLayout>
                  <KesantrianAsrama />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/koreksi-data" element={
              <ProtectedRoute>
                <AppLayout>
                  <KoreksiDataSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/mutasi/masuk" element={
              <ProtectedRoute>
                <AppLayout>
                  <MutasiMasuk />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/mutasi/keluar" element={
              <ProtectedRoute>
                <AppLayout>
                  <MutasiKeluar />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/kesantrian/alumni" element={
              <ProtectedRoute>
                <AppLayout>
                  <Alumni />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* keuangan submenus */}
            <Route path="/keuangan/pembayaran" element={
              <ProtectedRoute>
                <AppLayout>
                  <PembayaranSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/transaksi-kas" element={
              <ProtectedRoute>
                <AppLayout>
                  <TransaksiKas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/buku-kas" element={
              <ProtectedRoute>
                <AppLayout>
                  <BukuKas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/tagihan" element={
              <ProtectedRoute>
                <AppLayout>
                  <TagihanSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/bukti-transfer" element={
              <ProtectedRoute>
                <AppLayout>
                  <BuktiTransfer />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/rekening-bank" element={
              <ProtectedRoute>
                <AppLayout>
                  <RekeningBank />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/tunggakan/mutasi" element={
              <ProtectedRoute>
                <AppLayout>
                  <TunggakanMutasi />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/tunggakan/alumni" element={
              <ProtectedRoute>
                <AppLayout>
                  <TunggakanAlumni />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/pengaturan/jenis-tagihan" element={
              <ProtectedRoute>
                <AppLayout>
                  <JenisTagihan />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/pengaturan/keringanan" element={
              <ProtectedRoute>
                <AppLayout>
                  <KeringananTagihan />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* laporan keuangan */}
            <Route path="/keuangan/laporan" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanIndex />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanDashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/tagihan-santri" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanTagihanSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/tunggakan-santri" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanTunggakanSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/arus-kas" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanArusKas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/laba-rugi" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanLabaRugi />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/per-buku-kas" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanPerBukuKas />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/detail-transaksi" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanDetailTransaksi />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/ringkasan" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanRingkasan />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/keuangan/laporan/pengeluaran-kategori" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanByCategory />
                </AppLayout>
              </ProtectedRoute>
            } />

            {/* dompet digital submenus */}
            <Route path="/dompet/dompet-santri" element={
              <ProtectedRoute>
                <AppLayout>
                  <DompetSantri />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/manajemen-keuangan" element={
              <ProtectedRoute>
                <AppLayout>
                  <ManajemenKeuangan />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/history-transaksi" element={
              <ProtectedRoute>
                <AppLayout>
                  <HistoryTransaksi />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/laporan-keuangan" element={
              <ProtectedRoute>
                <AppLayout>
                  <LaporanKeuanganDompet />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/rfid" element={
              <ProtectedRoute>
                <AppLayout>
                  <DompetRFID />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <DompetSettings />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dompet/tagihan-kolektif" element={
              <ProtectedRoute>
                <AppLayout>
                  <TagihanKolektif />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* Legacy routes - keep for backward compatibility */}
            <Route path="/dompet/history" element={<Navigate to="/dompet/history-transaksi" replace />} />
            <Route path="/dompet/withdrawals" element={<Navigate to="/dompet/manajemen-keuangan" replace />} />
            
            {/* bottom menus */}
            <Route path="/pengguna" element={
              <ProtectedRoute>
                <AppLayout>
                  <Pengguna />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pengumuman" element={
              <ProtectedRoute>
                <AppLayout>
                  <Pengumuman />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pengaturan" element={
              <ProtectedRoute>
                <AppLayout>
                  <Pengaturan />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pengaturan/ubah-password" element={
              <ProtectedRoute>
                <AppLayout>
                  <ChangePassword />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pengaturan/reset-password-wali" element={
              <ProtectedRoute>
                <AppLayout>
                  <ResetPasswordWali />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            {/* akademik submenus */}
            <Route path="/akademik/tahun-ajaran" element={
              <ProtectedRoute>
                <AppLayout>
                  <AkademikTahunAjaran />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/akademik/pindah-tahun-ajaran" element={
              <ProtectedRoute>
                <AppLayout>
                  <PindahTahunAjaran />
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}