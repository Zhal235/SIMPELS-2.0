import React from 'react'

type ColumnBuilderParams = {
  onPreview: (row: any) => void
  onDelete: (id: number) => void
}

export function buildCollectivePaymentHistoryColumns({ onPreview, onDelete }: ColumnBuilderParams) {
  return [
    { key: 'title', header: 'Nama Tagihan', render: (v: any) => <div className="font-medium">{v}</div> },
    {
      key: 'created_at',
      header: 'Tanggal',
      render: (v: any) => <div className="text-sm">{new Date(v).toLocaleDateString('id-ID')}</div>,
    },
    {
      key: 'total_santri',
      header: 'Total Santri',
      render: (v: any) => <div className="text-center font-semibold">{v}</div>,
    },
    {
      key: 'paid_count',
      header: 'Sukses',
      render: (v: any) => <div className="text-center text-green-600 font-semibold">✅ {v}</div>,
    },
    {
      key: 'pending_count',
      header: 'Pending',
      render: (v: any) => <div className="text-center text-yellow-600 font-semibold">⏳ {v}</div>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v: any) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            v === 'completed'
              ? 'bg-green-100 text-green-700'
              : v === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {v === 'completed' ? 'Selesai' : v === 'cancelled' ? 'Dibatalkan' : 'Aktif'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (v: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button onClick={() => onPreview(row)} className="btn btn-sm btn-primary">
            Preview
          </button>
          {row.status === 'cancelled' && (
            <button onClick={() => onDelete(row.id)} className="btn btn-sm btn-danger">
              Hapus
            </button>
          )}
        </div>
      ),
    },
  ]
}
