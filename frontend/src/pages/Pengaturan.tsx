import { Link } from 'react-router-dom'
import { Lock, User, Bell, Shield, Database } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'
import { triggerBackup } from '../api/system'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function Pengaturan() {
  const { user } = useAuthStore()
  const [backingUp, setBackingUp] = useState(false)
  const [backupEmail, setBackupEmail] = useState('')

  async function handleBackup() {
    if (!backupEmail.trim()) {
      toast.error('Masukkan email tujuan backup')
      return
    }
    setBackingUp(true)
    try {
      const res = await triggerBackup(backupEmail.trim())
      if (res.success) toast.success(res.message)
      else toast.error(res.message || 'Backup gagal')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Backup gagal')
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pengaturan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.name || 'User'}</h3>
              <p className="text-sm text-gray-600">{user?.email || ''}</p>
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-2">
            <Link
              to="/pengaturan/ubah-password"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Lock className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Ubah Password</p>
                <p className="text-sm text-gray-500">Perbarui password akun Anda</p>
              </div>
            </Link>
            <Link
              to="/pengaturan/reset-password-wali"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <Shield className="h-5 w-5 text-gray-400 group-hover:text-amber-600" />
              <div>
                <p className="font-medium text-gray-900">Reset Password Wali</p>
                <p className="text-sm text-gray-500">Reset akun wali santri yang lupa password</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Keamanan</h3>
          </div>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Login dengan autentikasi
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Password terenkripsi
            </li>
            <li className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Session timeout otomatis
            </li>
          </ul>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Notifikasi</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Kelola preferensi notifikasi Anda
          </p>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Notifikasi pembayaran</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm">Notifikasi mutasi santri</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">Notifikasi email</span>
            </label>
          </div>
        </div>

        {/* Database Backup */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Backup Database</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Backup otomatis dikirim setiap hari pukul 02.00 WIB ke email yang dikonfigurasi via <code className="bg-gray-100 px-1 rounded">BACKUP_EMAIL</code> di Railway.<br />
            Gunakan form ini untuk trigger backup manual sekarang.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Tujuan</label>
              <input
                type="email"
                value={backupEmail}
                onChange={(e) => setBackupEmail(e.target.value)}
                placeholder="emailanda@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleBackup}
              disabled={backingUp}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              {backingUp ? 'Mengirim...' : 'Backup Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}