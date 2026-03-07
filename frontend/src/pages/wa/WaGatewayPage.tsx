import { useState } from 'react'
import { MessageCircle, BookUser, CalendarClock, FileText } from 'lucide-react'
import { useWaGateway } from '../../hooks/useWaGateway'
import { useWaBukuTelepon } from '../../hooks/useWaBukuTelepon'
import { useWaScheduler } from '../../hooks/useWaScheduler'
import { useWaTemplates } from '../../hooks/useWaTemplates'
import { WaStatusCard } from '../../components/wa/WaStatusCard'
import { WaMessageLogTable } from '../../components/wa/WaMessageLogTable'
import { WaSendBlastModal } from '../../components/wa/WaSendBlastModal'
import { WaBukuTeleponTable } from '../../components/wa/WaBukuTeleponTable'
import { WaScheduleCard } from '../../components/wa/WaScheduleCard'
import { WaTemplateEditor } from '../../components/wa/WaTemplateEditor'

type Tab = 'gateway' | 'buku-telepon' | 'scheduler' | 'template'

export default function WaGatewayPage() {
  const [activeTab, setActiveTab] = useState<Tab>('gateway')
  const [modalOpen, setModalOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const {
    gatewayStatus, qrDataUrl, logs, logsFilter, setLogsFilter,
    loadingStatus, loadingLogs, retryingId, error, refreshStatus, refreshLogs, handleRetry,
  } = useWaGateway()

  const { entries, kelasList, filter, pagination, loading, savingId, updateFilter, saveHp } = useWaBukuTelepon()
  const { schedules, loading: loadingSchedules, saving: savingSchedule, saveSchedule } = useWaScheduler()
  const { templates, loading: loadingTemplates, saving: savingTemplate, saveTemplate } = useWaTemplates()

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg)
    refreshLogs()
    setTimeout(() => setSuccessMsg(null), 5000)
  }

  const TABS = [
    { id: 'gateway' as Tab,      label: 'Gateway & Log',    icon: MessageCircle },
    { id: 'buku-telepon' as Tab, label: 'Buku Telepon',     icon: BookUser },
    { id: 'scheduler' as Tab,    label: 'Jadwal Otomatis',  icon: CalendarClock },
    { id: 'template' as Tab,     label: 'Template Pesan',   icon: FileText },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">WA Gateway</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola pengiriman pesan WhatsApp dari sistem</p>
        </div>
        {activeTab === 'gateway' && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          >
            <span>+</span> Kirim Blast Pesan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'gateway' && (
        <>
          {successMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              {successMsg}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <WaStatusCard
                status={gatewayStatus}
                qrDataUrl={qrDataUrl}
                loading={loadingStatus}
                onRefresh={refreshStatus}
              />
            </div>
            <div className="lg:col-span-2 rounded-xl border bg-white shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 text-base mb-3">Aksi Cepat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => setModalOpen(true)} className="flex flex-col items-start gap-1 p-4 border rounded-xl hover:bg-gray-50 text-left">
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-medium text-gray-700">Detail Tagihan</span>
                  <span className="text-xs text-gray-400">Kirim nominal tagihan per santri</span>
                </button>
                <button onClick={() => setModalOpen(true)} className="flex flex-col items-start gap-1 p-4 border rounded-xl hover:bg-gray-50 text-left">
                  <span className="text-lg">⏰</span>
                  <span className="text-sm font-medium text-gray-700">Reminder Tagihan</span>
                  <span className="text-xs text-gray-400">Ingatkan pembayaran jatuh tempo</span>
                </button>
                <button onClick={() => setModalOpen(true)} className="flex flex-col items-start gap-1 p-4 border rounded-xl hover:bg-gray-50 text-left">
                  <span className="text-lg">📢</span>
                  <span className="text-sm font-medium text-gray-700">Pengumuman</span>
                  <span className="text-xs text-gray-400">Kirim pengumuman ke wali/pegawai</span>
                </button>
              </div>
            </div>
          </div>

          <WaMessageLogTable
            logs={logs}
            loading={loadingLogs}
            retryingId={retryingId}
            filterStatus={logsFilter.status}
            onFilterChange={(status) => setLogsFilter({ status, page: 1 })}
            onPageChange={(page) => setLogsFilter((prev) => ({ ...prev, page }))}
            onRetry={handleRetry}
          />

          <WaSendBlastModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={handleSuccess}
          />
        </>
      )}

      {activeTab === 'buku-telepon' && (
        <WaBukuTeleponTable
          entries={entries}
          kelasList={kelasList}
          filter={filter}
          pagination={pagination}
          loading={loading}
          savingId={savingId}
          onFilterChange={updateFilter}
          onSave={saveHp}
        />
      )}

      {activeTab === 'scheduler' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
            Pesan akan dikirim otomatis setiap hari pukul yang dipilih, pada tanggal yang ditentukan. Hanya santri dengan tagihan belum lunas yang akan menerima pesan.
          </div>
          {loadingSchedules ? (
            <div className="text-center py-10 text-gray-400 text-sm">Memuat jadwal...</div>
          ) : schedules ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <WaScheduleCard
                schedule={schedules.tagihan_detail}
                label="Detail Tagihan"
                description="Rincian tagihan bulan berjalan (otomatis sertakan tunggakan)"
                saving={savingSchedule === 'tagihan_detail'}
                onSave={data => saveSchedule('tagihan_detail', data)}
              />
              <WaScheduleCard
                schedule={schedules.reminder}
                label="Reminder Tagihan"
                description="Ingatkan wali santri yang belum membayar bulan berjalan"
                saving={savingSchedule === 'reminder'}
                onSave={data => saveSchedule('reminder', data)}
              />
              <WaScheduleCard
                schedule={schedules.rekap_tunggakan}
                label="Rekap Tunggakan"
                description="Kirim rekap khusus santri yang menunggak dari bulan-bulan sebelumnya"
                saving={savingSchedule === 'rekap_tunggakan'}
                onSave={data => saveSchedule('rekap_tunggakan', data)}
              />
            </div>
          ) : null}
        </div>
      )}
      {activeTab === 'template' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-4 py-3 text-sm">
            Edit teks pesan bebas. Placeholder <code className="bg-amber-100 px-1 rounded font-mono text-xs">{'{{nama}}'}</code> yang bertanda <span className="text-red-500 font-medium">*wajib</span> tidak boleh dihapus agar pesan tetap valid.
          </div>
          <WaTemplateEditor
            templates={templates}
            loading={loadingTemplates}
            saving={savingTemplate}
            onSave={saveTemplate}
          />
        </div>
      )}
    </div>
  )
}
