import { PropsWithChildren } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ModalProps = PropsWithChildren<{ open: boolean; title?: string; onClose: () => void; footer?: React.ReactNode }>

export default function Modal({ open, title, children, onClose, footer }: ModalProps) {
  if (!open) return null
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg"
          >
            {title && <h3 className="mb-2 text-lg font-semibold">{title}</h3>}
            <div className="max-h-[75vh] overflow-y-auto px-2">{children}</div>
            <div className="mt-4 flex justify-end gap-2">
              {footer !== undefined ? footer : (
                <>
                  <button className="btn" onClick={onClose}>Tutup</button>
                  <button className="btn btn-primary" onClick={onClose}>Simpan</button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}