// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, Clock } from 'lucide-react'
import { format } from 'date-fns'
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
          throw new Error(`HTTP ${res.status}`)
        }

        const data: EventListItem[] = await res.json()
        setEvents(data)
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

  // ===== Calculate upcoming events =====
  const upcomingEvents = events
    .filter((e) => e.status === 'OPEN' || e.status === 'Upcoming')
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, 3)

  // ===== JSX =====
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Vai trò: <span className="font-medium">{user?.role}</span>
        </p>
      </div>

      {loading && <p className="text-gray-500 mb-4">Đang tải dữ liệu sự kiện...</p>}
      {error && <p className="text-red-500 mb-4">Lỗi: {error}</p>}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng sự kiện</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {events.length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sự kiện sắp tới</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {upcomingEvents.length}
              </p>
            </div>
            <Clock className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng số ghế tối đa</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {events.reduce((sum, e) => sum + e.maxSeats, 0)}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Sự kiện sắp tới</h2>
        </div>
        <div className="p-6">
          {upcomingEvents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Không có sự kiện sắp tới
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <button
                  key={event.eventId}
                  onClick={() => openEventDetail(event.eventId)}
                  className="w-full text-left block p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(event.startTime), 'dd/MM/yyyy HH:mm', {
                            locale: vi,
                          })}
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {event.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Link
              to="/events"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả sự kiện →
            </Link>
          </div>
        </div>
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

