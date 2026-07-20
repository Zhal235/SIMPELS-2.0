import api from '../../../api/index'
import { listSantri } from '../../../api/santri'

type PaginatedSantriResult = {
  data?: any[]
  total?: number
  page?: number
  perPage?: number
  lastPage?: number
}

async function fetchAllSantri(filters: Record<string, any>) {
  const first = await listSantri(1, 100, filters)
  const firstData = Array.isArray(first?.data) ? first.data : []
  const totalPages = Math.max(1, Number(first?.lastPage || Math.ceil((Number(first?.total || firstData.length) || 0) / 100)))

  if (totalPages === 1) {
    return firstData
  }

  const pages = [firstData]
  for (let page = 2; page <= totalPages; page += 1) {
    const res: PaginatedSantriResult = await listSantri(page, 100, filters)
    pages.push(Array.isArray(res?.data) ? res.data : [])
  }

  return pages.flat()
}

async function fetchAllTagihan() {
  const first = await api.get('/v1/keuangan/tagihan-santri', { params: { page: 1, perPage: 100, include_detail: true } })
  const firstData = Array.isArray(first?.data?.data) ? first.data.data : []
  const totalPages = Math.max(1, Number(first?.data?.lastPage || Math.ceil((Number(first?.data?.total || firstData.length) || 0) / 100)))

  if (totalPages === 1) {
    return firstData
  }

  const pages = [firstData]
  for (let page = 2; page <= totalPages; page += 1) {
    const res = await api.get('/v1/keuangan/tagihan-santri', { params: { page, perPage: 100, include_detail: true } })
    pages.push(Array.isArray(res?.data?.data) ? res.data.data : [])
  }

  return pages.flat()
}

export async function fetchAllAlumniWithTagihan() {
  const [alumni, tagihan] = await Promise.all([
    fetchAllSantri({ status: 'alumni,lulus' }),
    fetchAllTagihan(),
  ])

  return { alumni, tagihan }
}