import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, MapPin, Users, ArrowLeft, Edit, Ticket } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useState } from 'react'

export default function EventDetail() {
  const { user } = useAuth()

  
  // TODO: Fetch event details and registrations from API
  const event: any = null
  const registrations: any[] = []
  
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [selectedSeat, setSelectedSeat] = useState<string>('')

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'
  const isRegistered = registrations.some((r: any) => r.userId === String(user?.id))
  const canRegister = event && event.status === 'Upcoming' && !isRegistered && event.currentParticipants < event.maxParticipants

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy sự kiện</p>
        <Link to="/events" className="text-blue-600 mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  const handleRegister = async () => {
    if (event.hasSeating && !selectedSeat) {
      alert('Vui lòng chọn ghế')
      return
    }
    // TODO: Replace with API call to register for event
    try {
      // const response = await fetch('/api/events/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ eventId: id, seatId: selectedSeat })
      // })
      // if (response.ok) {
      //   navigate('/my-tickets')
      // }
      alert('Vui lòng kết nối API để đăng ký sự kiện')
    } catch (error) {
      console.error('Error registering for event:', error)
      alert('Lỗi kết nối API')
    }
  }

  return (
    <div>
      <Link
        to="/events"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h1>
              <p className="text-gray-600">{event.description}</p>
            </div>
            {isOrganizer && (
              <Link
                to={`/events/${event.id}/edit`}
                className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit size={20} />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start">
              <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Thời gian</p>
                <p className="font-medium">
                  {format(new Date(event.startDate), 'dd/MM/yyyy HH:mm', { locale: vi })} -{' '}
                  {format(new Date(event.endDate), 'HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Địa điểm</p>
                <p className="font-medium">{event.location}</p>
              </div>
            </div>

            <div className="flex items-start">
              <Users className="w-5 h-5 text-gray-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Người tham gia</p>
                <p className="font-medium">
                  {event.currentParticipants}/{event.maxParticipants}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">Tổ chức bởi</p>
              <p className="font-medium">{event.organizer}</p>
              <span className="text-xs text-gray-500">({event.organizerType})</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {event.eventType}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
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

          {event.hasSeating && (
            <div className="mb-6">
              <Link
                to={`/seats/${event.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem sơ đồ ghế ngồi →
              </Link>
            </div>
          )}

          {canRegister && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
            >
              <Ticket className="w-5 h-5 mr-2" />
              Đăng ký tham gia
            </button>
          )}

          {isRegistered && (
            <Link
              to="/my-tickets"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Xem vé của tôi
            </Link>
          )}

          {!canRegister && !isRegistered && (
            <p className="text-gray-500">
              {event.currentParticipants >= event.maxParticipants
                ? 'Sự kiện đã đầy'
                : 'Không thể đăng ký sự kiện này'}
            </p>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Đăng ký tham gia</h2>
            {event.hasSeating && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ghế (nếu có)
                </label>
                <select
                  value={selectedSeat}
                  onChange={(e) => setSelectedSeat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Tự động chọn</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="A3">A3</option>
                </select>
              </div>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


