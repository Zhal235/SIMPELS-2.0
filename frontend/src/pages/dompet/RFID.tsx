import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { bindRFID } from '../../api/wallet'
import { listSantri } from '../../api/santri'
import { listKelas } from '../../api/kelas'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'

const PER_PAGE = 20

export default function RFID() {
  const [santriList, setSantriList] = useState<any[]>([])
  const [kelasList, setKelasList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRFIDModal, setShowRFIDModal] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null)
  const [rfidUID, setRfidUID] = useState('')
  const [rfidLabel, setRfidLabel] = useState('')

  // Filter & pagination state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('aktif')
  const [filterKelas, setFilterKelas] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)

  const totalPages = Math.ceil(total / PER_PAGE)

  // Load kelas options once
  useEffect(() => {
    listKelas()
      .then(res => { if (res?.success) setKelasList(res.data || []) })
      .catch(() => {})
  }, [])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterStatus, filterKelas])

  // Load santri whenever page, filters, or refreshKey change (debounced)
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const filters: Record<string, any> = {}
        if (searchQuery.trim()) filters.q = searchQuery.trim()
        if (filterStatus) filters.status = filterStatus
        if (filterKelas) filters.kelas_id = filterKelas
        const res = await listSantri(page, PER_PAGE, filters)
        if (!cancelled && res.status === 'success') {
          setSantriList(res.data || [])
          setTotal(res.total || 0)
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err)
          toast.error('Gagal memuat data santri')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [page, searchQuery, filterStatus, filterKelas, refreshKey])

  async function handleSetRFID() {
    if (!rfidUID.trim()) {
      toast.error('UID RFID harus diisi')
      return
    }
    try {
      const res = await bindRFID(rfidUID, selectedSantri.id)
      if (res.success) {
        toast.success('RFID berhasil ditetapkan')
        setShowRFIDModal(false)
        setRfidUID('')
        setRfidLabel('')
        setSelectedSantri(null)
        setRefreshKey(k => k + 1)
      } else {
        toast.error(res.message || 'Gagal menetapkan RFID')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menetapkan RFID')
    }
  }

  const columns = [
    { key: 'no', header: 'No', render: (_v: any, _r: any, idx: number) => (page - 1) * PER_PAGE + idx + 1 },
    { key: 'nis', header: 'NIS' },
    { key: 'nama_santri', header: 'Nama Santri' },
    { key: 'kelas_nama', header: 'Kelas' },
    { key: 'rfid', header: 'RFID', render: (_v: any, r: any) => r.rfid_tag?.uid || '-' },
    { key: 'actions', header: 'Aksi', render: (_v: any, r: any) => (
      <button 
        onClick={() => {
          setSelectedSantri(r)
          setRfidUID(r.rfid_tag?.uid || '')
          setShowRFIDModal(true)
        }} 
        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
      >
        Set RFID
      </button>
    ) }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RFID Santri</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola kartu/UID RFID untuk setiap santri</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="alumni">Alumni</option>
          <option value="keluar">Keluar</option>
        </select>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map((k: any) => (
            <option key={k.id} value={k.id}>{k.nama_kelas || k.nama}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 whitespace-nowrap">{total} santri</span>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat...</div>
        ) : santriList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Tidak ada data santri</div>
        ) : (
          <>
            <Table columns={columns} data={santriList} getRowKey={(r) => r.id} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <span className="text-sm text-gray-500">
                  Halaman {page} dari {totalPages} ({total} total)
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-2 py-1 rounded border text-sm disabled:opacity-40"
                  >«</button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                  >‹</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(page - 2, totalPages - 4))
                    const pg = start + i
                    return (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`px-3 py-1 rounded border text-sm ${pg === page ? 'bg-blue-600 text-white border-blue-600' : ''}`}
                      >{pg}</button>
                    )
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                  >›</button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-2 py-1 rounded border text-sm disabled:opacity-40"
                  >»</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal 
        open={showRFIDModal} 
        title={`Set RFID - ${selectedSantri?.nama_santri || ''}`} 
        onClose={() => {
          setShowRFIDModal(false)
          setSelectedSantri(null)
          setRfidUID('')
          setRfidLabel('')
        }} 
        footer={(
          <>
            <button className="btn" onClick={() => setShowRFIDModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSetRFID}>Simpan</button>
          </>
        )}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium">NIS</label>
            <input disabled value={selectedSantri?.nis || ''} className="rounded-md border px-3 py-2 w-full bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium">Nama Santri</label>
            <input disabled value={selectedSantri?.nama_santri || ''} className="rounded-md border px-3 py-2 w-full bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium">UID RFID</label>
            <input 
              value={rfidUID} 
              onChange={(e) => setRfidUID(e.target.value)} 
              placeholder="Masukkan UID kartu RFID" 
              className="rounded-md border px-3 py-2 w-full" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Label (opsional)</label>
            <input 
              value={rfidLabel} 
              onChange={(e) => setRfidLabel(e.target.value)} 
              placeholder="Contoh: Kartu Utama" 
              className="rounded-md border px-3 py-2 w-full" 
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
