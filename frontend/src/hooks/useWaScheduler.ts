import { useState, useEffect, useCallback } from 'react'
import { getWaSchedules, updateWaSchedule } from '../api/waGateway'
import type { WaSchedule, WaSchedulesResponse } from '../types/wa.types'
import { toast } from 'sonner'

export function useWaScheduler() {
  const [schedules, setSchedules] = useState<WaSchedulesResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getWaSchedules()
      setSchedules(res)
    } catch {
      toast.error('Gagal memuat jadwal pengiriman')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSchedules() }, [fetchSchedules])

  const saveSchedule = useCallback(async (type: 'tagihan_detail' | 'reminder' | 'rekap_tunggakan', data: Partial<WaSchedule>) => {
    setSaving(type)
    try {
      const res = await updateWaSchedule(type, data)
      setSchedules(prev => prev ? { ...prev, [type]: res.schedule } : prev)
      toast.success('Jadwal berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan jadwal')
    } finally {
      setSaving(null)
    }
  }, [])

  return { schedules, loading, saving, saveSchedule, fetchSchedules }
}
