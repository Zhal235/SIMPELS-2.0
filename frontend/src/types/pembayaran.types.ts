export type OrangTua = {
  nama_ayah?: string
  hp_ayah?: string
  no_hp?: string
  no_hp_ayah?: string
  nama_ibu?: string
  hp_ibu?: string
  no_hp_ibu?: string
}

export type Santri = {
  id: number
  nama_santri: string
  nis?: string
  nisn?: string
  foto?: string
  alamat?: string
  kelas?: string
  asrama?: string
  nama_ayah?: string
  hp_ayah?: string
  no_hp?: string
  no_hp_ayah?: string
  nama_ibu?: string
  hp_ibu?: string
  no_hp_ibu?: string
  orang_tua?: OrangTua
}

export type Tagihan = {
  id: number | string
  bulan: string
  tahun: string | number
  nominal: number
  dibayar: number
  sisa: number
  status: 'belum_bayar' | 'sebagian' | 'lunas'
  jatuh_tempo: string
  jenis_tagihan: {
    id: number
    nama_tagihan: string
    kategori: 'Rutin' | 'Non Rutin'
    buku_kas_id: number
  }
  jumlahBayar?: number
  tipe?: 'rutin' | 'non-rutin'
  jenisTagihan?: string
  sisaBayar?: number
  tglBayar?: string
  adminPenerima?: string
  tglJatuhTempo?: string
  originalId?: number
  bayar?: number
  sisaTagihan?: number
}
