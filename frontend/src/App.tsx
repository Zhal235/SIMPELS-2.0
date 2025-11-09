import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import { Suspense, lazy } from 'react'
import { Toaster } from 'sonner'
import { Toaster as HotToaster } from 'react-hot-toast'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const SantriLegacy = lazy(() => import('./pages/Santri'))
const Keuangan = lazy(() => import('./pages/Keuangan'))
const Absensi = lazy(() => import('./pages/Absensi'))
const Pengguna = lazy(() => import('./pages/Pengguna'))
const Pengaturan = lazy(() => import('./pages/Pengaturan'))
// Kesantrian subpages
const KesantrianSantri = lazy(() => import('./pages/kesantrian/Santri'))
const KesantrianKelas = lazy(() => import('./pages/kesantrian/Kelas'))
const KesantrianAsrama = lazy(() => import('./pages/kesantrian/Asrama'))
const MutasiMasuk = lazy(() => import('./pages/kesantrian/MutasiMasuk'))
const MutasiKeluar = lazy(() => import('./pages/kesantrian/MutasiKeluar'))
const Alumni = lazy(() => import('./pages/kesantrian/Alumni'))

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#F5F5F5]">
        <Sidebar />
        <div className="flex w-full flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4">
            <Toaster position="top-right" richColors expand />
            <HotToaster position="top-right" />
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* legacy route redirect to kesantrian/santri */}
                <Route path="/santri" element={<Navigate to="/kesantrian/santri" replace />} />
                {/* intermediate breadcrumb routes */}
                <Route path="/kesantrian" element={<Navigate to="/kesantrian/santri" replace />} />
                <Route path="/kesantrian/mutasi" element={<Navigate to="/kesantrian/mutasi/masuk" replace />} />
                {/* main menus */}
                <Route path="/keuangan" element={<Keuangan />} />
                <Route path="/absensi" element={<Absensi />} />
                <Route path="/pengguna" element={<Pengguna />} />
                <Route path="/pengaturan" element={<Pengaturan />} />
                {/* kesantrian submenus */}
                <Route path="/kesantrian/santri" element={<KesantrianSantri />} />
                <Route path="/kesantrian/kelas" element={<KesantrianKelas />} />
                <Route path="/kesantrian/asrama" element={<KesantrianAsrama />} />
                <Route path="/kesantrian/mutasi/masuk" element={<MutasiMasuk />} />
                <Route path="/kesantrian/mutasi/keluar" element={<MutasiKeluar />} />
                <Route path="/kesantrian/alumni" element={<Alumni />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}