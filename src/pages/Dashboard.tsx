// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar } from 'lucide-react'
import { format, isSameDay, startOfDay, startOfWeek, endOfWeek } from 'date-fns'
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

  // ===== Phân loại sự kiện theo ngày bắt đầu (SINGLE PASS) =====
  const today = startOfDay(new Date())
  const thisWeekMonday = startOfWeek(today, { weekStartsOn: 1 })
  const thisWeekSunday = endOfWeek(today, { weekStartsOn: 1 })

  const categorizeEvents = (eventsList: EventListItem[]) => {
    const categorized = {
      today: [] as EventListItem[],
      thisWeek: [] as EventListItem[],
      upcoming: [] as EventListItem[],
    }

    // Single pass through all events
    eventsList.forEach((event) => {
      if (event.status !== 'OPEN') return

      const eventDate = startOfDay(new Date(event.startTime))

      // Only show events that are today or in the future
      if (eventDate < today) return

      if (isSameDay(eventDate, today)) {
        categorized.today.push(event)
      } else if (eventDate >= today && eventDate <= thisWeekSunday) {
        categorized.thisWeek.push(event)
      } else if (eventDate > thisWeekSunday) {
        categorized.upcoming.push(event)
      }
    })

    // Sort each category once
    Object.values(categorized).forEach((arr) =>
      arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    )

    return categorized
  }

  const { today: openEvents, thisWeek: thisWeekEvents, upcoming: upcomingEventsFiltered } = categorizeEvents(
    Array.isArray(events) ? events : [],
  )

  // ===== JSX =====
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          Sự kiện sắp tới
        </h1>
      </div>

      {loading && <p className="text-gray-500 mb-4">Đang tải dữ liệu sự kiện...</p>}
      {error && <p className="text-red-500 mb-4">Lỗi: {error}</p>}

      {/* Sự kiện hôm nay */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
           Sự kiện hôm nay ({format(today, 'dd/MM', { locale: vi })})
        </h2>
        {openEvents.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500 text-lg">Hôm nay không có sự kiện nào</p>
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
                    className={`text-left block rounded-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer bg-white ${
                      isToday 
                        ? 'border-4 border-red-500 shadow-2xl shadow-red-500/50 transform scale-105' 
                        : 'border border-gray-200'
                    }`}
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
                          <span className="absolute top-3 right-3 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg animate-pulse">
                            🔥 HÔM NAY
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative">
                        <Calendar className="w-16 h-16 text-blue-400" />
                        {isToday && (
                          <span className="absolute top-3 right-3 px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg shadow-lg animate-pulse">
                            🔥 HÔM NAY
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      {/* Title */}
                      <h3 className={`text-lg font-bold mb-2 line-clamp-2 min-h-[56px] ${
                        isToday ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {event.title}
                      </h3>

                      {/* Date & Time */}
                      <p className={`text-sm mb-1 font-semibold ${
                        isToday ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {format(eventDate, 'dd/MM/yyyy • EEEE • h:mm a', { locale: vi })}
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
          )
        }
      </div>

      {/* Sự kiện tuần này */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
           Sự kiện tuần này ({format(thisWeekMonday, 'dd/MM', { locale: vi })} - {format(thisWeekSunday, 'dd/MM', { locale: vi })})
        </h2>
        {thisWeekEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Tuần này không có sự kiện sắp tới nào</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {thisWeekEvents.map((event) => {
                const eventDate = new Date(event.startTime)

                return (
                  <button
                    key={event.eventId}
                    onClick={() => openEventDetail(event.eventId)}
                    className="text-left block rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer bg-white border border-gray-200"
                  >
                    {/* Banner Image */}
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-blue-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1 font-semibold">
                        {format(eventDate, 'dd/MM/yyyy • EEEE • h:mm a', { locale: vi })}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {event.venueLocation || event.location || 'Trực tuyến'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Sự kiện sắp diễn ra */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
           Đăng ký sớm cho sự kiện sắp tới
        </h2>
        {upcomingEventsFiltered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">Hiện chưa có sự kiện đã lên lịch</p>
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEventsFiltered.map((event) => {
                const eventDate = new Date(event.startTime)

                return (
                  <button
                    key={event.eventId}
                    onClick={() => openEventDetail(event.eventId)}
                    className="text-left block rounded-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer bg-white border border-gray-200"
                  >
                    {/* Banner Image */}
                    {event.bannerUrl ? (
                      <img
                        src={event.bannerUrl}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-purple-400" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[56px]">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1 font-semibold">
                        {format(eventDate, 'dd/MM/yyyy • EEEE • h:mm a', { locale: vi })}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {event.venueLocation || event.location || 'Trực tuyến'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )
        }
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/dashboard/events"
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
