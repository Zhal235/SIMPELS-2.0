import type { TagihanSantriRow } from '../../../types/tagihanSantri.types'

interface Props {
  row: {
    id: string
    santri_index: number
    santri_id: string
    santri_nama: string
    kelas: string
    jenis_tagihan_id: number
    bulan: string[]
    nominal: number
  }
  idx: number
  dataTagihan: TagihanSantriRow[]
  jenisTagihan: any[]
  loadingJenis: boolean
  availableBulan: { bulan: string; tahun: number }[]
  isNominalDisabled: boolean
  onUpdate: (id: string, field: string, value: any) => void
  onRemove: (id: string) => void
}

export default function TunggakanRow({ row, idx, dataTagihan, jenisTagihan, loadingJenis, availableBulan, isNominalDisabled, onUpdate, onRemove }: Props) {
  return (
    <tr key={`${row.id}-${row.santri_id}`} className="border-b">
      <td className="px-3 py-2 border text-center">{idx + 1}</td>
      <td className="px-3 py-2 border">
        <div className="space-y-1">
          <select
            value={row.santri_index}
            onChange={(e) => {
              const index = parseInt(e.target.value, 10)
              if (!isNaN(index) && index >= 0) onUpdate(row.id, 'santri_index', index)
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value={-1}>-- Pilih Santri --</option>
            {dataTagihan.map((s, i) => (
              <option key={i} value={i}>{s.santri_nama} ({s.kelas})</option>
            ))}
          </select>
          {row.santri_id && row.santri_nama && (
            <div className="text-xs text-green-600 font-medium">✓ {row.santri_nama} - {row.kelas}</div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 border">
        <select
          value={row.jenis_tagihan_id}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) onUpdate(row.id, 'jenis_tagihan_id', v) }}
          className="w-full px-2 py-1 border rounded text-sm"
          disabled={loadingJenis || jenisTagihan.length === 0}
        >
          <option value={0}>-- Pilih Jenis --</option>
          {jenisTagihan.map(j => {
            const jId = j?.id || j?.ID || j?.jenis_tagihan_id
            const jNama = j?.nama_tagihan || j?.namaTagihan || j?.name || 'Unknown'
            return <option key={jId} value={jId}>{jNama}</option>
          })}
        </select>
      </td>
      <td className="px-3 py-2 border">
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">Pilih Bulan (bisa lebih dari 1):</div>
          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
            {!row.santri_id || !row.jenis_tagihan_id ? (
              <div className="text-xs text-gray-500 italic">Pilih santri dan jenis tagihan terlebih dahulu</div>
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {availableBulan.map(b => {
                  const isSelected = Array.isArray(row.bulan) && row.bulan.includes(b.bulan)
                  return (
                    <label key={`${b.bulan}-${b.tahun}`} className={`flex items-center gap-1 px-2 py-1 text-xs rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'} border`}>
                      <input type="checkbox" checked={isSelected} onChange={() => onUpdate(row.id, 'bulan', b.bulan)} className="w-3 h-3" />
                      <span>{b.bulan} {b.tahun}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          {Array.isArray(row.bulan) && row.bulan.length > 0 && (
            <div className="text-xs text-green-600 font-medium">✓ {row.bulan.length} bulan dipilih: {row.bulan.join(', ')}</div>
          )}
        </div>
      </td>
      <td className="px-3 py-2 border">
        <input
          type="number"
          value={row.nominal}
          onChange={(e) => onUpdate(row.id, 'nominal', Number(e.target.value))}
          className="w-full px-2 py-1 border rounded text-sm text-right"
          placeholder="0"
          disabled={isNominalDisabled}
        />
      </td>
      <td className="px-3 py-2 border text-center">
        <button onClick={() => onRemove(row.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Hapus</button>
      </td>
    </tr>
  )
}
