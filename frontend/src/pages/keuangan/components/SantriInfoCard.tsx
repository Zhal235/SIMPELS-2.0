import { User, Home, Building2, Phone, Users } from 'lucide-react'
import type { Santri } from '../../../types/pembayaran.types'
import { getFotoSrc } from '../../../utils/fotoUrl'
import { getNamaOrtuString, getNoHpString } from '../../../utils/pembayaranHelpers'

interface Props {
  santri: Santri
}

const AVATAR_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900 text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function SantriInfoCard({ santri }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start gap-6">
        <img
          src={getFotoSrc(santri.foto) ?? AVATAR_FALLBACK}
          alt={santri.nama_santri}
          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 bg-gray-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK }}
        />
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <InfoRow icon={User} label="Nama Santri" value={santri.nama_santri} />
            <InfoRow icon={Building2} label="Kelas" value={santri.kelas || 'N/A'} />
            <InfoRow icon={Home} label="Asrama" value={santri.asrama || 'N/A'} />
          </div>
          <div>
            <InfoRow icon={Users} label="Nama Orang Tua" value={getNamaOrtuString(santri)} />
            <InfoRow icon={Phone} label="No. HP" value={getNoHpString(santri)} />
            <InfoRow icon={Home} label="Alamat" value={santri.alamat || 'N/A'} />
          </div>
        </div>
      </div>
    </div>
  )
}
