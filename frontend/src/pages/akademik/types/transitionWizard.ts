export interface TransitionTargetOption {
  id: number
  nama_kelas: string
}

export interface GraduationPreview {
  success?: boolean
  tingkat_akhir: number
  jumlah_santri: number
  daftar_kelas: Array<{ id: number; nama_kelas: string; tingkat: number }>
}

export interface PromotionMappingItem {
  source_id: number
  source_nama: string
  source_tingkat: number
  target_nama: string
  target_tingkat: number
  target_exists: boolean
  target_id: number | null
  target_options: TransitionTargetOption[]
  jumlah_santri: number
}

export interface TransitionSummary {
  graduated: number
  promoted: number
  createdClasses: number
}

export interface TahunAjaranOption {
  id: number
  nama_tahun_ajaran: string
  status: string
  [key: string]: unknown
}
