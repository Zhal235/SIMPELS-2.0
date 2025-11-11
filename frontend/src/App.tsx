import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { Suspense, lazy } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'
import { useAuthStore } from './stores/useAuthStore'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SantriLegacy = lazy(() => import('./pages/Santri'))
const Pengguna = lazy(() => import('./pages/Pengguna'))
const Pengaturan = lazy(() => import('./pages/Pengaturan'))
const Login = lazy(() => import('./pages/Login'))
// Kesantrian subpages
const KesantrianSantri = lazy(() => import('./pages/kesantrian/Santri'))
const KesantrianKelas = lazy(() => import('./pages/kesantrian/Kelas'))
const KesantrianAsrama = lazy(() => import('./pages/kesantrian/Asrama'))
const MutasiMasuk = lazy(() => import('./pages/kesantrian/MutasiMasuk'))
const MutasiKeluar = lazy(() => import('./pages/kesantrian/MutasiKeluar'))
const Alumni = lazy(() => import('./pages/kesantrian/Alumni'))
// Keuangan subpages
const PembayaranSantri = lazy(() => import('./pages/keuangan/PembayaranSantri'))
const TransaksiKas = lazy(() => import('./pages/keuangan/TransaksiKas'))
const BukuKas = lazy(() => import('./pages/keuangan/BukuKas'))
const TagihanSantri = lazy(() => import('./pages/keuangan/TagihanSantri'))
const TunggakanAktif = lazy(() => import('./pages/keuangan/TunggakanAktif'))
const TunggakanMutasi = lazy(() => import('./pages/keuangan/TunggakanMutasi'))
const TunggakanAlumni = lazy(() => import('./pages/keuangan/TunggakanAlumni'))
const JenisTagihan = lazy(() => import('./pages/keuangan/JenisTagihan'))
const KeringananTagihan = lazy(() => import('./pages/keuangan/KeringananTagihan'))

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
    <div className="flex h-screen bg-[#F5F5F5]">
      <Sidebar />
      <div className="flex w-full flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors expand />
      <HotToaster position="top-right" />
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6 text-center text-gray-500">Memuat halaman...</div>}>
          <Routes>
            {/* Public Route */}
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
            <Route path="/keuangan/tunggakan" element={<Navigate to="/keuangan/tunggakan/aktif" replace />} />
            <Route path="/keuangan/pengaturan" element={<Navigate to="/keuangan/pengaturan/jenis-tagihan" replace />} />
            
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
            <Route path="/keuangan/tunggakan/aktif" element={
              <ProtectedRoute>
                <AppLayout>
                  <TunggakanAktif />
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
            
            {/* bottom menus */}
            <Route path="/pengguna" element={
              <ProtectedRoute>
                <AppLayout>
                  <Pengguna />
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
            
            {/* akademik submenus */}
            {/* Kelas dipindahkan ke /kesantrian/kelas */}
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}