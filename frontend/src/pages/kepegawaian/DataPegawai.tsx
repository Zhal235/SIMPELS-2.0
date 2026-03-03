import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Toaster, toast } from 'sonner'
import { getPegawai, getPegawaiDetail, createPegawai, updatePegawai, deletePegawai, Pegawai } from '../../api/pegawai'
import { getJabatan, getDepartments } from '../../api/struktur'
import PegawaiForm from './components/PegawaiForm'

async function compressImage(file: File): Promise<Blob> {
  const img: HTMLImageElement = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file) })
  const scale = img.width > 1024 ? 1024 / img.width : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  const quality = file.size > 1024*1024 ? 0.7 : 0.9
  return (await fetch(canvas.toDataURL('image/jpeg', quality))).blob()
}

export default function DataPegawai() {
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<Pegawai[]>([])
  const [jabatan, setJabatan] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [formData, setFormData] = useState<any>({ nama_pegawai:'', jenis_pegawai:'Pendidik', status_kepegawaian:'Tetap', jenis_kelamin:'L' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchData = async (page = 1) => {
    setIsLoading(true)
    try {
      const [res, jRes, dRes] = await Promise.all([getPegawai({ page, search }), getJabatan(), getDepartments()])
      setData(res.data); setJabatan(jRes.data||jRes); setDepartments(dRes.data||dRes)
      setPagination({ currentPage: res.current_page, lastPage: res.last_page, total: res.total })
    } catch { toast.error('Gagal memuat data pegawai') }
    finally { setIsLoading(false) }
  }

  useEffect(() => { const t = setTimeout(() => fetchData(1), 500); return () => clearTimeout(t) }, [search])

  const resetForm = () => { setFormData({ nama_pegawai:'', jenis_pegawai:'Pendidik', status_kepegawaian:'Tetap', jenis_kelamin:'L', foto_profil:undefined, selectedJabatan:[] }); setEditId(null); setIsEditing(false) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true)
    try {
      const fd = new FormData()
      const fields = ['nama_pegawai','nip','nuptk','nik','gelar_depan','gelar_belakang','jenis_kelamin','tempat_lahir','tanggal_lahir','alamat','no_hp','email','jenis_pegawai','status_kepegawaian','tanggal_mulai_tugas','jabatan','pendidikan_terakhir','status_pernikahan','nama_ibu_kandung']
      fields.forEach(f => { const v=formData[f]; if(v!==undefined&&v!==null&&v!=='') fd.append(f,String(v)) })
      if(formData.selectedJabatan?.length) formData.selectedJabatan.forEach((id:number,i:number)=>{ fd.append(`jabatan_ids[${i}]`,String(id)); fd.append(`is_primary[${i}]`,i===0?'1':'0') })
      if(formData.foto_profil instanceof Blob) fd.append('foto_profil',formData.foto_profil,'profile.jpg')
      if(isEditing&&editId) await updatePegawai(editId,fd); else await createPegawai(fd)
      toast.success(isEditing?'DATA BERHASIL DISIMPAN!':'PEGAWAI BARU DITAMBAHKAN',{duration:4000})
      setIsModalOpen(false); setTimeout(()=>fetchData(pagination.currentPage),300); resetForm()
    } catch(e:any) {
      const msg=e.response?.data?.message||'Gagal menyimpan data'; toast.error('GAGAL MENYIMPAN',{description:msg})
      if(e.response?.data?.errors?.foto_profil) toast.error('Error foto: '+e.response.data.errors.foto_profil.join(', '))
    } finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id: number) => {
    if(!confirm('Hapus data pegawai ini?')) return
    try { await deletePegawai(id); toast.success('Pegawai berhasil dihapus'); fetchData(pagination.currentPage) }
    catch { toast.error('Gagal menghapus pegawai') }
  }

  const handleEdit = async (pegawai: Pegawai) => {
    try {
      const detail = await getPegawaiDetail(pegawai.id)
      setFormData({ ...detail, foto_profil: typeof detail.foto_profil==='string'?detail.foto_profil:undefined, selectedJabatan: detail.jabatan?.map((j:any)=>j.id)||[] })
      setEditId(pegawai.id); setIsEditing(true); setIsModalOpen(true)
    } catch { toast.error('Gagal memuat detail pegawai') }
  }

  const columns = [
    { header:'Nama Pegawai', key:'nama_pegawai', render:(_:any,row:Pegawai)=><div><div className="font-medium text-gray-900">{row.gelar_depan} {row.nama_pegawai} {row.gelar_belakang}</div><div className="text-xs text-gray-500">{row.nip||'NIP: -'}</div></div> },
    { header:'Status', key:'status', render:(_:any,row:Pegawai)=><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.status_kepegawaian==='Tetap'?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{row.jenis_pegawai} - {row.status_kepegawaian}</span> },
    { header:'Kontak', key:'kontak', render:(_:any,row:Pegawai)=><div className="text-sm text-gray-500"><div>{row.no_hp||'-'}</div><div>{row.email||'-'}</div></div> },
    { header:'Jabatan', key:'jabatan', render:(_:any,row:Pegawai)=>{ if(row.jabatan&&Array.isArray(row.jabatan)&&row.jabatan.length>0) return <div className="space-y-1">{row.jabatan.slice(0,2).map((j:any)=><div key={j.id} className="flex items-center gap-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.pivot?.is_primary?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-700'}`}>{j.nama}</span>{j.pivot?.is_primary&&<span className="text-xs text-blue-600">★</span>}</div>)}{row.jabatan.length>2&&<span className="text-xs text-gray-500">+{row.jabatan.length-2} lainnya</span>}</div>; return <span className="text-gray-500 text-sm">-</span> } },
    { header:'Aksi', key:'aksi', render:(_:any,row:Pegawai)=><div className="flex items-center gap-2"><button onClick={()=>handleEdit(row)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button><button onClick={()=>handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button></div> }
  ]

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Data Pegawai</h1><p className="text-sm text-gray-500">Manajemen data guru dan staf</p></div>
        <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90"><Plus className="w-4 h-4" />Tambah Pegawai</button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="mb-4 relative max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
          <input type="text" placeholder="Cari nama, NIP..." className="pl-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {isLoading ? <div className="p-8 text-center text-gray-500">Memuat...</div> : <Table columns={columns} data={data} />}
        {pagination.lastPage > 1 && (
          <div className="flex items-center justify-between mt-4 border-t pt-4">
            <p className="text-sm text-gray-600">Menampilkan {data.length} dari {pagination.total} pegawai</p>
            <nav className="flex gap-1">
              {Array.from({length:pagination.lastPage},(_,i)=>i+1).map(p=><button key={p} onClick={()=>fetchData(p)} className={`px-3 py-1 rounded text-sm ${p===pagination.currentPage?'bg-brand text-white':'border border-gray-300 hover:bg-gray-50'}`}>{p}</button>)}
            </nav>
          </div>
        )}
      </div>
      <Modal open={isModalOpen} onClose={()=>setIsModalOpen(false)} title={isEditing?'Edit Data Pegawai':'Tambah Pegawai Baru'} footer={null}>
        <PegawaiForm formData={formData} setFormData={setFormData} jabatan={jabatan} departments={departments} isEditing={isEditing} isSubmitting={isSubmitting} onClose={()=>setIsModalOpen(false)} onSubmit={handleSubmit} onCompressImage={compressImage} />
      </Modal>
    </div>
  )
}