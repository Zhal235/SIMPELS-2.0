import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import Santri from './pages/Santri'
import Keuangan from './pages/Keuangan'
import Absensi from './pages/Absensi'
import Pengguna from './pages/Pengguna'
import Pengaturan from './pages/Pengaturan'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#F5F5F5]">
        <Sidebar />
        <div className="flex w-full flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/santri" element={<Santri />} />
              <Route path="/keuangan" element={<Keuangan />} />
              <Route path="/absensi" element={<Absensi />} />
              <Route path="/pengguna" element={<Pengguna />} />
              <Route path="/pengaturan" element={<Pengaturan />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}