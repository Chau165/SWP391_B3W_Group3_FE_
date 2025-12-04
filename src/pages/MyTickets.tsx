import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Ticket, Calendar, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function MyTickets() {
  const { user } = useAuth()
  
  // Temporary - replace with API calls later
  const registrations: any[] = []

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Vé của tôi</h1>

      {registrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Bạn chưa có vé nào</p>
          <Link
            to="/events"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Xem các sự kiện sắp tới →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {registrations.map((registration: any) => {
            // Temporary - replace with API call
            const event: any = null
            if (!event) return null

            return (
              <div
                key={registration.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {format(new Date(event.startDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                        {registration.seatNumber && (
                          <div className="flex items-center">
                            <span className="font-medium">Ghế: {registration.seatNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {registration.checkedIn ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Trạng thái:</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        registration.checkedIn
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {registration.checkedIn ? 'Đã check-in' : 'Chưa check-in'}
                    </span>
                  </div>

                  <Link
                    to={`/tickets/${registration.id}`}
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Xem vé QR
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}


