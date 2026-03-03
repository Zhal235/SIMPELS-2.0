export interface JenisTagihanItem {
  id: number
  namaTagihan: string
  kategori: 'Rutin' | 'Non Rutin'
  bulan: string[]
  tipeNominal: 'sama' | 'per_kelas' | 'per_individu'
  nominalSama?: number
  nominalPerKelas?: { kelas: string; nominal: number }[]
  nominalPerIndividu?: { santriId: string; santriNama: string; nominal: number }[]
  jatuhTempo: string
  bukuKasId: number
  bukuKas?: string
}
