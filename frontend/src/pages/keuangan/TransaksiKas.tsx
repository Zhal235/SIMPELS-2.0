import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, ArrowDownCircle, ArrowUpCircle, Eye, ArrowRightLeft, Settings, Pencil } from 'lucide-react'
import { listBukuKas, listTransaksiKas, createTransaksiKas, updateTransaksiKas, deleteTransaksiKas } from '../../api/bukuKas'
import { listKategoriPengeluaran, createKategoriPengeluaran } from '../../api/kategoriPengeluaran'
import { listUsers } from '../../api/wallet'
import { hasAccess } from '../../stores/useAuthStore'
import toast from 'react-hot-toast'
import ModalPreviewTransaksi from './components/ModalPreviewTransaksi'
import ModalTransferSaldo from './components/ModalTransferSaldo'
import ModalCatatPemasukan from './components/ModalCatatPemasukan'
import ModalKelolaKategori from './components/ModalKelolaKategori'
import ModalEditTransaksi from './components/ModalEditTransaksi'

const formatRupiah = (v: number | undefined | null) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0)
const formatTanggal = (t: string) => new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

export default function TransaksiKas() {
  const [transaksiList, setTransaksiList] = useState<any[]>([])
  const [bukuKasList, setBukuKasList] = useState<any[]>([])
  const [categories, setCategories] = useState<Array<{id:number;name:string}>>([])
  const [users, setUsers] = useState<Array<{id:number;name:string}>>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showModalTransfer, setShowModalTransfer] = useState(false)
  const [showModalPemasukan, setShowModalPemasukan] = useState(false)
  const [showModalKategori, setShowModalKategori] = useState(false)
  const [showModalEdit, setShowModalEdit] = useState(false)
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterJenis, setFilterJenis] = useState<'all'|'pemasukan'|'pengeluaran'>('all')
  const [filterBukuKas, setFilterBukuKas] = useState<number|'all'>('all')
  const [filterOperator, setFilterOperator] = useState<number|'all'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const [formData, setFormData] = useState({ buku_kas_id: '', tanggal: new Date().toISOString().split('T')[0], kategori: '', kategori_id: '', nominal: '', keterangan: '', nama_pemohon: '', metode: 'cash' as 'cash'|'transfer' })

  useEffect(() => { loadData() }, [])

  // Reload saat filter tanggal diterapkan
  useEffect(() => { loadData() }, [startDate, endDate])

  const loadData = async () => {
    try {
      setLoading(true)
      // Kirim parameter filter tanggal ke API jika ada
      const params: any = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const [tRes, bkRes, kRes, uRes] = await Promise.all([listTransaksiKas(params), listBukuKas(), listKategoriPengeluaran(), listUsers()])
      if (tRes.success) setTransaksiList(tRes.data)
      if (bkRes.success) setBukuKasList(bkRes.data)
      if (kRes) setCategories(kRes)
      if (uRes.success) setUsers(uRes.data ?? [])
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const ket = formData.nama_pemohon ? `${formData.keterangan} (Pemohon: ${formData.nama_pemohon})` : formData.keterangan
      let kategoriId: number | undefined
      if (formData.kategori_id) { kategoriId = Number(formData.kategori_id) }
      else if (formData.kategori) {
        const found = categories.find(c => c.name.toLowerCase() === formData.kategori.toLowerCase())
        if (found) kategoriId = found.id
        else { try { const created = await createKategoriPengeluaran({ name: formData.kategori }); if (created) { setCategories(p => [...p, created]); kategoriId = created.id } } catch {} }
      }
      const res = await createTransaksiKas({ buku_kas_id: Number(formData.buku_kas_id), tanggal: formData.tanggal, jenis: 'pengeluaran', metode: formData.metode, kategori: formData.kategori, kategori_id: kategoriId, nominal: Number(formData.nominal), keterangan: ket })
      if (res.success) { toast.success('Transaksi pengeluaran berhasil dicatat'); setShowModal(false); setFormData({ buku_kas_id:'', tanggal:new Date().toISOString().split('T')[0], kategori:'', kategori_id:'', nominal:'', keterangan:'', nama_pemohon:'', metode:'cash' }); loadData() }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal mencatat transaksi') }
  }

  const handleEdit = async (id: number, data: any) => {
    try {
      const res = await updateTransaksiKas(id, data)
      if (res.success) { toast.success('Transaksi berhasil diperbarui'); setShowModalEdit(false); setSelectedTransaksi(null); loadData() }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal memperbarui transaksi') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus transaksi ini?')) return
    try { const res = await deleteTransaksiKas(id); if (res.success) { toast.success('Transaksi berhasil dihapus'); loadData() } }
    catch (e: any) { toast.error(e.response?.data?.message || 'Gagal menghapus transaksi') }
  }

  const handleTransfer = async (data: any) => {
    try {
      if (data.dari_buku_kas_id === data.ke_buku_kas_id && data.dari_metode === data.ke_metode) { toast.error('Tidak bisa transfer ke akun yang sama'); return }
      const { nominal, tanggal, keterangan, dari_buku_kas_id, ke_buku_kas_id, dari_metode, ke_metode } = data
      const dariLabel = dari_metode === 'cash' ? 'Cash' : 'Bank'; const keLabel = ke_metode === 'cash' ? 'Cash' : 'Bank'
      const isInternal = dari_buku_kas_id === ke_buku_kas_id
      const dariBK = bukuKasList.find(b => b.id === Number(dari_buku_kas_id))
      const keBK = bukuKasList.find(b => b.id === Number(ke_buku_kas_id))
      if (isInternal) {
        await createTransaksiKas({ buku_kas_id: Number(dari_buku_kas_id), tanggal, jenis: 'pengeluaran', metode: dari_metode, kategori: 'Transfer Internal (Keluar)', nominal: Number(nominal), keterangan: `Transfer internal: ${dariLabel} → ${keLabel} - ${keterangan}` })
        await createTransaksiKas({ buku_kas_id: Number(ke_buku_kas_id), tanggal, jenis: 'pemasukan', metode: ke_metode, kategori: 'Transfer Internal (Masuk)', nominal: Number(nominal), keterangan: `Transfer internal: ${dariLabel} → ${keLabel} - ${keterangan}` })
      } else {
        await createTransaksiKas({ buku_kas_id: Number(dari_buku_kas_id), tanggal, jenis: 'pengeluaran', metode: dari_metode, kategori: 'Transfer Keluar', nominal: Number(nominal), keterangan: `Transfer ke ${keBK?.nama_kas} (${keLabel}) - ${keterangan}` })
        await createTransaksiKas({ buku_kas_id: Number(ke_buku_kas_id), tanggal, jenis: 'pemasukan', metode: ke_metode, kategori: 'Transfer Masuk', nominal: Number(nominal), keterangan: `Transfer dari ${dariBK?.nama_kas} (${dariLabel}) - ${keterangan}` })
      }
      toast.success('Transfer saldo berhasil!'); setShowModalTransfer(false); loadData()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal melakukan transfer') }
  }

  const handleCatatPemasukan = async (data: any) => {
    try {
      const res = await createTransaksiKas(data)
      if (res.success) {
        toast.success('Pemasukan berhasil dicatat')
        setShowModalPemasukan(false)
        loadData()
      }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Gagal mencatat pemasukan') }
  }

  const filtered = transaksiList.filter(t => {
    const matchSearch = !searchQuery || t.no_transaksi.toLowerCase().includes(searchQuery.toLowerCase()) || t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) || t.keterangan?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchJenis = filterJenis === 'all' || t.jenis === filterJenis
    const matchBK = filterBukuKas === 'all' || t.buku_kas_id === filterBukuKas
    const matchOp = filterOperator === 'all' || t.created_by === filterOperator
    let matchDate = true
    if (t.tanggal) {
      const d = new Date(t.tanggal)
      const tgl = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (startDate) matchDate = matchDate && tgl >= startDate
      if (endDate) matchDate = matchDate && tgl <= endDate
    }
    return matchSearch && matchJenis && matchBK && matchOp && matchDate
  }).sort((a, b) => { const diff = new Date(b.created_at).getTime()-new Date(a.created_at).getTime(); return diff !== 0 ? diff : b.id - a.id })

  const totalPemasukan = filtered.filter(t => t.jenis === 'pemasukan' && !t.kategori.includes('Transfer Internal')).reduce((s,t) => s+Number(t.nominal), 0)
  const totalPengeluaran = filtered.filter(t => t.jenis === 'pengeluaran' && !t.kategori.includes('Transfer Internal')).reduce((s,t) => s+Number(t.nominal), 0)
  const saldo = totalPemasukan - totalPengeluaran

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  useEffect(() => { setCurrentPage(1) }, [searchQuery, filterJenis, filterBukuKas, filterOperator, startDate, endDate])

  if (loading) return <div className="p-6 flex items-center justify-center min-h-screen"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600">Memuat data...</p></div></div>

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Transaksi Kas</h1><p className="text-gray-600 mt-1">Kelola transaksi kas masuk dan keluar</p></div>
        {hasAccess('keuangan.transaksi-kas.edit') && (
          <div className="flex gap-3">
            <button onClick={() => setShowModalKategori(true)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200"><Settings className="w-4 h-4" />Kelola Kategori</button>
            <button onClick={() => setShowModalTransfer(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><ArrowRightLeft className="w-5 h-5" />Transfer Saldo</button>
            <button onClick={() => setShowModalPemasukan(true)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><ArrowUpCircle className="w-5 h-5" />Catat Pemasukan</button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><ArrowDownCircle className="w-5 h-5" />Tambah Pengeluaran</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[{label:'Total Pemasukan',val:totalPemasukan,color:'green',icon:ArrowUpCircle},{label:'Total Pengeluaran',val:totalPengeluaran,color:'red',icon:ArrowDownCircle},{label:'Saldo',val:saldo,color:saldo>=0?'blue':'red',icon:null}].map(({label,val,color,icon:Icon}) => (
          <div key={label} className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
            <div><p className="text-sm text-gray-600 mb-1">{label}</p><p className={`text-2xl font-bold text-${color}-600`}>{formatRupiah(val)}</p></div>
            {Icon && <div className={`p-3 bg-${color}-100 rounded-lg`}><Icon className={`w-8 h-8 text-${color}-600`} /></div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" /><input type="text" placeholder="Cari..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
          <select value={filterJenis} onChange={e=>setFilterJenis(e.target.value as any)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="all">Semua Jenis</option><option value="pemasukan">Pemasukan</option><option value="pengeluaran">Pengeluaran</option></select>
          <select value={filterBukuKas} onChange={e=>setFilterBukuKas(e.target.value==='all'?'all':Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="all">Semua Buku Kas</option>{bukuKasList.map(bk=><option key={bk.id} value={bk.id}>{bk.nama_kas}</option>)}</select>
          <select value={filterOperator} onChange={e=>setFilterOperator(e.target.value==='all'?'all':Number(e.target.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="all">Semua Operator</option>{users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <div className="flex gap-1"><input type="date" value={tempStartDate} onChange={e=>setTempStartDate(e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" /><input type="date" value={tempEndDate} onChange={e=>setTempEndDate(e.target.value)} className="flex-1 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" /></div>
          <button onClick={()=>{setStartDate(tempStartDate);setEndDate(tempEndDate)}} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm whitespace-nowrap">Terapkan</button>
          {(startDate || endDate) && <button onClick={()=>{setStartDate('');setEndDate('');setTempStartDate('');setTempEndDate('')}} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>{['No. Transaksi','Tanggal','Buku Kas','Jenis','Kategori','Metode','Nominal','Keterangan','Operator','Aksi'].map(h=><th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${h==='Nominal'?'text-right':'text-left'} ${h==='Aksi'?'text-center':''}`}>{h}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-gray-500"><div className="flex flex-col items-center"><Search className="w-12 h-12 text-gray-400 mb-3" /><p>Tidak ada data transaksi</p></div></td></tr>
              ) : paginated.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{t.no_transaksi}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatTanggal(t.tanggal)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.buku_kas?.nama_kas || '-'}</td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${t.jenis==='pemasukan'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{t.jenis==='pemasukan'?<ArrowUpCircle className="w-3 h-3"/>:<ArrowDownCircle className="w-3 h-3"/>}{t.jenis==='pemasukan'?'Masuk':'Keluar'}</span></td>
                  <td className="px-6 py-4 text-sm">{t.kategori}</td>
                  <td className="px-6 py-4"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${t.metode==='cash'?'bg-blue-100 text-blue-800':'bg-purple-100 text-purple-800'}`}>{t.metode==='cash'?'💵 Cash':'🏦 Transfer'}</span></td>
                  <td className={`px-6 py-4 text-sm font-semibold text-right ${t.jenis==='pemasukan'?'text-green-600':'text-red-600'}`}>{t.jenis==='pemasukan'?'+':'-'} {formatRupiah(t.nominal)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{t.keterangan || '-'}</td>
                  <td className="px-6 py-4 text-sm">{t.author?.name ? <span className="text-gray-700 font-medium">{t.author.name}</span> : <span className="text-gray-400 text-xs">System</span>}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => { setSelectedTransaksi(t); setShowPreview(true) }} className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4" /></button>
                      {!t.pembayaran_id && hasAccess('keuangan.transaksi-kas.edit') && <button onClick={() => { setSelectedTransaksi(t); setShowModalEdit(true) }} className="text-yellow-600 hover:text-yellow-800"><Pencil className="w-4 h-4" /></button>}
                      {!t.pembayaran_id && hasAccess('keuangan.transaksi-kas.delete') ? <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button> : <span className="text-xs text-gray-400" title="Dari pembayaran">🔒</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-600">Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} transaksi</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">«</button>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2).reduce<(number|'...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, []).map((p, i) => p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(p as number)} className={`px-3 py-1 text-sm rounded border ${currentPage === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 bg-white hover:bg-gray-100'}`}>{p}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">›</button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40">»</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10"><h2 className="text-xl font-bold">Tambah Transaksi Pengeluaran</h2><button onClick={() => setShowModal(false)}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Buku Kas <span className="text-red-500">*</span></label><select value={formData.buku_kas_id} onChange={e=>setFormData({...formData,buku_kas_id:e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"><option value="">Pilih Buku Kas</option>{bukuKasList.map(bk=><option key={bk.id} value={bk.id}>{bk.nama_kas}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Tanggal <span className="text-red-500">*</span></label><input type="date" value={formData.tanggal} onChange={e=>setFormData({...formData,tanggal:e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Kategori Pengeluaran <span className="text-red-500">*</span></label><div className="flex gap-2"><div className="flex-1"><input list="kategori-list" type="text" value={formData.kategori} onChange={e=>{ const v=e.target.value; const found=categories.find(c=>c.name.toLowerCase()===v.toLowerCase()); setFormData({...formData,kategori:v,kategori_id:found?String(found.id):''}) }} placeholder="Contoh: Pembelian ATK, Gaji Pegawai" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /><datalist id="kategori-list">{categories.map(c=><option key={c.id} value={c.name}/>)}</datalist></div><button type="button" onClick={async()=>{ if(!formData.kategori.trim()) return; try { const c=await createKategoriPengeluaran({name:formData.kategori}); if(c){setCategories(p=>[...p,c]);setFormData(pv=>({...pv,kategori_id:String(c.id),kategori:c.name}));toast.success('Kategori dibuat')} } catch(e:any){toast.error(e.response?.data?.message||'Gagal')} }} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tambah</button></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label><input type="number" value={formData.nominal} onChange={e=>setFormData({...formData,nominal:e.target.value})} placeholder="0" min="0" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />{formData.nominal && <p className="mt-1 text-sm text-gray-600">{formatRupiah(Number(formData.nominal))}</p>}</div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Nama Pemohon</label><input type="text" value={formData.nama_pemohon} onChange={e=>setFormData({...formData,nama_pemohon:e.target.value})} placeholder="Nama orang yang mengajukan pengeluaran" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Metode <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-3">{(['cash','transfer'] as const).map(m=><button key={m} type="button" onClick={()=>setFormData({...formData,metode:m})} className={`px-4 py-3 border-2 rounded-lg font-medium transition-colors ${formData.metode===m?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-300 hover:border-gray-400'}`}>{m==='cash'?'💵 Cash':'🏦 Transfer'}</button>)}</div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Keterangan <span className="text-red-500">*</span></label><textarea value={formData.keterangan} onChange={e=>setFormData({...formData,keterangan:e.target.value})} placeholder="Detail keterangan pengeluaran..." rows={3} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" /></div>
              <div className="flex gap-3 justify-end pt-4 border-t"><button type="button" onClick={()=>setShowModal(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Batal</button><button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Simpan Pengeluaran</button></div>
            </form>
          </div>
        </div>
      )}

      {showPreview && selectedTransaksi && <ModalPreviewTransaksi transaksi={selectedTransaksi} onClose={() => { setShowPreview(false); setSelectedTransaksi(null) }} onDelete={handleDelete} />}
      {showModalTransfer && <ModalTransferSaldo bukuKasList={bukuKasList} onClose={() => setShowModalTransfer(false)} onTransfer={handleTransfer} />}
      {showModalPemasukan && <ModalCatatPemasukan bukuKasList={bukuKasList} onClose={() => setShowModalPemasukan(false)} onSubmit={handleCatatPemasukan} />}
      {showModalKategori && <ModalKelolaKategori categories={categories} onClose={() => setShowModalKategori(false)} onChange={setCategories} />}
      {showModalEdit && selectedTransaksi && <ModalEditTransaksi transaksi={selectedTransaksi} bukuKasList={bukuKasList} categories={categories} onClose={() => { setShowModalEdit(false); setSelectedTransaksi(null) }} onSubmit={handleEdit} />}
    </div>
  )
}