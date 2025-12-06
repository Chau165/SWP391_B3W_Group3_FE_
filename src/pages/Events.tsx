import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, MapPin, Users, Edit, Trash2, List, CalendarDays } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState, useEffect } from 'react'
import { EventCalendar } from '../components/events/EventCalendar'
import { EventDetailModal } from '../components/events/EventDetailModal'
import type { EventListItem, EventDetail } from '../types/event'

type ViewMode = 'list' | 'calendar'

export default function Events() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [events, setEvents] = useState<EventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/events', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        throw new Error('Failed to fetch events')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const fetchEventDetail = async (eventId: number) => {
    setLoadingDetail(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/events/detail?id=${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedEvent(data)
        setIsModalOpen(true)
      } else {
        throw new Error('Failed to fetch event details')
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleEventClick = (event: EventListItem) => {
    fetchEventDetail(event.eventId)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEvent(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Danh sách sự kiện</h1>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Lịch
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Danh sách
            </button>
          </div>

          {isOrganizer && (
            <Link
              to="/dashboard/events/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tạo sự kiện mới
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <>
          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <EventCalendar 
              events={events} 
              onEventClick={handleEventClick}
            />
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{events.map((event) => (
          <div key={event.eventId} className="bg-white rounded-lg shadow-md overflow-hidden">
            {event.bannerUrl && (
              <img
                src={event.bannerUrl}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900 flex-1">
                  {event.title}
                </h3>
                {isOrganizer && (
                  <div className="flex space-x-2 ml-2">
                    <Link
                      to={`/dashboard/events/${event.eventId}/edit`}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Chỉnh sửa"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {format(new Date(event.startTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location || 'Chưa xác định'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {event.maxSeats} chỗ
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'OPEN'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'CLOSED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.status === 'OPEN' ? 'Đang mở' : event.status === 'CLOSED' ? 'Đã đóng' : event.status}
                </span>
              </div>

              <button
                onClick={() => handleEventClick(event)}
                className="w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
          ))}
        </div>
          )}
        </>
      )}

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={selectedEvent}
        loading={loadingDetail}
        error={null}
        token={localStorage.getItem('token')}
      />
    </div>
  )
}


