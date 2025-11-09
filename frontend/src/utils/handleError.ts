import { toast } from 'react-hot-toast'

export const handleError = (err: any) => {
  if (err && err.response) {
    const message = err.response?.data?.message || 'Terjadi kesalahan server'
    toast.error(message)
  } else {
    toast.error('Tidak dapat terhubung ke server')
  }
}