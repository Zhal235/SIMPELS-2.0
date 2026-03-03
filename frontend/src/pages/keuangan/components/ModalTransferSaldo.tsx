import { useState } from 'react'
import { X, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft } from 'lucide-react'

const formatRupiah = (v: number | undefined | null) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0)

interface Props {
  bukuKasList: any[]
  onClose: () => void
  onTransfer: (data: any) => Promise<void>
}

export default function ModalTransferSaldo({ bukuKasList, onClose, onTransfer }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ dari_buku_kas_id: '', ke_buku_kas_id: '', dari_metode: 'cash' as 'cash'|'transfer', ke_metode: 'cash' as 'cash'|'transfer', tanggal: today, nominal: '', keterangan: '' })
  const getSaldo = (id: string, metode: string) => { const bk = bukuKasList.find((b: any) => b.id === Number(id)); return bk ? (metode === 'cash' ? bk.saldo_cash : bk.saldo_bank) || 0 : 0 }
  const MetodeBtn = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button type="button" onClick={onClick} className={`px-4 py-2 border-2 rounded-lg font-medium transition-colors ${active ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-300 hover:border-gray-400'}`}>{label}</button>
  )
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div><h2 className="text-xl font-bold">Transfer Saldo</h2><p className="text-sm text-gray-500 mt-1">Transfer saldo antar kas atau antar metode pembayaran</p></div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onTransfer(form) }} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 mb-4 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" />Dari (Sumber)</h3>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Buku Kas <span className="text-red-500">*</span></label><select value={form.dari_buku_kas_id} onChange={e=>setForm({...form,dari_buku_kas_id:e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"><option value="">Pilih Buku Kas</option>{bukuKasList.map((bk:any)=><option key={bk.id} value={bk.id}>{bk.nama_kas}</option>)}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Dari Akun <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-2"><MetodeBtn active={form.dari_metode==='cash'} onClick={()=>setForm({...form,dari_metode:'cash'})} label="💵 Cash" /><MetodeBtn active={form.dari_metode==='transfer'} onClick={()=>setForm({...form,dari_metode:'transfer'})} label="🏦 Bank" /></div></div>
              {form.dari_buku_kas_id && <div className="p-3 bg-white border border-red-300 rounded-lg"><p className="text-xs text-gray-600 mb-1">Saldo Tersedia:</p><p className="text-lg font-bold text-red-700">{formatRupiah(getSaldo(form.dari_buku_kas_id,form.dari_metode))}</p><p className="text-xs text-gray-500 mt-1">{form.dari_metode==='cash'?'Saldo Cash':'Saldo Bank'}</p></div>}
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-4 flex items-center gap-2"><ArrowDownCircle className="w-4 h-4" />Ke (Tujuan)</h3>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Buku Kas <span className="text-red-500">*</span></label><select value={form.ke_buku_kas_id} onChange={e=>setForm({...form,ke_buku_kas_id:e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"><option value="">Pilih Buku Kas</option>{bukuKasList.map((bk:any)=><option key={bk.id} value={bk.id}>{bk.nama_kas}</option>)}</select></div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Ke Akun <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-2"><MetodeBtn active={form.ke_metode==='cash'} onClick={()=>setForm({...form,ke_metode:'cash'})} label="💵 Cash" /><MetodeBtn active={form.ke_metode==='transfer'} onClick={()=>setForm({...form,ke_metode:'transfer'})} label="🏦 Bank" /></div></div>
              {form.ke_buku_kas_id && (
                <div className="p-3 bg-white border border-green-300 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Saldo Saat Ini:</p>
                  <p className="text-lg font-bold text-green-700">{formatRupiah(getSaldo(form.ke_buku_kas_id,form.ke_metode))}</p>
                  {form.nominal && Number(form.nominal) > 0 && <div className="mt-2 pt-2 border-t border-green-200"><p className="text-xs text-gray-600">Saldo Setelah Transfer:</p><p className="text-sm font-semibold text-green-800">{formatRupiah(getSaldo(form.ke_buku_kas_id,form.ke_metode)+Number(form.nominal))}</p></div>}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center"><div className="bg-purple-100 p-3 rounded-full border-4 border-white shadow-lg"><ArrowRightLeft className="w-6 h-6 text-purple-600" /></div></div>
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Detail Transfer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Tanggal <span className="text-red-500">*</span></label><input type="date" value={form.tanggal} onChange={e=>setForm({...form,tanggal:e.target.value})} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Nominal <span className="text-red-500">*</span></label><input type="number" value={form.nominal} onChange={e=>setForm({...form,nominal:e.target.value})} placeholder="0" min="0" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />{form.nominal && <p className="mt-1 text-sm text-gray-600">{formatRupiah(Number(form.nominal))}</p>}</div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Keterangan</label><textarea value={form.keterangan} onChange={e=>setForm({...form,keterangan:e.target.value})} placeholder="Keterangan transfer..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" /></div>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Batal</button>
            <button type="submit" className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Proses Transfer</button>
          </div>
        </form>
      </div>
    </div>
  )
}