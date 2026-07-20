export type TunggakanTagihan = {
  id: number
  jenis_tagihan: {
    nama_tagihan: string
  }
  bulan: string
  tahun: number
  nominal: number
  sisa: number
  jatuh_tempo: string | null
  umur_tunggakan_hari: number | null
}

export type TunggakanSantri = {
  santri_id: string
  santri: {
    nama_santri: string
    nis: string
    kelas?: string
    kelas_nama?: string
    asrama?: {
      nama_asrama: string
    }
    status: string
  }
  tagihan: TunggakanTagihan[]
  total_tunggakan: number
  jumlah_tagihan: number
  tagihan_tertua: string | null
}

type AlumniItem = {
  id: string
  nama_santri?: string
  nis?: string
  kelas_nama?: string
  kelas?: string
  asrama?: {
    nama_asrama: string
  }
  status?: string
}

type TagihanItem = {
  santri_id: string
  detail_tagihan?: Array<{
    id: number
    jenis_tagihan: {
      nama_tagihan: string
    }
    bulan: string
    tahun: number
    nominal: number
    sisa: number | string
    jatuh_tempo?: string | null
    status?: string
  }>
}

type TagihanDetailItem = NonNullable<TagihanItem['detail_tagihan']>[number]

const BULAN_MAP: Record<string, number> = {
  Januari: 0,
  Februari: 1,
  Maret: 2,
  April: 3,
  Mei: 4,
  Juni: 5,
  Juli: 6,
  Agustus: 7,
  September: 8,
  Oktober: 9,
  November: 10,
  Desember: 11,
}

function parseDueDate(tagihan: TagihanDetailItem, today: Date): Date | null {
  if (tagihan.jatuh_tempo && tagihan.jatuh_tempo !== 'Tanggal 10 setiap bulan') {
    const parsed = new Date(tagihan.jatuh_tempo)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const bulanParts = tagihan.bulan?.split(' ') || []
  const bulanNama = bulanParts[0]
  const tahun = tagihan.tahun || Number.parseInt(bulanParts[1] || '', 10) || today.getFullYear()
  const bulanNum = BULAN_MAP[bulanNama] ?? 0
  const parsed = new Date(tahun, bulanNum, 10)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function buildTunggakanAlumniData(alumniList: AlumniItem[], tagihanList: TagihanItem[]) {
  const today = new Date()
  const tagihanBySantri = new Map<string, TagihanItem>(tagihanList.map(item => [String(item.santri_id), item]))
  const groupedBySantri: Record<string, TunggakanSantri> = {}

  alumniList.forEach((santri) => {
    const santriTagihan = tagihanBySantri.get(String(santri.id))
    if (!santriTagihan || !santriTagihan.detail_tagihan) return

    const tunggakan = santriTagihan.detail_tagihan.filter((tagihan) => {
      const sisa = Number.parseFloat(String(tagihan.sisa || 0))
      return sisa > 0 && tagihan.status !== 'lunas'
    })

    if (tunggakan.length === 0) return

    let totalTunggakan = 0
    let tagihanTertua: string | null = null

    const tagihanWithAge: TunggakanTagihan[] = tunggakan.map((tagihan) => {
      const dueDate = parseDueDate(tagihan, today)
      const sisa = Number.parseFloat(String(tagihan.sisa || 0))
      totalTunggakan += sisa

      if (dueDate) {
        const dueDateIso = dueDate.toISOString().split('T')[0]
        if (!tagihanTertua || dueDate.getTime() < new Date(tagihanTertua).getTime()) {
          tagihanTertua = dueDateIso
        }

        return {
          ...tagihan,
          jatuh_tempo: dueDateIso,
          umur_tunggakan_hari: Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))),
          sisa,
        } as TunggakanTagihan
      }

      return {
        ...tagihan,
        jatuh_tempo: null,
        umur_tunggakan_hari: null,
        sisa,
      } as TunggakanTagihan
    })

    groupedBySantri[santri.id] = {
      santri_id: santri.id,
      santri: {
        nama_santri: santri.nama_santri || '',
        nis: santri.nis || '',
        kelas: santri.kelas_nama || santri.kelas,
        kelas_nama: santri.kelas_nama || santri.kelas,
        asrama: santri.asrama,
        status: santri.status || '',
      },
      tagihan: tagihanWithAge,
      total_tunggakan: totalTunggakan,
      jumlah_tagihan: tunggakan.length,
      tagihan_tertua: tagihanTertua,
    }
  })

  return Object.values(groupedBySantri)
}