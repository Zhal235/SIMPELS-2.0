export interface DetailTagihan {
  id: number
  jenis_tagihan: string
  bulan: string
  tahun: number
  nominal: number
  status: 'belum_bayar' | 'lunas' | 'sebagian'
  dibayar: number
  sisa: number
  jatuh_tempo: string
}

export interface TagihanSantriRow {
  santri_id: number
  santri_nama: string
  kelas: string
  total_tagihan: number
  total_dibayar: number
  sisa_tagihan: number
  detail_tagihan: DetailTagihan[]
}
