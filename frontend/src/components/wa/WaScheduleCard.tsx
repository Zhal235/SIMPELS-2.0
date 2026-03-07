import { useState, useEffect } from 'react'
import { Clock, CalendarDays, ToggleLeft, ToggleRight, Save, Info } from 'lucide-react'
import type { WaSchedule } from '../../types/wa.types'

interface Props {
  schedule: WaSchedule
  label: string
  description: string
  saving: boolean
  onSave: (data: Partial<WaSchedule>) => void
}

const MAX_DATES = 3

export function WaScheduleCard({ schedule, label, description, saving, onSave }: Props) {
  const [enabled, setEnabled] = useState(schedule.enabled)
  const [jam, setJam] = useState(schedule.jam)
  const [tanggal, setTanggal] = useState<number[]>(schedule.tanggal_kirim)
  const [inputValue, setInputValue] = useState('')

  useEffect(() => {
    setEnabled(schedule.enabled)
    setJam(schedule.jam)
    setTanggal(schedule.tanggal_kirim)
  }, [schedule])

  const addTanggal = () => {
    const val = parseInt(inputValue)
    if (!val || val < 1 || val > 28) return
    if (tanggal.includes(val) || tanggal.length >= MAX_DATES) return
    setTanggal(prev => [...prev, val].sort((a, b) => a - b))
    setInputValue('')
  }

  const removeTanggal = (t: number) => setTanggal(prev => prev.filter(x => x !== t))

  const isDirty =
    enabled !== schedule.enabled ||
    jam !== schedule.jam ||
    JSON.stringify(tanggal) !== JSON.stringify(schedule.tanggal_kirim)

  const handleSave = () => onSave({ enabled, jam, tanggal_kirim: tanggal })

  return (
    <div className={`bg-white rounded-xl border ${enabled ? 'border-green-200' : 'border-gray-200'} overflow-hidden`}>
      <div className={`px-4 py-3 flex items-center justify-between ${enabled ? 'bg-green-50' : 'bg-gray-50'} border-b`}>
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <button onClick={() => setEnabled(!enabled)} className="text-gray-400 hover:text-gray-600">
          {enabled
            ? <ToggleRight className="w-8 h-8 text-green-600" />
            : <ToggleLeft className="w-8 h-8 text-gray-300" />}
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Waktu */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
            <Clock className="w-3.5 h-3.5" /> Waktu Pengiriman
          </label>
          <input type="time" value={jam} onChange={e => setJam(e.target.value)}
            disabled={!enabled}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-50 disabled:text-gray-400" />
        </div>

        {/* Tanggal kirim */}
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
            <CalendarDays className="w-3.5 h-3.5" /> Tanggal Kirim (maks. {MAX_DATES})
          </label>

          <div className="flex flex-wrap gap-2 mb-2 min-h-8">
            {tanggal.map(t => (
              <span key={t} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-sm font-medium">
                Tgl {t}
                {enabled && (
                  <button onClick={() => removeTanggal(t)} className="hover:text-red-600 leading-none">&times;</button>
                )}
              </span>
            ))}
            {tanggal.length === 0 && (
              <span className="text-xs text-gray-400 italic">Belum ada tanggal</span>
            )}
          </div>

          {enabled && tanggal.length < MAX_DATES && (
            <div className="flex gap-2">
              <input type="number" min={1} max={28} value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTanggal()}
                placeholder="1-28" className="w-20 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button onClick={addTanggal}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
                + Tambah
              </button>
            </div>
          )}
        </div>

        {/* Info last run */}
        {schedule.last_ran_date && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Info className="w-3.5 h-3.5" />
            Terakhir dikirim: {new Date(schedule.last_ran_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        {isDirty && (
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium">
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Jadwal'}
          </button>
        )}
      </div>
    </div>
  )
}
