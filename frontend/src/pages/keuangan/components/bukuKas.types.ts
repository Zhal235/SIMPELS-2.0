export interface TransaksiKasItem {
  id: number
  tanggal: string
  jenis: 'pemasukan' | 'pengeluaran'
  kategori: string
  keterangan: string
  metode: 'cash' | 'transfer'
  nominal: number
  created_at?: string
  created_by?: number
  author?: { id: number; name: string }
}

export interface BukuKasItem {
  id: number
  nama_kas: string
  saldo_cash: number
  saldo_bank: number
  total_saldo: number
  total_pemasukan: number
  total_pengeluaran: number
  transaksi: TransaksiKasItem[]
}
