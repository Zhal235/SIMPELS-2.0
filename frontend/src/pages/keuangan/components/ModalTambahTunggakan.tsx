import { useState, useEffect } from 'react'
import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'
import { listJenisTagihan } from '../../../api/jenisTagihan'
import { listTahunAjaran } from '../../../api/tahunAjaran'
import { createTunggakan } from '../../../api/tagihanSantri'
import toast from 'react-hot-toast'
import TunggakanRow from './TunggakanRow'

interface TunggakanRowData {
  id: string
  santri_index: number
  santri_id: string
  santri_nama: string
  kelas: string
  jenis_tagihan_id: number
  jenis_tagihan_nama: string
  bulan: string[]
  tahun: number
  nominal: number
}

interface Props {
  dataTagihan: TagihanSantriRow[]
  onClose: () => void
  onSuccess: () => void
}

export default function ModalTambahTunggakan({ dataTagihan, onClose, onSuccess }: Props) {
  const [jenisTagihan, setJenisTagihan] = useState<any[]>([])
  const [loadingJenis, setLoadingJenis] = useState(false)
  const [tahunAjaranAktif, setTahunAjaranAktif] = useState<any>(null)
  const [rows, setRows] = useState<TunggakanRowData[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingJenis(true)
        const resJenis = await listJenisTagihan()
        let data: any[] = []
        if (Array.isArray(resJenis)) data = resJenis
        else if (resJenis?.data && Array.isArray(resJenis.data)) data = resJenis.data
        else if (resJenis?.data) data = [resJenis.data]
        setJenisTagihan(data)
        const resTahun = await listTahunAjaran()
        const tahunData = Array.isArray(resTahun) ? resTahun : (resTahun?.data || [])
        setTahunAjaranAktif(tahunData.find((t: any) => t.status === 'aktif'))
      } catch { toast.error('Gagal memuat data') }
      finally { setLoadingJenis(false) }
    }
    fetchData()
  }, [])

  const getAvailableBulan = (santri_id: string, jenistagihanId: number) => {
    if (!santri_id || !jenistagihanId || !tahunAjaranAktif) return []
    const jenis = jenisTagihan.find(j => (j?.id || j?.ID || j?.jenis_tagihan_id) === jenistagihanId)
    if (!jenis) return []
    const jenisNama = jenis?.nama_tagihan || jenis?.namaTagihan || ''
    const tahunMulai = tahunAjaranAktif.tahun_mulai || 2025
    const tahunSelesai = tahunAjaranAktif.tahun_akhir || 2026
    const bulanMap: Record<string, number> = {
      Juli: tahunMulai, Agustus: tahunMulai, September: tahunMulai, Oktober: tahunMulai, November: tahunMulai, Desember: tahunMulai,
      Januari: tahunSelesai, Februari: tahunSelesai, Maret: tahunSelesai, April: tahunSelesai, Mei: tahunSelesai, Juni: tahunSelesai,
    }
    const semuaBulan = Object.keys(bulanMap)
    const santriData = dataTagihan.find(d => String(d.santri_id) === String(santri_id))
    const existing = new Set<string>()
    santriData?.detail_tagihan.filter(dt => dt.jenis_tagihan === jenisNama).forEach(dt => existing.add(`${dt.bulan}-${dt.tahun}`))
    return semuaBulan.map(b => ({ bulan: b, tahun: bulanMap[b] })).filter(pair => !existing.has(`${pair.bulan}-${pair.tahun}`))
  }

  const getNominalDefault = (jenistagihanId: number, santriKelas: string) => {
    const jenis = jenisTagihan.find(j => (j?.id || j?.ID || j?.jenis_tagihan_id) === jenistagihanId)
    if (!jenis) return 0
    const tipe = jenis?.tipe_nominal || jenis?.tipeNominal
    if (tipe === 'sama') return jenis?.nominal_sama || jenis?.nominalSama || 0
    if (tipe === 'per_kelas') {
      const kelasData = (jenis?.nominal_per_kelas || jenis?.nominalPerKelas || []).find((k: any) => k.kelas === santriKelas)
      return kelasData?.nominal || 0
    }
    return 0
  }

  const addRow = () => setRows(prev => [...prev, { id: Date.now().toString(), santri_index: -1, santri_id: '', santri_nama: '', kelas: '', jenis_tagihan_id: 0, jenis_tagihan_nama: '', bulan: [], tahun: 2025, nominal: 0 }])
  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id))

  const updateRow = (id: string, field: string, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id !== id) return row
      if (field === 'santri_index') {
        const idx = parseInt(value)
        if (idx < 0 || idx >= dataTagihan.length) return row
        const s = dataTagihan[idx]
        return { ...row, santri_index: idx, santri_id: String(s.santri_id), santri_nama: s.santri_nama, kelas: s.kelas, bulan: [], tahun: 2025, nominal: 0 }
      }
      if (field === 'jenis_tagihan_id') {
        const jenis = jenisTagihan.find(j => (j?.id || j?.ID || j?.jenis_tagihan_id) == value)
        if (!jenis) return row
        const tipe = jenis?.tipe_nominal || jenis?.tipeNominal
        return { ...row, jenis_tagihan_id: Number(value), jenis_tagihan_nama: jenis?.nama_tagihan || jenis?.namaTagihan || '', bulan: [], tahun: 2025, nominal: tipe === 'per_individu' ? 0 : getNominalDefault(value, row.kelas) }
      }
      if (field === 'bulan') {
        const current = Array.isArray(row.bulan) ? row.bulan : []
        return { ...row, bulan: current.includes(value) ? current.filter(b => b !== value) : [...current, value] }
      }
      return { ...row, [field]: value }
    }))
  }

  const handleSubmit = async () => {
    if (rows.length === 0) { toast.error('Tambahkan minimal satu tagihan'); return }
    const invalid = rows.filter(r => !r.santri_id || !r.jenis_tagihan_id || !r.bulan?.length || !r.nominal)
    if (invalid.length > 0) { toast.error('Harap isi semua field dengan lengkap dan pilih minimal 1 bulan'); return }
    try {
      setIsSubmitting(true)
      const payload: any[] = []
      rows.forEach(row => row.bulan.forEach(bulan => payload.push({ santri_id: String(row.santri_id), jenis_tagihan_id: Number(row.jenis_tagihan_id), bulan, nominal: Number(row.nominal) })))
      const res = await createTunggakan(payload)
      toast.success(res.message || `${payload.length} tunggakan berhasil ditambahkan`)
      onSuccess()
    } catch (error: any) {
      const errData = error.response?.data
      if (errData?.errors) {
        const msgs: string[] = []
        Object.entries(errData.errors).forEach(([f, m]: any) => msgs.push(`${f}: ${Array.isArray(m) ? m.join(', ') : m}`))
        toast.error(errData.message + '\n' + msgs.join('\n'))
      } else { toast.error(errData?.message || 'Gagal menyimpan tunggakan') }
    } finally { setIsSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Tambah Tunggakan Manual</h2>
          <p className="text-sm text-gray-600 mt-1">Input tunggakan tagihan dari bulan-bulan sebelumnya</p>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><p>Belum ada data. Klik "Tambah Row" untuk menambahkan tunggakan</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                  <tr>
                    {['No', 'Nama Santri', 'Jenis Tagihan', 'Bulan', 'Nominal', 'Aksi'].map(h => (
                      <th key={h} className={`px-3 py-2 text-left border${h === 'Nominal' ? ' text-right' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const jenis = jenisTagihan.find(j => (j?.id || j?.ID || j?.jenis_tagihan_id) === row.jenis_tagihan_id)
                    const tipe = jenis?.tipe_nominal || jenis?.tipeNominal
                    return (
                      <TunggakanRow
                        key={row.id}
                        row={row}
                        idx={idx}
                        dataTagihan={dataTagihan}
                        jenisTagihan={jenisTagihan}
                        loadingJenis={loadingJenis}
                        availableBulan={getAvailableBulan(row.santri_id, row.jenis_tagihan_id)}
                        isNominalDisabled={tipe !== 'per_individu'}
                        onUpdate={updateRow}
                        onRemove={removeRow}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button onClick={addRow} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">+ Tambah Row</button>
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Batal</button>
          <button onClick={handleSubmit} disabled={isSubmitting || rows.length === 0} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium disabled:opacity-50">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>
    </div>
  )
}
