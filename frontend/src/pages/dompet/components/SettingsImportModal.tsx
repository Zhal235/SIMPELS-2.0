import Modal from '../../../components/Modal'
import { FileText, CheckCircle, AlertCircle, Upload } from 'lucide-react'

interface Props {
  show: boolean
  selectedFile: File | null
  importing: boolean
  previewData: any
  importResults: any
  showConfirm: boolean
  onClose: () => void
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPreview: () => void
  onConfirm: () => void
  onCancelConfirm: () => void
  onExecuteImport: () => void
}

const DetailTable = ({ data, columns }: { data: any[]; columns: string[] }) => (
  <div className="max-h-80 overflow-y-auto border rounded-lg">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 sticky top-0 z-10">
        <tr>{columns.map(c=><th key={c} className="px-3 py-2 text-left font-medium text-gray-600 border-b">{c}</th>)}</tr>
      </thead>
      <tbody>{data.map((r:any) => <tr key={r.row} className={r.status==='error'||r.status!=='success'?'bg-red-50':'hover:bg-gray-50'}>
        <td className="px-3 py-2 border-b text-gray-600">{r.row}</td>
        <td className="px-3 py-2 border-b"><span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status==='ready'||r.status==='success'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>{r.status==='ready'?'Siap':r.status==='success'?'Berhasil':r.status==='error'?'Error':'Gagal'}</span></td>
        <td className="px-3 py-2 border-b">{r.nis||'-'}</td>
        <td className="px-3 py-2 border-b">{r.nama||'-'}</td>
        <td className="px-3 py-2 border-b">{(r.saldo!==undefined&&r.saldo!==null&&r.saldo!=='')?`Rp ${parseFloat(String(r.saldo)).toLocaleString('id-ID')}`:(r.new_balance!==undefined&&r.new_balance!==null)?`Rp ${parseFloat(String(r.new_balance)).toLocaleString('id-ID')}`:'-'}</td>
        <td className="px-3 py-2 border-b">{(r.status==='error'||r.status!=='success')&&r.message?<span className="flex items-start gap-1 text-red-700"><AlertCircle size={14} className="mt-0.5 flex-shrink-0" />{r.message}</span>:<span className="text-green-600 text-xs">—</span>}</td>
      </tr>)}</tbody>
    </table>
  </div>
)

export default function SettingsImportModal({ show, selectedFile, importing, previewData, importResults, showConfirm, onClose, onFileSelect, onPreview, onConfirm, onCancelConfirm, onExecuteImport }: Props) {
  return (
    <>
      <Modal open={show} title="Import Saldo dari Excel" onClose={onClose}
        footer={<div className="flex justify-between w-full">
          <button className="btn" onClick={onClose}>Tutup</button>
          <div className="flex gap-2">
            {selectedFile && !previewData && <button className="btn btn-primary flex items-center gap-2" onClick={onPreview} disabled={importing}>{importing?'Preview...':'Preview Data'}</button>}
            {previewData && <button className="btn btn-success flex items-center gap-2" onClick={onConfirm} disabled={importing}><CheckCircle size={16} />Import {previewData.total_rows} Data</button>}
          </div>
        </div>}>
        <div className="space-y-4">
          {!selectedFile && <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"><FileText size={48} className="mx-auto text-gray-400 mb-4" /><p className="text-lg font-medium">Pilih file Excel</p><p className="text-sm text-gray-500">Format: .xlsx atau .xls, maksimal 10MB</p><input type="file" accept=".xlsx,.xls" onChange={onFileSelect} className="mt-4" /></div>}
          {selectedFile && !previewData && !importResults && <div className="bg-gray-50 border rounded-lg p-4"><div className="flex items-center gap-3"><FileText size={24} className="text-blue-500" /><div><p className="font-medium">{selectedFile.name}</p><p className="text-sm text-gray-500">{(selectedFile.size/1024/1024).toFixed(2)} MB</p></div><button className="ml-auto text-red-500 hover:text-red-700" onClick={()=>onFileSelect({target:{files:null}} as any)}>Hapus</button></div></div>}
          {previewData && !importResults && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Preview Data</h4>
                <div className="grid grid-cols-3 gap-4 text-sm"><div><span className="font-medium">Total:</span> {previewData.total_rows}</div><div><span className="font-medium">Siap:</span> <span className="text-green-600 font-semibold">{previewData.success}</span></div><div><span className="font-medium">Error:</span> <span className="text-red-600 font-semibold">{previewData.errors}</span></div></div>
                {previewData.errors>0 && <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"><AlertCircle size={16} className="text-red-500 mt-0.5" /><p className="text-sm text-red-700"><strong>{previewData.errors} baris tidak dapat diimport</strong> — lihat kolom <strong>Keterangan Error</strong> di bawah.</p></div>}
              </div>
              {previewData.details?.length > 0 && <DetailTable data={previewData.details} columns={['Baris','Status','NIS','Nama','Saldo','Keterangan Error']} />}
            </div>
          )}
          {importResults && (
            <div className="space-y-4">
              <div className={`border rounded-lg p-4 ${importResults.errors>0?'bg-yellow-50 border-yellow-200':'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className={importResults.errors>0?'text-yellow-500':'text-green-500'} /><h4 className={`font-medium ${importResults.errors>0?'text-yellow-800':'text-green-800'}`}>Import Selesai</h4></div>
                <div className="grid grid-cols-3 gap-4 text-sm"><div><span className="font-medium">Total:</span> {importResults.total_rows}</div><div><span className="font-medium">Berhasil:</span> <span className="text-green-700 font-semibold">{importResults.success}</span></div><div><span className="font-medium">Gagal:</span> <span className="text-red-600 font-semibold">{importResults.errors}</span></div></div>
              </div>
              {importResults.details?.length > 0 && <DetailTable data={importResults.details} columns={['Baris','Status','NIS','Nama','Saldo Baru','Keterangan Error']} />}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={showConfirm} title="⚠️ Konfirmasi Import Data" onClose={onCancelConfirm}
        footer={<div className="flex justify-end gap-2"><button className="btn" onClick={onCancelConfirm} disabled={importing}>Batal</button><button className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2" onClick={onExecuteImport} disabled={importing}>{importing?<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Import...</>:<><CheckCircle size={16} />Ya, Import Sekarang</>}</button></div>}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3"><AlertCircle size={24} className="text-yellow-600 mt-1" /><div><h4 className="font-medium text-yellow-800 mb-2">Peringatan Penting!</h4><div className="text-sm text-yellow-700 space-y-1"><p>• Akan <strong>menggantikan saldo saat ini</strong> dengan data dari Excel</p><p>• Proses ini <strong>tidak dapat dibatalkan</strong></p><p>• Pastikan data Excel sudah benar</p></div></div></div>
        </div>
      </Modal>
    </>
  )
}
