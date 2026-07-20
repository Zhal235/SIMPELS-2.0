import { User, Home, Building2, Phone, Users, GraduationCap } from 'lucide-react'
import type { Santri } from '../../../types/pembayaran.types'
import { getFotoSrc } from '../../../utils/fotoUrl'
import { getNamaOrtuString, getNoHpString } from '../../../utils/pembayaranHelpers'

interface Props {
  santri: Santri
}

const AVATAR_FALLBACK = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E'

const EXIT_STATUSES = ['mutasi', 'mutasi_keluar', 'keluar', 'alumni', 'lulus']

function isAlumniSantri(santri: Santri) {
  return ['alumni', 'lulus'].includes(String(santri.status || '').trim().toLowerCase())
}

function getExitBadgeLabel(santri: Santri) {
  if (isAlumniSantri(santri)) {
    const tahunLulus = santri.tahun_lulus ? String(santri.tahun_lulus) : ''
    return tahunLulus ? `Alumni Angkatan ${tahunLulus}` : 'Alumni'
  }

  return santri.mutasi_keterangan?.trim() || 'Mutasi Keluar'
}

function isExitSantri(santri: Santri) {
  return EXIT_STATUSES.includes(String(santri.status || '').trim().toLowerCase())
}

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
  const exitSantri = isExitSantri(santri)
  const alumniSantri = isAlumniSantri(santri)
  const kelasDisplay = santri.kelas || santri.kelas_nama || 'N/A'
  const asramaDisplay = santri.asrama || santri.asrama_nama || 'N/A'

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-start gap-6">
        <img
          src={getFotoSrc(santri.foto) ?? AVATAR_FALLBACK}
          alt={santri.nama_santri}
          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200 bg-gray-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = AVATAR_FALLBACK }}
        />
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {santri.nama_santri}
            </span>
            {exitSantri && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${alumniSantri ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                <GraduationCap className="h-4 w-4" />
                {getExitBadgeLabel(santri)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <InfoRow icon={User} label="Nama Santri" value={santri.nama_santri} />
              {exitSantri ? (
                <InfoRow icon={GraduationCap} label={alumniSantri ? 'Angkatan Alumni' : 'Keterangan Mutasi'} value={getExitBadgeLabel(santri)} />
              ) : (
                <>
                  <InfoRow icon={Building2} label="Kelas" value={kelasDisplay} />
                  <InfoRow icon={Home} label="Asrama" value={asramaDisplay} />
                </>
              )}
            </div>
            <div>
              <InfoRow icon={Users} label="Nama Orang Tua" value={getNamaOrtuString(santri)} />
              <InfoRow icon={Phone} label="No. HP" value={getNoHpString(santri)} />
              <InfoRow icon={Home} label="Alamat" value={santri.alamat || 'N/A'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
