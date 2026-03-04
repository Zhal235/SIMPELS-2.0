import { useState, useEffect } from 'react'
import { getInstansiSetting, type InstansiSetting } from '../api/instansi'

let cache: InstansiSetting | null = null

export function useInstansiSetting() {
  const [setting, setSetting] = useState<InstansiSetting | null>(cache)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) return
    getInstansiSetting()
      .then(data => { cache = data; setSetting(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const refresh = async () => {
    cache = null
    setLoading(true)
    try {
      const data = await getInstansiSetting()
      cache = data
      setSetting(data)
    } finally {
      setLoading(false)
    }
  }

  return { setting, loading, refresh }
}
