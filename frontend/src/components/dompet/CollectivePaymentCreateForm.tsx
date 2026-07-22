import React from 'react'
import { Loader2, CheckCircle2, Users, BookOpen, School } from 'lucide-react'

type TargetType = 'individual' | 'class' | 'all'

type KelasItem = {
  id: number | string
  nama_kelas: string
}

type SantriItem = {
  id: string
  nama_santri?: string
  nis?: string
}

type Props = {
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  amount: string
  setAmount: (value: string) => void
  targetType: TargetType
  setTargetType: (value: TargetType) => void
  classId: string
  setClassId: (value: string) => void
  santriIds: string[]
  setSantriIds: (value: string[]) => void
  kelasList: KelasItem[]
  santriList: SantriItem[]
  searchSantri: string
  setSearchSantri: (value: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export default function CollectivePaymentCreateForm({
  title,
  setTitle,
  description,
  setDescription,
  amount,
  setAmount,
  targetType,
  setTargetType,
  classId,
  setClassId,
  santriIds,
  setSantriIds,
  kelasList,
  santriList,
  searchSantri,
  setSearchSantri,
  isSubmitting,
  onSubmit,
}: Props) {
  const filteredSantri = santriList.filter(
    s => s.nama_santri?.toLowerCase().includes(searchSantri.toLowerCase()) || s.nis?.includes(searchSantri),
  )

  // Prevent any form interaction while submitting
  const handleFormSubmit = (e: React.FormEvent) => {
    if (isSubmitting) {
      e.preventDefault()
      return
    }
    onSubmit(e)
  }

  const targetLabel = targetType === 'individual'
    ? `${santriIds.length} santri terpilih`
    : targetType === 'class'
    ? kelasList.find(k => String(k.id) === classId)?.nama_kelas || 'kelas terpilih'
    : 'Semua santri aktif'

  return (
    <div className="relative">
      {/* ── Loading Overlay ── */}
      {isSubmitting && (
        <div
          className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-lg bg-white/90 backdrop-blur-sm"
          aria-live="assertive"
          aria-label="Sedang memproses tagihan kolektif"
        >
          <div className="flex flex-col items-center gap-4 px-8 py-10 rounded-2xl bg-white shadow-xl border border-blue-100 text-center max-w-sm w-full mx-4">
            {/* Spinner */}
            <div className="relative">
              <Loader2 className="h-14 w-14 animate-spin text-blue-600" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-lg font-bold text-gray-900">Memproses Tagihan...</p>
              <p className="text-sm text-gray-500 mt-1">Jangan tutup atau refresh halaman ini</p>
            </div>

            {/* Summary of what's being processed */}
            <div className="w-full bg-blue-50 rounded-lg p-3 text-sm space-y-1 text-left">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-medium text-gray-900 truncate">{title || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>Nominal: <span className="font-semibold text-gray-700">Rp {Number(amount || 0).toLocaleString('id-ID')}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span>Target: <span className="font-semibold text-gray-700">{targetLabel}</span></span>
              </div>
            </div>

            {/* Animated progress bar */}
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleFormSubmit} className={`space-y-4 ${isSubmitting ? 'pointer-events-none select-none' : ''}`}>
        <div>
          <label className="block text-sm font-medium mb-1">Judul Tagihan *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Iuran Ekskul Basket - Januari 2025"
            className="input"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Keterangan tambahan (optional)"
            className="input"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nominal per Santri *</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="10000"
            className="input"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Target *</label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'individual', label: 'Per Santri', icon: <Users className="h-4 w-4" /> },
              { value: 'class',      label: 'Per Kelas',  icon: <BookOpen className="h-4 w-4" /> },
              { value: 'all',        label: 'Semua',      icon: <School className="h-4 w-4" /> },
            ] as const).map(opt => (
              <button
                key={opt.value}
                type="button"
                disabled={isSubmitting}
                onClick={() => setTargetType(opt.value)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                  targetType === opt.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {targetType === 'class' && (
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Kelas *</label>
            <select
              value={classId}
              onChange={e => setClassId(e.target.value)}
              className="input"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>
                  {k.nama_kelas}
                </option>
              ))}
            </select>
          </div>
        )}

        {targetType === 'individual' && (
          <div>
            <label className="block text-sm font-medium mb-1">Pilih Santri * (Anggota Ekskul/Kegiatan)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ketik nama santri (min 2 huruf)..."
                value={searchSantri}
                onChange={e => setSearchSantri(e.target.value)}
                className="input"
                disabled={isSubmitting}
              />
              {searchSantri.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredSantri.slice(0, 10).map(santri => (
                    <div
                      key={santri.id}
                      onClick={() => {
                        if (isSubmitting) return
                        if (!santriIds.includes(santri.id)) {
                          setSantriIds([...santriIds, santri.id])
                        }
                        setSearchSantri('')
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0"
                    >
                      <div className="font-medium">{santri.nama_santri}</div>
                      <div className="text-sm text-gray-500">{santri.nis}</div>
                    </div>
                  ))}
                  {filteredSantri.length === 0 && (
                    <div className="p-3 text-gray-500 text-center">Tidak ada santri ditemukan</div>
                  )}
                </div>
              )}
            </div>

            {santriIds.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Santri Terpilih ({santriIds.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {santriIds.map(id => {
                    const santri = santriList.find(s => s.id === id)
                    if (!santri) return null
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{santri.nama_santri}</span>
                        <button
                          type="button"
                          onClick={() => setSantriIds(santriIds.filter(sid => sid !== id))}
                          className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Submit button — one-click enforced ── */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold text-sm transition-all
            ${isSubmitting
              ? 'bg-blue-400 text-white cursor-not-allowed opacity-80'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }`}
          aria-disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sedang Memproses... Mohon tunggu
            </>
          ) : (
            'Buat Tagihan Kolektif'
          )}
        </button>
      </form>
    </div>
  )
}
