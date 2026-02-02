import { useState, useEffect } from 'react'
import { CreditCard, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react'
import Modal from '../../components/Modal'
import api from '../../api'
import { hasAccess } from '../../stores/useAuthStore'

interface BankAccount {
  id: number
  bank_name: string
  account_number: string
  account_name: string
  is_active: boolean
  sort_order: number
}

export default function RekeningBank() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    is_active: true,
    sort_order: 0,
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/v1/keuangan/bank-accounts')
      if (res.data.success) {
        setAccounts(res.data.data)
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error)
      alert('Gagal memuat data rekening bank')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        // Update
        const res = await api.put(`/v1/keuangan/bank-accounts/${editingAccount.id}`, formData)
        if (res.data.success) {
          alert('Rekening bank berhasil diperbarui')
          loadAccounts()
          closeModal()
        }
      } else {
        // Create
        const res = await api.post('/v1/keuangan/bank-accounts', formData)
        if (res.data.success) {
          alert('Rekening bank berhasil ditambahkan')
          loadAccounts()
          closeModal()
        }
      }
    } catch (error: any) {
      console.error('Error saving bank account:', error)
      alert(error.response?.data?.message || 'Gagal menyimpan rekening bank')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus rekening bank ini?')) return

    try {
      const res = await api.delete(`/v1/keuangan/bank-accounts/${id}`)
      if (res.data.success) {
        alert('Rekening bank berhasil dihapus')
        loadAccounts()
      }
    } catch (error: any) {
      console.error('Error deleting bank account:', error)
      alert(error.response?.data?.message || 'Gagal menghapus rekening bank')
    }
  }

  const handleToggleActive = async (id: number) => {
    try {
      const res = await api.post(`/v1/keuangan/bank-accounts/${id}/toggle-active`)
      if (res.data.success) {
        loadAccounts()
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      alert('Gagal mengubah status rekening bank')
    }
  }

  const openAddModal = () => {
    setEditingAccount(null)
    setFormData({
      bank_name: '',
      account_number: '',
      account_name: '',
      is_active: true,
      sort_order: 0,
    })
    setShowModal(true)
  }

  const openEditModal = (account: BankAccount) => {
    setEditingAccount(account)
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_name: account.account_name,
      is_active: account.is_active,
      sort_order: account.sort_order,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAccount(null)
    setFormData({
      bank_name: '',
      account_number: '',
      account_name: '',
      is_active: true,
      sort_order: 0,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Rekening Bank</h1>
          <p className="text-gray-600 text-sm mt-1">
            Kelola rekening bank untuk pembayaran tagihan santri
          </p>
        </div>
        {hasAccess('keuangan.rekening-bank.edit') && (
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Rekening
        </button>)}
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Belum ada rekening bank yang ditambahkan</p>
          {hasAccess('keuangan.rekening-bank.edit') && (
          <button
            onClick={openAddModal}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            + Tambah Rekening Pertama
          </button>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-lg border ${
                account.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
              } p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{account.bank_name}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded ${
                        account.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {account.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Nomor Rekening</p>
                  <p className="font-mono font-semibold text-gray-800">{account.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Nama Pemilik</p>
                  <p className="text-sm text-gray-700">{account.account_name}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                {hasAccess('keuangan.rekening-bank.edit') && (
                <button
                  onClick={() => handleToggleActive(account.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    account.is_active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                  title={account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {account.is_active ? (
                    <PowerOff className="w-4 h-4" />
                  ) : (
                    <Power className="w-4 h-4" />
                  )}
                  {account.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                </button>)}
                {hasAccess('keuangan.rekening-bank.edit') && (
                <button
                  onClick={() => openEditModal(account)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>)}
                {hasAccess('keuangan.rekening-bank.delete') && (
                <button
                  onClick={() => handleDelete(account.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingAccount ? 'Edit Rekening Bank' : 'Tambah Rekening Bank'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: BRI, BCA, Mandiri, BSI"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor Rekening <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_number}
              onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              placeholder="1234-5678-9012-3456"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pemilik Rekening <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.account_name}
              onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: YAYASAN PESANTREN XYZ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urutan Tampil
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Angka lebih kecil akan ditampilkan lebih dulu
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Aktifkan rekening (tampil di mobile app)
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingAccount ? 'Simpan Perubahan' : 'Tambah Rekening'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
