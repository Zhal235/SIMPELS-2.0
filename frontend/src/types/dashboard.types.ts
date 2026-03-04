export type TahunAjaranAktif = {
  id: number
  nama_tahun_ajaran: string
  bulan_mulai: number
  tahun_mulai: number
  bulan_akhir: number
  tahun_akhir: number
  status: string
}

export type DashboardKpi = {
  totalSantri: number
  totalSaldo: number
  totalTagihan: number
  totalTerbayar: number
  totalTunggakan: number
  tahunAjaranAktif: TahunAjaranAktif | null
}

export type TagihanSummaryItem = {
  jenisTagihanId: number
  namaTagihan: string
  totalNominal: number
  totalDibayar: number
  totalSisa: number
  jumlahLunas: number
  jumlahBelumLunas: number
  totalSantri: number
  persentaseLunas: number
}

export type TrendItem = {
  bulan: string
  tahun: number
  totalNominal: number
  totalDibayar: number
}

export type RecentPaymentItem = {
  id: number
  noTransaksi: string
  namaSantri: string
  namaTagihan: string
  nominalBayar: number
  tanggalBayar: string
  metodePembayaran: string
}

export type BukuKasSummary = {
  id: number
  namaKas: string
  saldoAwal: number
  pemasukan: number
  pengeluaran: number
  saldoBerjalan: number
}

export type KasKeuangan = {
  totalPemasukan: number
  totalPengeluaran: number
  totalSaldoBerjalan: number
  perBukuKas: BukuKasSummary[]
}
