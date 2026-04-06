import api from './index'
import type {
  WaGatewayStatus,
  WaQrResponse,
  WaLogsResponse,
  BlastPengumumanPayload,
  BlastTagihanPayload,
  WaPhonebookResponse,
  UpdateHpPayload,
  WaBlastPreview,
  WaSchedulesResponse,
  WaSchedule,
  WaMessageTemplate,
} from '../types/wa.types'

export const getWaStatus = async (): Promise<WaGatewayStatus> => {
  try {
    const res = await api.get('/v1/admin/wa/status')
    if (!res.data) {
      throw new Error('Response data kosong dari server')
    }
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Endpoint WA Gateway tidak ditemukan')
    }
    if (error.response?.status === 503) {
      throw new Error('WA Gateway sedang tidak dapat diakses')
    }
    throw error
  }
}

export const getWaQr = async (): Promise<WaQrResponse> => {
  try {
    const res = await api.get('/v1/admin/wa/qr')
    if (!res.data) {
      throw new Error('QR code tidak tersedia')
    }
    return res.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('QR code tidak ditemukan. Pastikan WA Gateway sudah terhubung')
    }
    throw error
  }
}

export const getWaLogs = async (params?: {
  status?: string
  message_type?: string
  page?: number
}): Promise<WaLogsResponse> => {
  try {
    const res = await api.get('/v1/admin/wa/logs', { params })
    if (!res.data || !res.data.data) {
      throw new Error('Format response tidak sesuai ekspektasi')
    }
    return res.data
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('Anda tidak memiliki akses untuk melihat log WA')
    }
    if (error.response?.status === 500) {
      throw new Error('Terjadi kesalahan pada server saat memuat log')
    }
    throw error
  }
}

export const retryWaLog = async (id: number): Promise<void> => {
  try {
    if (!id || typeof id !== 'number') {
      throw new Error('ID log tidak valid')
    }
    await api.post(`/v1/admin/wa/logs/${id}/retry`)
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Log pesan tidak ditemukan')
    }
    if (error.response?.status === 422) {
      throw new Error('Hanya pesan yang gagal yang dapat di-retry')
    }
    throw error
  }
}

export const blastPengumuman = async (payload: BlastPengumumanPayload): Promise<{ message: string }> => {
  const res = await api.post('/v1/admin/wa/blast/pengumuman', payload)
  return res.data
}

export const blastTagihanDetail = async (payload: BlastTagihanPayload): Promise<{ message: string }> => {
  const res = await api.post('/v1/admin/wa/blast/tagihan-detail', payload)
  return res.data
}

export const blastReminder = async (payload: BlastTagihanPayload): Promise<{ message: string }> => {
  const res = await api.post('/v1/admin/wa/blast/reminder', payload)
  return res.data
}

export const blastRekapTunggakan = async (payload: BlastTagihanPayload): Promise<{ message: string }> => {
  const res = await api.post('/v1/admin/wa/blast/rekap-tunggakan', payload)
  return res.data
}

export const getPhonebook = async (params?: Record<string, any>): Promise<WaPhonebookResponse> => {
  const res = await api.get('/v1/admin/wa/phonebook', { params })
  return res.data
}

export const updateHpSantri = async (id: string, payload: UpdateHpPayload): Promise<{ message: string }> => {
  const res = await api.patch(`/v1/admin/wa/phonebook/${id}`, payload)
  return res.data
}

export const previewBlast = async (payload: Record<string, any>): Promise<WaBlastPreview> => {
  const res = await api.post('/v1/admin/wa/preview', payload)
  return res.data
}

export const getWaSchedules = async (): Promise<WaSchedulesResponse> => {
  const res = await api.get('/v1/admin/wa/schedules')
  return res.data
}

export const updateWaSchedule = async (type: string, payload: Partial<WaSchedule>): Promise<{ message: string; schedule: WaSchedule }> => {
  const res = await api.put(`/v1/admin/wa/schedules/${type}`, payload)
  return res.data
}

export const getWaTemplates = async (): Promise<WaMessageTemplate[]> => {
  const res = await api.get('/v1/admin/wa/templates')
  return res.data
}

export const updateWaTemplate = async (type: string, body: string): Promise<WaMessageTemplate> => {
  const res = await api.put(`/v1/admin/wa/templates/${type}`, { body })
  return res.data
}

export const sendTestWa = async (phone: string, message: string): Promise<{ message: string }> => {
  const res = await api.post('/v1/admin/wa/send-test', { phone, message })
  return res.data
}
