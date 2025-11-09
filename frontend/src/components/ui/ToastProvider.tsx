import React, { createContext, useContext, useRef, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'info'
export type ToastItem = {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastContextType = {
  toasts: ToastItem[]
  showToast: (t: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Record<string, number>>({})

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timers.current[id]
    }
  }

  const showToast = (t: Omit<ToastItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const item: ToastItem = { id, title: t.title, description: t.description, variant: t.variant ?? 'info' }
    setToasts((prev) => [item, ...prev])
    timers.current[id] = window.setTimeout(() => dismiss(id), 3500)
    return id
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismiss }}>
      {children}
      {/* Toast container */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-96 max-w-full flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onPause={() => {
            const timer = timers.current[t.id]
            if (timer) { window.clearTimeout(timer); delete timers.current[t.id] }
          }} onResume={() => {
            if (!timers.current[t.id]) { timers.current[t.id] = window.setTimeout(() => dismiss(t.id), 1500) }
          }} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onPause, onResume, onClose }: { toast: ToastItem, onPause: () => void, onResume: () => void, onClose: () => void }) {
  const color = toast.variant === 'success' ? 'border-green-500' : toast.variant === 'error' ? 'border-red-500' : 'border-blue-500'
  const bg = toast.variant === 'success' ? 'bg-green-50' : toast.variant === 'error' ? 'bg-red-50' : 'bg-blue-50'
  return (
    <div
      className={`pointer-events-auto ${bg} rounded-md shadow-md border-l-4 ${color} p-3`} onMouseEnter={onPause} onMouseLeave={onResume}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-800">{toast.title}</div>
          {toast.description && <div className="text-sm text-gray-700">{toast.description}</div>}
        </div>
        <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  )
}

export function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}