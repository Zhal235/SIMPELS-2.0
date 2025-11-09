import { useToastContext } from './ToastProvider'

export type ShowToastParams = {
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

export function useToast() {
  const { showToast, dismiss } = useToastContext()
  return { showToast, dismiss }
}