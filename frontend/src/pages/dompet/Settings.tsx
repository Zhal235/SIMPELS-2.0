import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getWalletSettings, updateGlobalMinBalance, getAllSantriWithLimits, setSantriDailyLimit, bulkUpdateSantriLimits } from '../../api/walletSettings'
import { importWalletExcel, downloadWalletTemplate } from '../../api/wallet'
import { Upload, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import SettingsImportModal from './components/SettingsImportModal'

export default function Settings() {
  const [globalMinBalance, setGlobalMinBalance] = useState(0)
  const [tempGlobalMinBalance, setTempGlobalMinBalance] = useState(0)
  const [santriLimits, setSantriLimits] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [editingSantri, setEditingSantri] = useState<any|null>(null)
  const [editingValue, setEditingValue] = useState<number|''>('')
  const [loading, setLoading] = useState(true)
  const [showEditGlobal, setShowEditGlobal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportSection, setShowImportSection] = useState(false)
  const [showConfirmImport, setShowConfirmImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File|null>(null)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [importResults, setImportResults] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [sRes, lRes] = await Promise.all([getWalletSettings(), getAllSantriWithLimits()])
      if (sRes?.success) { const b=sRes.data?.global_settings?.global_minimum_balance||0; setGlobalMinBalance(b); setTempGlobalMinBalance(b) }
      if (lRes?.success) setSantriLimits((lRes.data||[]).map((s:any)=>({...s})))
    } catch { toast.error('Gagal memuat data settings') }
    finally { setLoading(false) }
  }

  async function handleSaveGlobalMinBalance() {
    try {
      const res = await updateGlobalMinBalance(parseFloat(String(tempGlobalMinBalance||0)))
      if (res.success) { setGlobalMinBalance(tempGlobalMinBalance as number); setShowEditGlobal(false); toast.success('Saldo minimal diperbarui') }
    } catch { toast.error('Gagal menyimpan') }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target?.files?.[0]
    if (!file) { setSelectedFile(null); return }
    if (!file.name.match(/\.(xlsx|xls)$/i)) { toast.error('Format file harus .xlsx atau .xls'); return }
    if (file.size > 10*1024*1024) { toast.error('File terlalu besar (maksimal 10MB)'); return }
    setSelectedFile(file); setPreviewData(null); setImportResults(null)
  }

  async function handlePreviewImport() {
    if (!selectedFile) return
    setImporting(true)
    try {
      const res = await importWalletExcel(selectedFile, 'preview')
      if (res?.success) setPreviewData(res.data)
      else toast.error(res?.message||'Gagal preview')
    } catch (e:any) { toast.error(e.response?.data?.message||'Gagal preview') }
    finally { setImporting(false) }
  }

  async function handleExecuteImport() {
    if (!selectedFile) return
    setImporting(true); setShowConfirmImport(false)
    try {
      const res = await importWalletExcel(selectedFile, 'execute')
      if (res?.success) { setImportResults(res.data); toast.success(`Berhasil import ${res.data?.success||0} data santri`); load() }
      else toast.error(res?.message||'Gagal import')
    } catch (e:any) { toast.error(e.response?.data?.message||'Gagal import') }
    finally { setImporting(false) }
  }

  async function handleDownloadTemplate() {
    setDownloading(true)
    try { await downloadWalletTemplate() } catch { toast.error('Gagal download template') }
    finally { setDownloading(false) }
  }

  function resetImport() { setShowImportModal(false); setSelectedFile(null); setPreviewData(null); setImportResults(null); setShowConfirmImport(false) }

  async function handleSaveSingle() {
    if (!editingSantri) return
    try {
      const res = await setSantriDailyLimit(editingSantri.id, Number(editingValue)||0)
      if (res?.success) { toast.success('Limit diperbarui'); setSantriLimits(p=>p.map(s=>s.id===editingSantri.id?{...s,daily_limit:Number(editingValue)||0}:s)); setEditingSantri(null); setEditingValue('') }
    } catch { toast.error('Gagal menyimpan') }
  }

  async function handleSetDefaultAll() {
    if (!confirm('Tetapkan limit harian Rp 15.000 untuk semua santri?')) return
    try { const limits=santriLimits.map((s:any)=>({santri_id:s.id,daily_limit:15000})); const res=await bulkUpdateSantriLimits(limits); if(res?.success){toast.success('Berhasil menetapkan limit default');load()} else toast.error(res?.message||'Gagal') }
    catch(e:any) { toast.error(e?.response?.data?.message||'Gagal reset limit') }
  }

  const filtered = santriLimits.filter(s => { const q=searchQ.toLowerCase(); return !q||String(s.nama_santri).toLowerCase().includes(q)||String(s.nis).toLowerCase().includes(q) })
  const totalPages = Math.ceil(filtered.length/itemsPerPage)
  const paginated = filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)

  const limitsColumns = [
    { key:'nis', header:'NIS' },
    { key:'nama_santri', header:'Nama Santri' },
    { key:'daily_limit', header:'Limit Harian (Rp)', render:(v:any)=><div>{`Rp ${parseFloat(String(v||0)).toLocaleString('id-ID')}`}</div> },
    { key:'actions', header:'Aksi', render:(_:any,r:any)=><button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={()=>{setEditingSantri(r);setEditingValue(r.daily_limit||0)}}>Edit</button> }
  ]

  return (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold">Setting Dompet Digital</h2><p className="text-sm text-gray-500 mt-1">Atur saldo minimal global dan limit transaksi per santri untuk kontrol RFID</p></div>
      {loading ? <Card><div className="p-6 text-center text-gray-500">Memuat...</div></Card> : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-semibold">Saldo Minimal Global</h3><p className="text-sm text-gray-500">Mencegah santri belanja/jajan jika saldo kurang dari nilai ini</p></div>
              <button className="btn btn-primary" onClick={()=>{setTempGlobalMinBalance(globalMinBalance);setShowEditGlobal(true)}}>Ubah</button>
            </div>
            <div className="text-3xl font-bold text-blue-600">Rp {parseFloat(globalMinBalance.toString()).toLocaleString('id-ID')}</div>
          </Card>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <div><h3 className="text-lg font-semibold">Limit Transaksi per Santri</h3><p className="text-sm text-gray-500">Limit harian — gunakan kolom Aksi untuk mengubah nilai per santri</p></div>
              <div className="flex items-center gap-3">
                <input placeholder="Cari santri (nama/NIS)" value={searchQ} onChange={e=>{setSearchQ(e.target.value);setCurrentPage(1)}} className="rounded border px-3 py-2" />
                <button className="btn btn-primary text-sm" onClick={handleSetDefaultAll}>Set Default Semua</button>
              </div>
            </div>
            <Card>
              {santriLimits.length === 0 ? <div className="p-6 text-center text-gray-500">Belum ada santri aktif</div> : (
                <>
                  <Table columns={limitsColumns} data={paginated} getRowKey={(r)=>r.id}
                    renderExpandedRow={(row:any)=>editingSantri?.id===row.id?(
                      <div className="p-3"><div className="grid md:grid-cols-3 gap-4 items-end">
                        <div><label className="block text-sm font-medium">NIS</label><input disabled value={row.nis} className="rounded border px-3 py-2 w-full bg-gray-100" /></div>
                        <div><label className="block text-sm font-medium">Nama Santri</label><input disabled value={row.nama_santri} className="rounded border px-3 py-2 w-full bg-gray-100" /></div>
                        <div><label className="block text-sm font-medium">Limit Harian (Rp)</label><input type="number" value={editingValue as any} onChange={e=>setEditingValue(e.target.value?parseFloat(e.target.value):'')} className="rounded border px-3 py-2 w-full" /></div>
                        <div className="md:col-span-3 flex justify-end gap-2"><button className="btn" onClick={()=>{setEditingSantri(null);setEditingValue('')}}>Batal</button><button className="btn btn-primary" onClick={handleSaveSingle}>Simpan</button></div>
                      </div></div>
                    ):null}
                  />
                  {totalPages > 1 && <div className="flex items-center justify-between mt-4 p-4 border-t"><div className="text-sm text-gray-500">Menampilkan {(currentPage-1)*itemsPerPage+1} - {Math.min(currentPage*itemsPerPage,filtered.length)} dari {filtered.length} santri</div><div className="flex items-center gap-2"><button className="btn btn-sm" onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} disabled={currentPage===1}>Previous</button><span className="text-sm text-gray-600">Hal. {currentPage}/{totalPages}</span><button className="btn btn-sm" onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}>Next</button></div></div>}
                </>
              )}
            </Card>
          </div>

          <Card className="border-2 border-green-200 bg-green-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div><h3 className="text-lg font-semibold text-green-800">🔄 Import Saldo dari Excel</h3><p className="text-sm text-green-700">Import data saldo awal santri dari file Excel</p></div>
              <div className="flex gap-2">
                <button className="btn flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700" onClick={handleDownloadTemplate} disabled={downloading}><Download size={16} />{downloading?'Download...':'Template Excel'}</button>
                <button className={`btn flex items-center gap-2 text-sm ${showImportSection?'bg-orange-100 text-orange-700 border border-orange-300':'bg-gray-100 text-gray-500 border border-gray-300'}`} onClick={()=>setShowImportSection(v=>!v)}>{showImportSection?'🔒 Sembunyikan':'⚙️ Aktifkan Import'}</button>
                {showImportSection && <button className="btn btn-success flex items-center gap-2 text-lg px-6" onClick={()=>setShowImportModal(true)}><Upload size={18} />Import Excel</button>}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><h4 className="font-medium text-blue-800 mb-2">📋 Langkah-langkah Import:</h4><div className="text-sm text-blue-700 space-y-1"><p><strong>1.</strong> Download template Excel</p><p><strong>2.</strong> Isi kolom SALDO</p><p><strong>3.</strong> Upload dan preview hasil</p><p><strong>4.</strong> Import data</p><p className="mt-2 font-medium text-blue-800">⚠️ Jangan ubah kolom NIS</p></div></div>
          </Card>
        </>
      )}

      <Modal open={showEditGlobal} title="Ubah Saldo Minimal Global" onClose={()=>setShowEditGlobal(false)}
        footer={<><button className="btn" onClick={()=>setShowEditGlobal(false)}>Batal</button><button className="btn btn-primary" onClick={handleSaveGlobalMinBalance}>Simpan</button></>}>
        <div className="space-y-3">
          <label className="block text-sm font-medium">Saldo Minimal (Rp)</label>
          <input type="number" value={tempGlobalMinBalance} onChange={e=>setTempGlobalMinBalance(parseFloat(e.target.value)||0)} min="0" step="1000" className="rounded-md border px-3 py-2 w-full" />
          <p className="text-xs text-gray-500">Masukkan jumlah minimal saldo dalam Rupiah</p>
        </div>
      </Modal>

      <SettingsImportModal show={showImportModal} selectedFile={selectedFile} importing={importing} previewData={previewData} importResults={importResults} showConfirm={showConfirmImport} onClose={resetImport} onFileSelect={handleFileSelect} onPreview={handlePreviewImport} onConfirm={()=>setShowConfirmImport(true)} onCancelConfirm={()=>setShowConfirmImport(false)} onExecuteImport={handleExecuteImport} />
    </div>
  )
}