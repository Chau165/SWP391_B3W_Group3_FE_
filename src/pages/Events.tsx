import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, MapPin, Users, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function Events() {
  const { user } = useAuth()
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'

  // Temporary empty array - replace with API call later
  const events: any[] = []

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Danh sách sự kiện</h1>
        {isOrganizer && (
          <Link
            to="/events/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tạo sự kiện mới
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">Chưa có sự kiện nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {event.imageUrl && (
              <img
                src={event.imageUrl}
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
                      to={`/events/${event.id}/edit`}
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
                  {format(new Date(event.startDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  {event.currentParticipants}/{event.maxParticipants} người đã đăng ký
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {event.eventType}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    event.status === 'Upcoming'
                      ? 'bg-green-100 text-green-800'
                      : event.status === 'Ongoing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {event.status === 'Upcoming'
                    ? 'Sắp diễn ra'
                    : event.status === 'Ongoing'
                    ? 'Đang diễn ra'
                    : event.status}
                </span>
              </div>

              <Link
                to={`/events/${event.id}`}
                className="mt-4 block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  )
}



