import api from './index'

export interface Department {
  id: number
  nama: string
  kode: string
  deskripsi?: string
  created_at: string
  updated_at: string
}

export interface Jabatan {
  id: number
  nama: string
  kode: string
  level: number
  department_id: number | null
  parent_id?: number
  deskripsi?: string
  created_at: string
  updated_at: string
  department?: Department
  parent?: Jabatan
  children?: Jabatan[]
}

// Department API functions
export const getDepartments = async (params?: any) => {
  const response = await api.get('/v1/kepegawaian/departments', { params })
  return response.data
}

export const createDepartment = async (data: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post('/v1/kepegawaian/departments', data)
  return response.data
}

export const updateDepartment = async (id: number, data: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.put(`/v1/kepegawaian/departments/${id}`, data)
  return response.data
}

export const deleteDepartment = async (id: number) => {
  const response = await api.delete(`/v1/kepegawaian/departments/${id}`)
  return response.data
}

// Jabatan API functions  
export const getJabatan = async (params?: any) => {
  const response = await api.get('/v1/kepegawaian/jabatan', { params })
  return response.data
}

export const createJabatan = async (data: Omit<Jabatan, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.post('/v1/kepegawaian/jabatan', data)
  return response.data
}

export const updateJabatan = async (id: number, data: Omit<Jabatan, 'id' | 'created_at' | 'updated_at'>) => {
  const response = await api.put(`/v1/kepegawaian/jabatan/${id}`, data)
  return response.data
}

export const deleteJabatan = async (id: number) => {
  const response = await api.delete(`/v1/kepegawaian/jabatan/${id}`)
  return response.data
}