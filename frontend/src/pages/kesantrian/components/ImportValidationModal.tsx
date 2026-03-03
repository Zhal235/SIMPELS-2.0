interface ValidationResult {
  can_import: boolean
  message: string
  summary: { total_rows: number; valid_rows: number; invalid_rows: number; warnings_count: number }
  invalid_rows?: { row: number; nama: string; nis: string; errors: string[] }[]
  warnings?: string[]
  valid_rows?: { nama: string; nis: string; jenis_kelamin: string; tempat_lahir: string; tanggal_lahir: string; warnings?: string[] }[]
}

interface Props {
  open: boolean
  validationResult: ValidationResult | null
  selectedFile: File | null
  importing: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ImportValidationModal({ open, validationResult, selectedFile, importing, onConfirm, onCancel }: Props) {
  if (!open || !validationResult) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Preview & Validasi Import Data</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedFile?.name} • {validationResult.summary.total_rows} baris data
          </p>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard value={validationResult.summary.valid_rows} label="Data Valid" color="green" />
            <SummaryCard value={validationResult.summary.invalid_rows} label="Data Error" color="red" />
            <SummaryCard value={validationResult.summary.warnings_count} label="Peringatan" color="yellow" />
          </div>

          <div className={`p-4 rounded-lg ${validationResult.can_import ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${validationResult.can_import ? 'text-green-800' : 'text-red-800'}`}>
              {validationResult.message}
            </p>
          </div>

          {validationResult.invalid_rows && validationResult.invalid_rows.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-red-700 flex items-center gap-2">
                <span className="bg-red-100 px-2 py-1 rounded text-sm">{validationResult.invalid_rows.length}</span>
                Baris dengan Error (Wajib Diperbaiki)
              </h3>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {validationResult.invalid_rows.map((row, idx) => (
                  <div key={idx} className="p-3 hover:bg-red-50">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-gray-900">Baris {row.row}: {row.nama || 'Nama tidak tersedia'}</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">NIS: {row.nis || 'Kosong'}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {row.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-600">❌ {error}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationResult.warnings && validationResult.warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-yellow-700 flex items-center gap-2">
                <span className="bg-yellow-100 px-2 py-1 rounded text-sm">{validationResult.warnings.length}</span>
                Peringatan (Opsional, tetap bisa diimport)
              </h3>
              <div className="border rounded-lg p-3 bg-yellow-50 max-h-40 overflow-y-auto">
                <ul className="space-y-1">
                  {validationResult.warnings.map((warning, idx) => (
                    <li key={idx} className="text-sm text-yellow-700">⚠️ {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {validationResult.valid_rows && validationResult.valid_rows.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700 flex items-center gap-2">
                <span className="bg-green-100 px-2 py-1 rounded text-sm">{validationResult.summary.valid_rows}</span>
                Data Valid (Preview 10 baris pertama)
              </h3>
              <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                {validationResult.valid_rows.slice(0, 10).map((row, idx) => (
                  <div key={idx} className="p-3 hover:bg-green-50 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{row.nama}</div>
                      <div className="text-sm text-gray-600">NIS: {row.nis} • {row.jenis_kelamin} • {row.tempat_lahir}, {row.tanggal_lahir}</div>
                    </div>
                    {row.warnings && row.warnings.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{row.warnings.length} warning</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <span className={`text-sm font-medium ${validationResult.can_import ? 'text-green-700' : 'text-red-700'}`}>
            {validationResult.can_import ? '✓ File siap diimport' : '✗ Perbaiki error sebelum import'}
          </span>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100" onClick={onCancel} disabled={importing}>
              Batal
            </button>
            {validationResult.can_import && (
              <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" onClick={onConfirm} disabled={importing}>
                {importing ? 'Mengimport...' : `Import ${validationResult.summary.valid_rows} Data`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ value, label, color }: { value: number; label: string; color: 'green' | 'red' | 'yellow' }) {
  const styles = {
    green: 'bg-green-50 border-green-200 text-green-700 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-700 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 text-yellow-600',
  }
  const [bg, border, textBold, textLight] = styles[color].split(' ')
  return (
    <div className={`${bg} border ${border} rounded-lg p-4`}>
      <div className={`text-2xl font-bold ${textBold}`}>{value}</div>
      <div className={`text-sm ${textLight}`}>{label}</div>
    </div>
  )
}
