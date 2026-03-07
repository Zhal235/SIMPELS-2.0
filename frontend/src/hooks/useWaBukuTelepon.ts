import { useState, useEffect, useCallback } from 'react'
import { getPhonebook, updateHpSantri } from '../api/waGateway'
import type { WaPhonebookEntry, PhonebookFilter } from '../types/wa.types'
import { toast } from 'sonner'

const DEFAULT_FILTER: PhonebookFilter = {
  search: '',
  kelas: '',
  filter: '',
  page: 1,
  per_page: 25,
}

export function useWaBukuTelepon() {
  const [entries, setEntries] = useState<WaPhonebookEntry[]>([])
  const [kelasList, setKelasList] = useState<string[]>([])
  const [filter, setFilter] = useState<PhonebookFilter>(DEFAULT_FILTER)
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchData = useCallback(async (f: PhonebookFilter) => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page: f.page, per_page: f.per_page }
      if (f.search) params.search = f.search
      if (f.kelas) params.kelas = f.kelas
      if (f.filter) params.filter = f.filter

      const res = await getPhonebook(params)
      setEntries(res.data.data)
      setKelasList(res.kelas_list)
      setPagination({
        currentPage: res.data.current_page,
        lastPage: res.data.last_page,
        total: res.data.total,
      })
    } catch {
      toast.error('Gagal memuat buku telepon')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(filter)
  }, [filter, fetchData])

  const updateFilter = useCallback((partial: Partial<PhonebookFilter>) => {
    setFilter(prev => ({ ...prev, ...partial, page: partial.page !== undefined ? partial.page : 1 }))
  }, [])

  const saveHp = useCallback(async (id: string, hp_ayah: string | null, hp_ibu: string | null) => {
    setSavingId(id)
    try {
      await updateHpSantri(id, { hp_ayah, hp_ibu })
      setEntries(prev =>
        prev.map(e => (e.id === id ? { ...e, hp_ayah, hp_ibu } : e))
      )
      toast.success('Nomor HP berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan nomor HP')
    } finally {
      setSavingId(null)
    }
  }, [])

  return { entries, kelasList, filter, pagination, loading, savingId, updateFilter, saveHp }
}
