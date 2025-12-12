// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar } from 'lucide-react'
import { format, isSameDay, startOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { EventListItem, EventDetail } from '../types/event'
import { EventDetailModal } from '../components/events/EventDetailModal'

export default function Dashboard() {
  const { user } = useAuth()
  // Get token from localStorage instead of user object
  const token = localStorage.getItem('token')
  const [events, setEvents] = useState<EventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 3 tab: đang mở / sắp mở / đã kết thúc
  const [activeTab, setActiveTab] = useState<'open' | 'upcoming' | 'closed'>('open')

  // Event detail modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // ===== Lấy danh sách sự kiện =====
  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) {
        setError('Chưa đăng nhập')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/events', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Token không hợp lệ hoặc đã hết hạn')
          }
          if (res.status === 404) {
            // Hiển thị thông báo cụ thể khi BE trả về 404
            setError('Sự kiện này chưa diễn ra hoặc đã đóng. Xin bạn thử lại sau.')
            setEvents([])
            setLoading(false)
            return
          }
          throw new Error(`HTTP ${res.status}`)
        }

        const data = await res.json()
        // Handle API response structure: { closedEvents: [], openEvents: [] }
        const eventsArray = Array.isArray(data)
          ? data
          : [
              ...(Array.isArray(data.openEvents) ? data.openEvents : []),
              ...(Array.isArray(data.closedEvents) ? data.closedEvents : []),
            ]
        setEvents(eventsArray)
      } catch (err: any) {
        console.error('Lỗi load events:', err)
        setError(err.message ?? 'Không thể tải danh sách sự kiện')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [token])

  // ===== Open event detail modal and fetch event details =====
  const openEventDetail = async (eventId: number) => {
    if (!token) return

    setIsDetailOpen(true)
    setSelectedEvent(null)
    setLoadingDetail(true)
    setDetailError(null)

    try {
      const res = await fetch(`/api/events/detail?id=${eventId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Token không hợp lệ hoặc đã hết hạn')
        }
        if (res.status === 404) {
          // Hiển thị thông báo cụ thể khi BE trả về 404
          setDetailError('Sự kiện này chưa diễn ra hoặc đã đóng. Xin bạn thử lại sau.')
          setSelectedEvent(null)
          setLoadingDetail(false)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }

      const data: EventDetail = await res.json()
      setSelectedEvent(data)
    } catch (err: any) {
      console.error('Lỗi load event detail:', err)
      setDetailError(err.message ?? 'Không thể tải chi tiết sự kiện')
    } finally {
      setLoadingDetail(false)
    }
  }

  const closeModal = () => {
    setIsDetailOpen(false)
    setSelectedEvent(null)
    setDetailError(null)
  }

  // ===== Phân loại sự kiện theo trạng thái =====
  const today = startOfDay(new Date())

  // Sự kiện đang mở: status = OPEN
  const openEvents = (Array.isArray(events) ? events : [])
    .filter((e) => e.status === 'OPEN')
    .sort((a, b) => {
      const dateA = new Date(a.startTime)
      const dateB = new Date(b.startTime)
      return dateA.getTime() - dateB.getTime() // gần nhất lên trước
    })

  // Sự kiện sắp mở: status = CLOSED & bannerUrl = null
  const upcomingEvents = (Array.isArray(events) ? events : [])
    .filter((e) => e.status === 'CLOSED' && !e.bannerUrl)
    .sort((a, b) => {
      const dateA = new Date(a.startTime)
      const dateB = new Date(b.startTime)
      return dateA.getTime() - dateB.getTime()
    })

  // Sự kiện đã kết thúc: status = CLOSED & bannerUrl != null
  const closedEvents = (Array.isArray(events) ? events : [])
    .filter((e) => e.status === 'CLOSED' && !!e.bannerUrl)
    .sort((a, b) => {
      const dateA = new Date(a.startTime)
      const dateB = new Date(b.startTime)
      return dateB.getTime() - dateA.getTime() // sự kiện mới kết thúc lên trước
    })

  // ===== JSX =====
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Sự kiện tại Thành phố Hồ Chí Minh
        </h1>
      </div>

      {loading && <p className="text-gray-500 mb-4">Đang tải dữ liệu sự kiện...</p>}
      {error && <p className="text-red-500 mb-4">Lỗi: {error}</p>}

      {/* Tab Panel */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {/* Tab 1: Sự kiện đang mở */}
            <button
              onClick={() => setActiveTab('open')}
              className={`py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'open'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-start">
                <span>Sự kiện đang mở</span>
                <span className="text-xs text-gray-400">
                  (Có thể mua vé – đang nhận đăng ký)
                </span>
              </div>
            </button>

            {/* Tab 2: Sự kiện sắp mở */}
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-start">
                <span>Sự kiện sắp mở</span>
                <span className="text-xs text-gray-400">
                  (Chưa bán vé – chờ cập nhật thông tin)
                </span>
              </div>
            </button>

            {/* Tab 3: Sự kiện đã kết thúc */}
            <button
              onClick={() => setActiveTab('closed')}
              className={`py-4 px-1 border-b-2 font-medium text-base transition-colors ${
                activeTab === 'closed'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-start">
                <span>Sự kiện đã kết thúc</span>
                <span className="text-xs text-gray-400">
                  (Không còn hiệu lực)
                </span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Events Grid */}
      {activeTab === 'open' && (
        <>
          {openEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Hiện chưa có sự kiện đang mở</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {openEvents.map((event) => {
                const eventDate = new Date(event.startTime)
                const isToday = isSameDay(eventDate, today)

                return (
                  <button
                    key={event.eventId}
                    onClick={() => openEventDetail(event.eventId)}
                    className="text-left block rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer bg-white border border-gray-200"
                  >
                    {/* Banner Image */}
                    {event.bannerUrl ? (
                      <div className="relative">
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                        {isToday && (
                          <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            HÔM NAY
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                        <Calendar className="w-16 h-16 text-blue-400" />
                        {isToday && (
                          <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded">
                            HÔM NAY
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                        {event.title}
                      </h3>

                      {/* Date & Time */}
                      <p className="text-sm text-gray-600 mb-1">
                        {format(eventDate, 'EEEE • h:mm a', { locale: vi })}
                      </p>

                      {/* Location */}
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {event.venueLocation || event.location || 'Trực tuyến'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'upcoming' && (
        <>
          {upcomingEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Hiện chưa có sự kiện sắp mở</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => {
                const eventDate = new Date(event.startTime)
                const isToday = isSameDay(eventDate, today)

                return (
                  <button
                    key={event.eventId}
                    onClick={() => openEventDetail(event.eventId)}
                    className="text-left block rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer bg-white border border-gray-200"
                  >
                    {/* Banner Image */}
                    {event.bannerUrl ? (
                      <div className="relative">
                        <img
                          src={event.bannerUrl}
                          alt={event.title}
                          className="w-full h-48 object-cover"
                        />
                        {isToday && (
                          <span className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                            SẮP MỞ
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center relative">
                        <Calendar className="w-16 h-16 text-yellow-400" />
                        {isToday && (
                          <span className="absolute top-3 right-3 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded">
                            SẮP MỞ
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        {format(eventDate, 'EEEE • h:mm a', { locale: vi })}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {event.venueLocation || event.location || 'Trực tuyến'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'closed' && (
        <>
          {closedEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Chưa có sự kiện đã kết thúc</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {closedEvents.map((event) => (
                <button
                  key={event.eventId}
                  onClick={() => openEventDetail(event.eventId)}
                  className="text-left block rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer bg-white border border-gray-200 opacity-75"
                >
                  {/* Banner Image */}
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Calendar className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded mb-3">
                      Đã kết thúc
                    </span>

                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                      {event.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-1">
                      {format(new Date(event.startTime), 'EEEE • h:mm a', { locale: vi })}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-1">
                      {event.venueLocation || event.location || 'Trực tuyến'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <Link
          to="/events"
          className="inline-block text-orange-600 hover:text-orange-700 font-medium"
        >
          Xem tất cả sự kiện →
        </Link>
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={closeModal}
        event={selectedEvent}
        loading={loadingDetail}
        error={detailError}
        token={token}
      />
    </div>
  )
}
