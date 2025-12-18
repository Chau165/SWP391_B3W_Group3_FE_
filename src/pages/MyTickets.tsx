import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
import {
  Ticket as TicketIcon,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  LogOut,
  Clock,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Kiểu dữ liệu: khớp với BE + thêm vài field dự phòng
type MyTicket = {
  ticketId?: number
  id?: number

  eventId?: number
  eventName?: string         // BE đang dùng
  eventTitle?: string
  title?: string

  bannerUrl?: string | null
  imageUrl?: string | null

  eventStartTime?: string
  startTime?: string         // BE đang dùng
  startDate?: string

  venueName?: string | null  // BE đang dùng
  location?: string | null

  seatCode?: string | null
  seatNumber?: string | null

  ticketStatus?: string
  status?: string

  ticketCode?: string | null // QR base64 từ BE

  checkedIn?: boolean
  checkInTime?: string | null // BE đang dùng
  checkinTime?: string | null
  checkOutTime?: string | null // Thời gian check-out
  checkoutTime?: string | null
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<MyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ticket đang mở popup QR
  const [qrTicket, setQrTicket] = useState<MyTicket | null>(null)

  useEffect(() => {
    const fetchTickets = async () => {
      const jwt = localStorage.getItem('token')
      if (!jwt) {
        setError('Bạn cần đăng nhập để xem vé của mình.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch('/api/registrations/my-tickets', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          credentials: 'include',
        })

        if (!res.ok) {
          if (res.status === 401) {
            setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
          } else {
            setError('Không thể tải danh sách vé. Vui lòng thử lại sau.')
          }
          setTickets([])
          return
        }

        const data: MyTicket[] = await res.json()
        console.log('My tickets from API:', data)
        setTickets(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error loading tickets:', err)
        setError('Có lỗi xảy ra khi tải danh sách vé.')
        setTickets([])
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // ===== Helpers map field =====
  const getEventTitle = (t: MyTicket) =>
    t.eventName || t.eventTitle || t.title || 'Sự kiện không tên'

  const getStartTime = (t: MyTicket) =>
    t.eventStartTime || t.startTime || t.startDate || ''

  const getLocation = (t: MyTicket) =>
    t.venueName || t.location || 'Đang cập nhật địa điểm'

  const getSeatLabel = (t: MyTicket) =>
    t.seatCode || t.seatNumber || ''

  const getImageUrl = (t: MyTicket) =>
    t.bannerUrl || t.imageUrl || ''

  const isCheckedIn = (t: MyTicket) =>
    !!(t.checkedIn || t.checkInTime || t.checkinTime)

  const isCheckedOut = (t: MyTicket) =>
    !!(t.checkOutTime || t.checkoutTime)

  const getStatus = (t: MyTicket) => {
    const rawStatus = t.ticketStatus || t.status
    if (rawStatus) return rawStatus
    if (isCheckedOut(t)) return 'CHECKED_OUT'
    if (isCheckedIn(t)) return 'CHECKED_IN'
    return 'BOOKED'
  }

  const getCheckInTime = (t: MyTicket) => t.checkInTime || t.checkinTime || null
  const getCheckOutTime = (t: MyTicket) => t.checkOutTime || t.checkoutTime || null

  const formatTime = (time: string | null) => {
    if (!time) return null
    const d = new Date(time)
    if (isNaN(d.getTime())) return null
    return format(d, 'dd/MM/yyyy HH:mm:ss', { locale: vi })
  }

  // 👇 Mã vé hiển thị cho Organizer (dùng ticketId / id)
  const getTicketDisplayCode = (t: MyTicket) =>
    t.ticketId ?? t.id ?? null

  // ===== UI =====
  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vé của tôi</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
          Đang tải danh sách vé...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Vé của tôi</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link
            to="/events"
            className="inline-block text-blue-600 hover:text-blue-700"
          >
            Xem các sự kiện sắp tới →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Vé của tôi</h1>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <TicketIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Bạn chưa có vé nào</p>
          <Link
            to="/events"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Xem các sự kiện sắp tới →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((t) => {
              const id = t.ticketId ?? t.id
              if (!id) return null

              const title = getEventTitle(t)
              const start = getStartTime(t)
              const location = getLocation(t)
              const seat = getSeatLabel(t)
              const imageUrl = getImageUrl(t)
              const checkedIn = isCheckedIn(t)
              const status = getStatus(t)

              let startText = 'Đang cập nhật thời gian'
              if (start) {
                const d = new Date(start)
                if (!isNaN(d.getTime())) {
                  startText = format(d, 'dd/MM/yyyy HH:mm', { locale: vi })
                }
              }

              return (
                <div
                  key={id}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {startText}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {location}
                          </div>
                          {seat && (
                            <div className="flex items-center">
                              <span className="font-medium">Ghế: {seat}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {status === 'EXPIRED' ? (
                        <XCircle className="w-6 h-6 text-red-500" />
                      ) : status === 'CHECKED_OUT' ? (
                        <LogOut className="w-6 h-6 text-purple-500" />
                      ) : checkedIn ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Trạng thái:</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          status === 'EXPIRED'
                            ? 'bg-red-100 text-red-800'
                            : status === 'CHECKED_OUT'
                            ? 'bg-purple-100 text-purple-800'
                            : status === 'CHECKED_IN'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {status === 'EXPIRED'
                          ? 'Hết hạn'
                          : status === 'CHECKED_OUT'
                          ? 'Đã check-out'
                          : status === 'CHECKED_IN'
                          ? 'Đã check-in'
                          : 'Chưa check-in'}
                      </span>

                      {/* Hiển thị thời gian check-in nếu đang ở trạng thái CHECKED_IN */}
                      {status === 'CHECKED_IN' && getCheckInTime(t) && (
                        <div className="flex items-center text-sm text-gray-600 mt-2">
                          <Clock className="w-4 h-4 mr-1 text-green-500" />
                          <span>Lúc: {formatTime(getCheckInTime(t))}</span>
                        </div>
                      )}

                      {/* Hiển thị thời gian check-out nếu đang ở trạng thái CHECKED_OUT */}
                      {status === 'CHECKED_OUT' && getCheckOutTime(t) && (
                        <div className="flex items-center text-sm text-gray-600 mt-2">
                          <Clock className="w-4 h-4 mr-1 text-purple-500" />
                          <span>Lúc: {formatTime(getCheckOutTime(t))}</span>
                        </div>
                      )}
                    </div>

                    {/* Nút xem QR: chỉ mở popup, không chuyển trang */}
                    <button
                      type="button"
                      onClick={() => setQrTicket(t)}
                      className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Xem vé QR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* POPUP QR CODE */}
          {qrTicket && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
                <h2 className="text-xl font-semibold mb-2">Mã QR vé</h2>
                <p className="text-sm text-gray-600 mb-1">
                  {getEventTitle(qrTicket)}
                </p>

                {/* MÃ VÉ CHO ORGANIZER GÕ */}
                {getTicketDisplayCode(qrTicket) && (
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    Mã vé:&nbsp;
                    <span className="text-blue-600">
                      {getTicketDisplayCode(qrTicket)}
                    </span>
                  </p>
                )}

                {qrTicket.ticketCode ? (
                  <img
                    src={`data:image/png;base64,${qrTicket.ticketCode}`}
                    alt="QR Code"
                    className="mx-auto w-48 h-48 mb-4"
                  />
                ) : (
                  <p className="text-red-500 text-sm mb-4">
                    Vé này chưa có mã QR. Vui lòng thử lại sau.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setQrTicket(null)}
                  className="mt-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
