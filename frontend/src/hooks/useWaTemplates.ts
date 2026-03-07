import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getWaTemplates, updateWaTemplate } from '../api/waGateway'
import type { WaMessageTemplate } from '../types/wa.types'

export function useWaTemplates() {
  const [templates, setTemplates] = useState<WaMessageTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      setTemplates(await getWaTemplates())
    } catch {
      toast.error('Gagal memuat template pesan')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const saveTemplate = useCallback(async (type: string, body: string) => {
    setSaving(type)
    try {
      const updated = await updateWaTemplate(type, body)
      setTemplates(prev => prev.map(t => t.type === type ? updated : t))
      toast.success('Template berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan template')
    } finally {
      setSaving(null)
    }
  }, [])

  return { templates, loading, saving, saveTemplate }
}
