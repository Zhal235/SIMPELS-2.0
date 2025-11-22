import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { bindRFID } from '../../api/wallet'
import { listSantri } from '../../api/santri'
import toast from 'react-hot-toast'

export default function RFID() {
  const [santriList, setSantriList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRFIDModal, setShowRFIDModal] = useState(false)
  const [selectedSantri, setSelectedSantri] = useState<any | null>(null)
  const [rfidUID, setRfidUID] = useState('')
  const [rfidLabel, setRfidLabel] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      // Load santri dengan status aktif
      const res = await listSantri(1, 9999, '')
      if (res.status === 'success') {
        // Filter hanya santri aktif
        const aktivSantri = (res.data || []).filter((s: any) => s.status === 'aktif')
        setSantriList(aktivSantri)
      }
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data santri')
    } finally { setLoading(false) }
  }

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
        load()
      } else {
        toast.error(res.message || 'Gagal menetapkan RFID')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menetapkan RFID')
    }
  }

  const columns = [
    { key: 'no', header: 'No', render: (_v: any, _r: any, idx: number) => idx + 1 },
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
          <p className="text-sm text-gray-500 mt-1">Kelola kartu/UID RFID untuk setiap santri aktif</p>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Memuat...</div>
        ) : santriList.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Tidak ada santri aktif</div>
        ) : (
          <Table columns={columns} data={santriList} getRowKey={(r) => r.id} />
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
