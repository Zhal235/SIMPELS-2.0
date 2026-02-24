import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getWalletSettings, updateGlobalMinBalance, getAllSantriWithLimits, setSantriDailyLimit, bulkUpdateSantriLimits } from '../../api/walletSettings'
import { importWalletExcel, downloadWalletTemplate } from '../../api/wallet'
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const [globalMinBalance, setGlobalMinBalance] = useState(0)
  const [tempGlobalMinBalance, setTempGlobalMinBalance] = useState(0)
  const [santriLimits, setSantriLimits] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [editingSantri, setEditingSantri] = useState<any | null>(null)
  const [editingValue, setEditingValue] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [showEditGlobal, setShowEditGlobal] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Import Excel states
  const [showImportModal, setShowImportModal] = useState(false)
  const [showImportSection, setShowImportSection] = useState(false)
  const [showConfirmImport, setShowConfirmImport] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [importResults, setImportResults] = useState<any>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [settingsRes, santriRes] = await Promise.all([getWalletSettings(), getAllSantriWithLimits()])
      if (settingsRes?.success) {
        const minBal = settingsRes.data?.global_settings?.global_minimum_balance || 0
        setGlobalMinBalance(minBal)
        setTempGlobalMinBalance(minBal)
      }
      if (santriRes?.success) setSantriLimits((santriRes.data || []).map((s: any) => ({ ...s })))
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data settings')
    } finally { setLoading(false) }
  }

  async function handleSaveGlobalMinBalance() {
    try {
      const res = await updateGlobalMinBalance(parseFloat(String(tempGlobalMinBalance || 0)))
      if (res.success) {
        toast.success('Saldo minimal global berhasil diperbarui')
        setGlobalMinBalance(tempGlobalMinBalance)
        setShowEditGlobal(false)
        load()
      } else toast.error(res.message || 'Gagal memperbarui saldo minimal')
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal memperbarui saldo minimal')
    }
  }

  // Import Excel functions
  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/)) {
        toast.error('File harus format Excel (.xlsx atau .xls)')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File terlalu besar (maksimal 10MB)')
        return
      }
      setSelectedFile(file)
      setPreviewData(null)
      setImportResults(null)
    }
  }

  async function handlePreviewImport() {
    if (!selectedFile) return
    
    setImporting(true)
    try {
      const res = await importWalletExcel(selectedFile, 'preview')
      if (res.success) {
        setPreviewData(res.data)
        toast.success(`Preview berhasil: ${res.data.total_rows} baris data`)
      } else {
        toast.error(res.message || 'Gagal preview data')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal preview data')
    } finally {
      setImporting(false)
    }
  }

  async function handleExecuteImport() {
    if (!selectedFile || !previewData) return

    setShowConfirmImport(false)
    
    setImporting(true)
    try {
      const res = await importWalletExcel(selectedFile, 'execute')
      if (res.success) {
        setImportResults(res.data)
        setPreviewData(null)
        toast.success(`Import selesai: ${res.data.success} berhasil, ${res.data.errors} gagal`)
        
        // Refresh data after import
        load()
      } else {
        toast.error(res.message || 'Gagal import data')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal import data')
    } finally {
      setImporting(false)
    }
  }

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      await downloadWalletTemplate()
      toast.success('Template berhasil didownload')
    } catch (err: any) {
      console.error(err)
      if (err?.response?.status === 404) {
        toast.error('Endpoint belum tersedia. Silakan clear cache di server atau hubungi admin.')
      } else {
        toast.error(err?.response?.data?.message || 'Gagal download template')
      }
    } finally {
      setDownloading(false)
    }
  }

  function resetImport() {
    setSelectedFile(null)
    setPreviewData(null)
    setImportResults(null)
    setShowImportModal(false)
    setShowConfirmImport(false)
  }

  async function handleSaveSingle() {
    if (!editingSantri) return
    try {
      const res = await setSantriDailyLimit(editingSantri.id, Number(editingValue || 0))
      if (res.success) {
        toast.success('Limit transaksi santri berhasil diperbarui')
        setEditingSantri(null)
        setEditingValue('')
        await load()
      } else {
        toast.error(res.message || 'Gagal memperbarui limit')
      }
    } catch (err:any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal memperbarui limit')
    }
  }

  async function handleSetDefaultAll() {
    if (!confirm('Tetapkan limit harian Rp 15.000 untuk semua santri?')) return
    try {
      const limits = santriLimits.map((s: any) => ({ santri_id: s.id, daily_limit: 15000 }))
      const res = await bulkUpdateSantriLimits(limits)
      if (res.success) {
        toast.success('Berhasil menetapkan limit default untuk semua santri')
        await load()
      } else {
        toast.error(res.message || 'Gagal menetapkan limit default')
      }
    } catch (err:any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Gagal menetapkan limit default')
    }
  }

  // Pagination logic
  const filteredSantriLimits = santriLimits.filter(s => {
    if (!searchQ || searchQ.trim().length < 2) return true
    const q = searchQ.toLowerCase()
    return String(s.nama_santri).toLowerCase().includes(q) || String(s.nis).toLowerCase().includes(q)
  })
  
  const totalPages = Math.ceil(filteredSantriLimits.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedSantriLimits = filteredSantriLimits.slice(startIndex, startIndex + itemsPerPage)
  
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const limitsColumns = [
    { key: 'nis', header: 'NIS' },
    { key: 'nama_santri', header: 'Nama Santri' },
    { key: 'daily_limit', header: 'Limit Harian (Rp)', render: (v: any) => (
      <div>{`Rp ${parseFloat(String(v || 0)).toLocaleString('id-ID')}`}</div>
    ) },
    { key: 'actions', header: 'Aksi', render: (_v:any, r:any) => (
      <div className="flex gap-2">
        <button className="px-3 py-1 rounded bg-yellow-500 text-white text-sm" onClick={() => { setEditingSantri(r); setEditingValue(r.daily_limit || 0) }}>Edit</button>
      </div>
    ) }
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Setting Dompet Digital</h2>
        <p className="text-sm text-gray-500 mt-1">Atur saldo minimal global dan limit transaksi per santri untuk kontrol RFID</p>
      </div>

      {loading ? (
        <Card><div className="p-6 text-center text-gray-500">Memuat...</div></Card>
      ) : (
        <>
          {/* Global Min Balance Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Saldo Minimal Global</h3>
                <p className="text-sm text-gray-500">Mencegah santri belanja/jajan jika saldo kurang dari nilai ini</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setTempGlobalMinBalance(globalMinBalance); setShowEditGlobal(true) }}>Ubah</button>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              Rp {parseFloat(globalMinBalance.toString()).toLocaleString('id-ID')}
            </div>
          </Card>

          {/* Per-Santri Limits Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
              <div>
                <h3 className="text-lg font-semibold">Limit Transaksi per Santri</h3>
                <p className="text-sm text-gray-500">Limit harian read-only — gunakan kolom Aksi untuk mengubah nilai per santri</p>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  placeholder="Cari santri (nama/NIS)" 
                  value={searchQ} 
                  onChange={(e) => { setSearchQ(e.target.value); setCurrentPage(1) }} 
                  className="rounded border px-3 py-2" 
                />
                <button
                  className="btn btn-primary text-sm"
                  onClick={handleSetDefaultAll}
                >
                  Set Default Semua
                </button>
              </div>
            </div>

            <Card>
              {santriLimits.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Belum ada santri aktif</div>
              ) : (
                <>
                  <Table
                    columns={limitsColumns}
                    data={paginatedSantriLimits}
                    getRowKey={(r) => r.id}
                    renderExpandedRow={(row:any) => (
                      editingSantri?.id === row.id ? (
                        <div className="p-3">
                          <div className="grid md:grid-cols-3 gap-4 items-end">
                            <div>
                              <label className="block text-sm font-medium">NIS</label>
                              <input disabled value={row.nis} className="rounded border px-3 py-2 w-full bg-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">Nama Santri</label>
                              <input disabled value={row.nama_santri} className="rounded border px-3 py-2 w-full bg-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">Limit Harian (Rp)</label>
                              <input type="number" value={editingValue as any} onChange={(e) => setEditingValue(e.target.value ? parseFloat(e.target.value) : '')} className="rounded border px-3 py-2 w-full" />
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2">
                              <button className="btn" onClick={() => { setEditingSantri(null); setEditingValue('') }}>Batal</button>
                              <button className="btn btn-primary" onClick={handleSaveSingle}>Simpan</button>
                            </div>
                          </div>
                        </div>
                      ) : null
                    )}
                  />
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 p-4 border-t">
                      <div className="text-sm text-gray-500">
                        Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredSantriLimits.length)} dari {filteredSantriLimits.length} santri
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="btn btn-sm" 
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Halaman {currentPage} dari {totalPages}
                        </span>
                        <button 
                          className="btn btn-sm" 
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>

          {/* Import Excel Section */}
          <Card className="border-2 border-green-200 bg-green-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div>
                <h3 className="text-lg font-semibold text-green-800">🔄 Import Saldo dari Excel</h3>
                <p className="text-sm text-green-700">Import data saldo awal santri dari file Excel dengan mudah dan aman</p>
              </div>
              <div className="flex gap-2">
                <button 
                  className="btn flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleDownloadTemplate}
                  disabled={downloading}
                >
                  <Download size={16} />
                  {downloading ? 'Download...' : 'Template Excel'}
                </button>
                <button
                  className={`btn flex items-center gap-2 text-sm ${
                    showImportSection
                      ? 'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-500 border border-gray-300 hover:bg-gray-200'
                  }`}
                  onClick={() => setShowImportSection(v => !v)}
                  title="Tampilkan/sembunyikan tombol import"
                >
                  {showImportSection ? '🔒 Sembunyikan' : '⚙️ Aktifkan Import'}
                </button>
                {showImportSection && (
                  <button 
                    className="btn btn-success flex items-center gap-2 text-lg px-6"
                    onClick={() => setShowImportModal(true)}
                  >
                    <Upload size={18} />
                    Import Excel
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">📋 Langkah-langkah Import:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>1.</strong> Download template Excel dengan data santri terdaftar</p>
                <p><strong>2.</strong> Isi kolom SALDO sesuai kebutuhan (angka saja, contoh: 50000)</p>
                <p><strong>3.</strong> Upload file Excel dan preview hasilnya</p>
                <p><strong>4.</strong> Jika sudah benar, lakukan import data</p>
                <p className="mt-2 font-medium text-blue-800">⚠️ Catatan: Jangan ubah kolom NIS agar sistem dapat mengenali santri</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Edit Global Min Balance Modal */}
      <Modal 
        open={showEditGlobal} 
        title="Ubah Saldo Minimal Global" 
        onClose={() => setShowEditGlobal(false)}
        footer={(
          <>
            <button className="btn" onClick={() => setShowEditGlobal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSaveGlobalMinBalance}>Simpan</button>
          </>
        )}
      >
        <div className="space-y-3">
          <label className="block text-sm font-medium">Saldo Minimal (Rp)</label>
          <input 
            type="number" 
            value={tempGlobalMinBalance} 
            onChange={(e) => setTempGlobalMinBalance(parseFloat(e.target.value) || 0)}
            min="0"
            step="1000"
            className="rounded-md border px-3 py-2 w-full"
          />
          <p className="text-xs text-gray-500">Masukkan jumlah minimal saldo dalam Rupiah</p>
        </div>
      </Modal>

      {/* Import Excel Modal */}
      <Modal 
        open={showImportModal} 
        title="Import Saldo dari Excel" 
        onClose={resetImport}
        footer={(
          <div className="flex justify-between w-full">
            <button className="btn" onClick={resetImport}>Tutup</button>
            <div className="flex gap-2">
              {selectedFile && !previewData && (
                <button 
                  className="btn btn-primary flex items-center gap-2"
                  onClick={handlePreviewImport}
                  disabled={importing}
                >
                  {importing ? 'Preview...' : 'Preview Data'}
                </button>
              )}
              {previewData && (
                <button 
                  className="btn btn-success flex items-center gap-2"
                  onClick={() => setShowConfirmImport(true)}
                  disabled={importing}
                >
                  <CheckCircle size={16} />
                  Import {previewData.total_rows} Data
                </button>
              )}
            </div>
          </div>
        )}
      >
        <div className="space-y-4">
          {/* File Upload */}
          {!selectedFile && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Pilih file Excel</p>
                <p className="text-sm text-gray-500">Format: .xlsx atau .xls, maksimal 10MB</p>
                <input 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleFileSelect}
                  className="mt-4"
                />
              </div>
            </div>
          )}

          {/* File Selected */}
          {selectedFile && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-blue-500" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button 
                  className="ml-auto text-red-500 hover:text-red-700"
                  onClick={() => setSelectedFile(null)}
                >
                  Hapus
                </button>
              </div>
            </div>
          )}

          {/* Preview Results */}
          {previewData && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Preview Data</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Baris:</span>
                    <span className="ml-2">{previewData.total_rows}</span>
                  </div>
                  <div>
                    <span className="font-medium">Siap Import:</span>
                    <span className="ml-2 text-green-600 font-semibold">{previewData.success}</span>
                  </div>
                  <div>
                    <span className="font-medium">Error:</span>
                    <span className="ml-2 text-red-600 font-semibold">{previewData.errors}</span>
                  </div>
                </div>
                {previewData.errors > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      <strong>{previewData.errors} baris tidak dapat diimport</strong> karena terdapat error. 
                      Lihat kolom <strong>Keterangan Error</strong> pada tabel di bawah untuk detail penyebabnya. 
                      Baris yang error akan <strong>dilewati</strong> saat proses import.
                    </p>
                  </div>
                )}
              </div>

              {previewData.details && previewData.details.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      Menampilkan semua <strong>{previewData.details.length}</strong> baris data
                      {previewData.errors > 0 && (
                        <span className="ml-2 text-red-600">({previewData.errors} error)</span>
                      )}
                    </p>
                  </div>
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Baris</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">NIS</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Nama</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Saldo</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Keterangan Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.details.map((r: any) => (
                          <tr key={r.row} className={r.status === 'error' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-3 py-2 border-b text-gray-600">{r.row}</td>
                            <td className="px-3 py-2 border-b">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.status === 'ready' ? 'bg-green-100 text-green-800' :
                                r.status === 'error' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'}`}>
                                {r.status === 'ready' ? 'Siap' : r.status === 'error' ? 'Error' : r.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b">{r.nis || '-'}</td>
                            <td className="px-3 py-2 border-b">{r.nama || '-'}</td>
                            <td className="px-3 py-2 border-b">
                              {r.saldo !== undefined && r.saldo !== null && r.saldo !== ''
                                ? `Rp ${parseFloat(String(r.saldo)).toLocaleString('id-ID')}`
                                : '-'}
                            </td>
                            <td className="px-3 py-2 border-b">
                              {r.status === 'error' ? (
                                <span className="flex items-start gap-1 text-red-700">
                                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                  {r.message || 'Terjadi error tidak diketahui'}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${importResults.errors > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className={importResults.errors > 0 ? 'text-yellow-500' : 'text-green-500'} />
                  <h4 className={`font-medium ${importResults.errors > 0 ? 'text-yellow-800' : 'text-green-800'}`}>Import Selesai</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total:</span>
                    <span className="ml-2">{importResults.total_rows}</span>
                  </div>
                  <div>
                    <span className="font-medium">Berhasil:</span>
                    <span className="ml-2 text-green-700 font-semibold">{importResults.success}</span>
                  </div>
                  <div>
                    <span className="font-medium">Gagal:</span>
                    <span className="ml-2 text-red-600 font-semibold">{importResults.errors}</span>
                  </div>
                </div>
                {importResults.errors > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">
                      <strong>{importResults.errors} baris gagal diimport.</strong> Lihat kolom <strong>Keterangan Error</strong> pada tabel di bawah untuk mengetahui penyebabnya.
                    </p>
                  </div>
                )}
              </div>

              {importResults.details && importResults.details.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Menampilkan semua <strong>{importResults.details.length}</strong> baris hasil import
                    {importResults.errors > 0 && (
                      <span className="ml-2 text-red-600">({importResults.errors} gagal)</span>
                    )}
                  </p>
                  <div className="max-h-80 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Baris</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">NIS</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Nama</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Saldo Baru</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600 border-b">Keterangan Error</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importResults.details.map((r: any) => (
                          <tr key={r.row} className={r.status !== 'success' ? 'bg-red-50' : 'hover:bg-gray-50'}>
                            <td className="px-3 py-2 border-b text-gray-600">{r.row}</td>
                            <td className="px-3 py-2 border-b">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {r.status === 'success' ? 'Berhasil' : 'Gagal'}
                              </span>
                            </td>
                            <td className="px-3 py-2 border-b">{r.nis || '-'}</td>
                            <td className="px-3 py-2 border-b">{r.nama || '-'}</td>
                            <td className="px-3 py-2 border-b">
                              {r.new_balance !== undefined && r.new_balance !== null
                                ? `Rp ${parseFloat(String(r.new_balance)).toLocaleString('id-ID')}`
                                : '-'}
                            </td>
                            <td className="px-3 py-2 border-b">
                              {r.status !== 'success' ? (
                                <span className="flex items-start gap-1 text-red-700">
                                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                  {r.message || 'Terjadi error tidak diketahui'}
                                </span>
                              ) : (
                                <span className="text-green-600 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal 
        open={showConfirmImport} 
        title="⚠️ Konfirmasi Import Data"
        onClose={() => setShowConfirmImport(false)}
        footer={(
          <div className="flex justify-end gap-2">
            <button 
              className="btn" 
              onClick={() => setShowConfirmImport(false)}
              disabled={importing}
            >
              Batal
            </button>
            <button 
              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2" 
              onClick={handleExecuteImport}
              disabled={importing}
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Import...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Ya, Import Sekarang
                </>
              )}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-yellow-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Peringatan Penting!</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Proses import akan <strong>menggantikan saldo saat ini</strong> dengan data dari Excel</p>
                  <p>• Proses ini <strong>tidak dapat dibatalkan</strong> setelah dijalankan</p>
                  <p>• Pastikan data di Excel sudah benar sebelum melanjutkan</p>
                </div>
              </div>
            </div>
          </div>

          {previewData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Data yang akan diimport:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total data:</span>
                  <span className="ml-2">{previewData.total_rows}</span>
                </div>
                <div>
                  <span className="font-medium">Siap import:</span>
                  <span className="ml-2 text-green-600">{previewData.success}</span>
                </div>
              </div>
              {previewData.errors > 0 && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ {previewData.errors} data akan diabaikan karena error
                </p>
              )}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Yakin ingin melanjutkan proses import? 
          </div>
        </div>
      </Modal>
      
    </div>
  )
}
