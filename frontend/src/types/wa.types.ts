export interface WaGatewayStatus {
  status: 'connected' | 'disconnected' | 'waiting_scan' | 'authenticated' | 'auth_failed' | 'unreachable'
  phone: string | null
  connected_at: string | null
}

export interface WaQrResponse {
  qr: string
}

export interface WaMessageLog {
  id: number
  recipient_type: 'wali' | 'pegawai'
  recipient_id: string | null
  phone: string
  message_type: 'reminder' | 'tagihan_detail' | 'rekap_tunggakan' | 'pengumuman' | 'custom'
  message_body: string
  status: 'pending' | 'sent' | 'failed'
  error_reason: string | null
  retry_count: number
  sent_at: string | null
  created_at: string
  updated_at: string
  santri_names: string | null
}

export interface WaLogsResponse {
  data: WaMessageLog[]
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface BlastPengumumanPayload {
  judul: string
  isi: string
  target: 'wali' | 'pegawai' | 'all'
}

export interface BlastTagihanPayload {
  bulan: number
  tahun: number
}

export interface WaPhonebookEntry {
  id: string
  nis: string
  nama_santri: string
  kelas_nama: string | null
  nama_ayah: string | null
  hp_ayah: string | null
  nama_ibu: string | null
  hp_ibu: string | null
}

export interface WaPhonebookResponse {
  data: {
    data: WaPhonebookEntry[]
    current_page: number
    last_page: number
    total: number
    per_page: number
  }
  kelas_list: string[]
}

export interface PhonebookFilter {
  search: string
  kelas: string
  filter: '' | 'no_hp_ayah' | 'no_hp_ibu' | 'has_hp'
  page: number
  per_page: number
}

export interface UpdateHpPayload {
  hp_ayah?: string | null
  hp_ibu?: string | null
}

export interface WaBlastPreview {
  sample_message: string | null
  bulan_nama?: string
  recipient_count: number
  no_phone_count: number
  lunas_count: number
}

export interface WaSchedule {
  id: number
  type: 'tagihan_detail' | 'reminder' | 'rekap_tunggakan'
  tanggal_kirim: number[]
  jam: string
  enabled: boolean
  last_ran_date: string | null
}

export interface WaSchedulesResponse {
  tagihan_detail: WaSchedule
  reminder: WaSchedule
  rekap_tunggakan: WaSchedule
}

export interface WaTemplatePlaceholder {
  key: string
  desc: string
  required: boolean
}

export interface WaMessageTemplate {
  id: number
  type: 'tagihan_detail' | 'reminder' | 'rekap_tunggakan' | 'pengumuman'
  body: string
  placeholders: WaTemplatePlaceholder[]
  updated_by: string | null
  updated_at: string
}
