import type { Santri, OrangTua } from '../types/pembayaran.types'

export function formatRupiah(nominal: number | undefined | null): string {
  const value = Number(nominal) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function getCurrentWIBForBackend(): string {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const y = wib.getUTCFullYear()
  const mo = String(wib.getUTCMonth() + 1).padStart(2, '0')
  const d = String(wib.getUTCDate()).padStart(2, '0')
  const h = String(wib.getUTCHours()).padStart(2, '0')
  const mi = String(wib.getUTCMinutes()).padStart(2, '0')
  const s = String(wib.getUTCSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d} ${h}:${mi}:${s}`
}

export function isOverdue(tglJatuhTempo?: string, bulan?: string, tahun?: string | number): boolean {
  if (!tglJatuhTempo || !bulan || !tahun) return false
  try {
    const dayMatch = tglJatuhTempo.match(/\d+/)
    if (!dayMatch) return false
    const day = parseInt(dayMatch[0])
    const bulanMap: Record<string, number> = {
      Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
      Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
    }
    let bulanAngka = parseInt(bulan)
    if (isNaN(bulanAngka)) bulanAngka = bulanMap[bulan] || 1
    const year = parseInt(String(tahun))
    const dueDate = new Date(year, bulanAngka - 1, day)
    dueDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today > dueDate
  } catch {
    return false
  }
}

export function getNamaOrtuString(santri: Santri): string {
  const ayah = santri.orang_tua?.nama_ayah || santri.nama_ayah || ''
  const ibu = santri.orang_tua?.nama_ibu || santri.nama_ibu || ''
  if (ayah && ibu) return `${ayah} / ${ibu}`
  return ayah || ibu || 'N/A'
}

export function getNoHpString(santri: Santri): string {
  const pick = (...cands: Array<string | undefined | null>) => {
    for (const c of cands) if (typeof c === 'string' && c.trim() !== '') return c.trim()
    return ''
  }
  const hpAyah = pick(
    santri.orang_tua?.hp_ayah, (santri as any).hp_ayah, (santri as any).no_hp_ayah,
    santri.orang_tua?.no_hp_ayah, santri.orang_tua?.no_hp, (santri as any).no_hp,
  )
  const hpIbu = pick(
    santri.orang_tua?.hp_ibu, (santri as any).hp_ibu, (santri as any).no_hp_ibu,
    santri.orang_tua?.no_hp_ibu,
  )
  if (hpAyah && hpIbu) return `${hpAyah} / ${hpIbu}`
  return hpAyah || hpIbu || 'N/A'
}
