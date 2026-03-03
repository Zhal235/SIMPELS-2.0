function getBackendOrigin(): string {
  try {
    const base = (import.meta as any)?.env?.VITE_API_BASE || (import.meta as any)?.env?.VITE_API_URL || ''
    if (base) {
      if (base.startsWith('/')) return window.location.origin
      const u = new URL(base)
      return u.origin
    }
  } catch {}
  return window.location.origin
}

export function getFotoSrc(foto: string | Blob | undefined): string | null {
  try {
    if (!foto) return null
    if (foto instanceof Blob) return URL.createObjectURL(foto)
    const s = String(foto || '')
    if (!s) return null
    if (/^data:/i.test(s)) return s
    const origin = getBackendOrigin()
    if (/^https?:\/\//i.test(s)) {
      try {
        const u = new URL(s)
        const o = new URL(origin)
        const isLocalHost = ['localhost', '127.0.0.1'].includes(u.hostname)
        if (isLocalHost && u.port && o.port && u.port !== o.port) {
          u.protocol = o.protocol
          u.hostname = o.hostname
          u.port = o.port
          return u.toString()
        }
      } catch {}
      return s
    }
    if (s.startsWith('/')) return origin + s
    if (s.startsWith('storage') || s.startsWith('uploads')) return `${origin}/${s}`
    return s
  } catch {
    return null
  }
}
