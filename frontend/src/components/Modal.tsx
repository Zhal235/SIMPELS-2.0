import { PropsWithChildren } from 'react'

type ModalProps = PropsWithChildren<{ open: boolean; title?: string; onClose: () => void }>

export default function Modal({ open, title, children, onClose }: ModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
        <div>{children}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>Tutup</button>
          <button className="btn btn-primary" onClick={onClose}>Simpan</button>
        </div>
      </div>
    </div>
  )
}