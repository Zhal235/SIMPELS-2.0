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

export type KasSummaryRow = {
  buku_kas_id: number
  nama_kas: string
  total_pemasukan: number
  total_pengeluaran: number
  saldo_berjalan: number
}

export type KasSummaryData = {
  data: KasSummaryRow[]
  total: {
    pemasukan: number
    pengeluaran: number
    saldo: number
  }
}
