type Props = { kasNama: string; onConfirm: () => void; onCancel: () => void }

export default function ModalDeleteBukuKas({ kasNama, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
        <div className="p-6 border-b">
          <h3 className="font-bold text-gray-900 text-lg">Hapus Buku Kas</h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-medium">Anda yakin ingin menghapus?</p>
              <p className="text-gray-600 text-sm mt-1">Buku kas <strong>"{kasNama}"</strong> akan dihapus secara permanen.</p>
            </div>
          </div>
        </div>
        <div className="p-6 border-t flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Hapus</button>
        </div>
      </div>
    </div>
  )
}
