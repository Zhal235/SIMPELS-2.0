import React from 'react'

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
        <select
          value={targetType}
          onChange={e => setTargetType(e.target.value as TargetType)}
          className="input"
          disabled={isSubmitting}
        >
          <option value="individual">Pilih Santri (Anggota Ekskul/Kegiatan)</option>
          <option value="class">Per Kelas</option>
          <option value="all">Semua Santri</option>
        </select>
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
                        x
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Memproses...' : 'Buat Tagihan Kolektif'}
      </button>
    </form>
  )
}
