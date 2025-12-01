import { useState } from 'react'
import { Search, RefreshCw, AlertCircle, CheckCircle2, Phone } from 'lucide-react'
import { toast } from 'sonner'
import api from '../api'

interface WaliAccount {
  no_hp: string
  santri_names: string[]
  has_custom_password: boolean
  last_updated?: string
}

export default function ResetPasswordWali() {
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [waliData, setWaliData] = useState<WaliAccount | null>(null)
  const [resetting, setResetting] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Masukkan nomor HP wali')
      return
    }

    setLoading(true)
    setWaliData(null)

    try {
      console.log('[ResetPasswordWali] Searching for:', searchQuery)
      console.log('[ResetPasswordWali] API URL:', `/admin/wali/check-password/${encodeURIComponent(searchQuery)}`)
      
      const response = await api.get(`/admin/wali/check-password/${encodeURIComponent(searchQuery)}`)
      console.log('[ResetPasswordWali] Full response:', response)
      console.log('[ResetPasswordWali] Response data:', response.data)
      console.log('[ResetPasswordWali] Response status:', response.status)
      
      if (response.data && response.data.success) {
        setWaliData(response.data.data)
        toast.success(`Data wali ditemukan (${response.data.data.santri_names.length} santri)`)
      } else {
        toast.error(response.data?.message || 'Data tidak ditemukan')
      }
    } catch (error: any) {
      console.error('[ResetPasswordWali] Search error:', error)
      console.error('[ResetPasswordWali] Error response:', error.response)
      console.error('[ResetPasswordWali] Error data:', error.response?.data)
      console.error('[ResetPasswordWali] Error status:', error.response?.status)
      
      const message = error.response?.data?.message || 
                     error.message || 
                     'Wali dengan nomor HP tersebut tidak ditemukan'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!waliData) return

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin reset password untuk nomor HP ${waliData.no_hp}?\n\n` +
      `Password akan dikembalikan ke default: 123456\n\n` +
      `Santri terkait:\n${waliData.santri_names.join('\n')}`
    )

    if (!confirmed) return

    setResetting(true)

    try {
      const response = await api.post(`/admin/wali/reset-password`, {
        no_hp: waliData.no_hp
      })

      toast.success(response.data.message || 'Password berhasil direset ke 123456')
      
      // Refresh data
      handleSearch()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Gagal reset password'
      toast.error(message)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password Wali Santri</h1>
        <p className="text-gray-600 mb-6">
          Reset password akun wali santri kembali ke password default (123456)
        </p>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Nomor HP Wali
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Contoh: 081234567890"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  <span>Cari</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Section */}
        {waliData && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Informasi Akun Wali
                </h3>
                <p className="text-sm text-gray-600">
                  Data wali santri ditemukan
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                waliData.has_custom_password
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {waliData.has_custom_password ? 'Password Custom' : 'Password Default'}
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone Number */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Nomor HP</p>
                  <p className="font-semibold text-gray-900">{waliData.no_hp}</p>
                </div>
              </div>

              {/* Santri List */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Santri Terkait:</p>
                <ul className="space-y-1">
                  {waliData.santri_names.map((name, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-900">
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Last Updated */}
              {waliData.last_updated && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Terakhir diubah:</span> {waliData.last_updated}
                </div>
              )}

              {/* Info Alert */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-amber-900 font-medium mb-1">
                    Perhatian
                  </p>
                  <p className="text-sm text-amber-800">
                    {waliData.has_custom_password
                      ? 'Wali ini sudah mengubah password default. Reset akan mengembalikan password ke 123456.'
                      : 'Wali ini masih menggunakan password default (123456).'}
                  </p>
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-4 border-t">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Mereset...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>Reset Password ke Default</span>
                    </>
                  )}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  Password akan direset ke: <span className="font-mono font-bold">123456</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-2">
                Petunjuk Penggunaan
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Minta nomor HP yang terdaftar dari wali santri</li>
                <li>Masukkan nomor HP dan klik tombol "Cari"</li>
                <li>Verifikasi data wali dan santri yang ditampilkan</li>
                <li>Klik "Reset Password ke Default" untuk mereset</li>
                <li>Informasikan ke wali bahwa password telah direset ke <span className="font-mono font-bold">123456</span></li>
                <li>Anjurkan wali untuk segera mengubah password setelah login</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
