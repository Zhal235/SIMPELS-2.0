import { Link } from 'react-router-dom'
import { Lock, User, Bell, Shield } from 'lucide-react'
import { useAuthStore } from '../stores/useAuthStore'

export default function Pengaturan() {
  const { user } = useAuthStore()
  
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
      </div>
    </div>
  )
}