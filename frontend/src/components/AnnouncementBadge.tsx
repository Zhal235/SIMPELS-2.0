import { useState, useEffect } from 'react'
import { useAnnouncementPolling } from '../utils/useAnnouncementPolling'
import { getAnnouncements, markAsRead, type Announcement } from '../api/announcements'
import { toast } from 'sonner'

export default function AnnouncementBadge() {
  const { unreadCount, refresh } = useAnnouncementPolling(60000) // Poll every 60 seconds
  const [showModal, setShowModal] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const response = await getAnnouncements({ limit: 50 })
      if (response.success) {
        setAnnouncements(response.data)
      }
    } catch (error: any) {
      toast.error('Gagal memuat pengumuman')
    } finally {
      setLoading(false)
    }
  }

  const handleAnnouncementClick = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    
    // Mark as read jika belum dibaca
    if (!announcement.is_read) {
      try {
        await markAsRead(announcement.id)
        // Update local state
        setAnnouncements(prev => 
          prev.map(a => a.id === announcement.id ? { ...a, is_read: true } : a)
        )
        // Refresh badge count
        refresh()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }

  const handleOpenModal = () => {
    setShowModal(true)
    fetchAnnouncements()
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '🔴'
      case 'important':
        return '🟠'
      default:
        return '🔵'
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Mendesak',
      important: 'Penting',
      normal: 'Normal',
    }
    return labels[priority as keyof typeof labels] || 'Normal'
  }

  return (
    <>
      {/* Badge Button */}
      <button
        onClick={handleOpenModal}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="Pengumuman"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Pengumuman</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedAnnouncement(null)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* List */}
              <div className="w-1/3 border-r overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Memuat...</div>
                ) : announcements.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">Belum ada pengumuman</div>
                ) : (
                  <div className="divide-y">
                    {announcements.map((announcement) => (
                      <button
                        key={announcement.id}
                        onClick={() => handleAnnouncementClick(announcement)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          selectedAnnouncement?.id === announcement.id ? 'bg-blue-50' : ''
                        } ${!announcement.is_read ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg mt-0.5">{getPriorityIcon(announcement.priority)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-medium truncate ${!announcement.is_read ? 'font-bold' : ''}`}>
                                {announcement.title}
                              </h3>
                              {!announcement.is_read && (
                                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(announcement.created_at).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedAnnouncement ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{getPriorityIcon(selectedAnnouncement.priority)}</span>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">{selectedAnnouncement.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {getPriorityLabel(selectedAnnouncement.priority)}
                          </span>
                          <span>{new Date(selectedAnnouncement.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}</span>
                          {selectedAnnouncement.created_by && (
                            <span>• Oleh: {selectedAnnouncement.created_by}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="prose max-w-none">
                        <p className="whitespace-pre-wrap text-gray-700">{selectedAnnouncement.content}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Pilih pengumuman untuk melihat detail
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
