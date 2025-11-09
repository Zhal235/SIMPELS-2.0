import React from 'react'

export default function SantriPreview({ santri }: { santri: any }) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p><b>Nama:</b> {santri.nama}</p>
        <p><b>NIS:</b> {santri.nis}</p>
        <p><b>NISN:</b> {santri.nisn}</p>
        <p><b>Jenis Kelamin:</b> {santri.jenis_kelamin}</p>
        <p><b>Alamat:</b> {santri.alamat}</p>
      </div>
      <div className="flex justify-end items-start">
        <img
          src={santri.foto_url || '/placeholder.png'}
          alt="Foto Santri"
          className="w-40 h-40 object-cover rounded-xl border shadow"
        />
      </div>
    </div>
  )
}