// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, Clock, MapPin, X } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { EventListItem, EventDetail } from '../types/event'

// ===== Kiểu dữ liệu ghế & vé =====
type Seat = {
  seatId: number
  seatCode?: string | null
  rowNumber?: string | null
  status?: string | null
}

type SeatResponse = {
  areaId: number
  seatType?: string | null
  total: number
  seats: Seat[]
}

type Ticket = {
  categoryTicketId: number
  name: string
  price: number
  maxQuantity: number
  status: string
}

export default function Dashboard() {
  const { user } = useAuth()
  // Get token from localStorage instead of user object
  const token = localStorage.getItem('token')
  const [events, setEvents] = useState<EventListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal chi tiết sự kiện
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // Modal chọn ghế
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatError, setSeatError] = useState<string | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)

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

  // ===== Mở modal chi tiết + load chi tiết sự kiện =====
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

  // ===== Mở modal chọn ghế từ trong modal chi tiết =====
  const openSeatModal = async (ticket: Ticket) => {
    if (!selectedEvent) return

    // Chưa có areaId thì báo lỗi luôn
    if (!selectedEvent.areaId) {
      setSelectedTicket(ticket)
      setIsSeatModalOpen(true)
      setSeatError('Sự kiện chưa cấu hình khu vực (areaId).')
      return
    }

    setSelectedTicket(ticket)
    setIsSeatModalOpen(true)
    setLoadingSeats(true)
    setSeatError(null)
    setSelectedSeat(null)
    setSeats([])

    try {
      const params = new URLSearchParams({
        areaId: String(selectedEvent.areaId),
        eventId: String(selectedEvent.eventId),
      })

      const res = await fetch(`/api/seats?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        let msg = `Không thể tải danh sách ghế (HTTP ${res.status})`
        try {
          const data = await res.json()
          if (data && typeof data === 'object' && 'error' in data) {
            msg = (data as any).error || msg
          }
        } catch {
          // ignore
        }
        throw new Error(msg)
      }

      const data: SeatResponse = await res.json()
      setSeats(data.seats || [])
    } catch (err: any) {
      console.error('Lỗi load seats:', err)
      setSeatError(err?.message ?? 'Không thể tải danh sách ghế')
    } finally {
      setLoadingSeats(false)
    }
  }

  const closeSeatModal = () => {
    setIsSeatModalOpen(false)
    setSelectedTicket(null)
    setSeatError(null)
    setSelectedSeat(null)
  }

  const confirmSeat = () => {
    if (!selectedSeat || !selectedTicket || !selectedEvent) return
    console.log('✅ Chọn seat:', selectedSeat, 'ticket:', selectedTicket, 'event:', selectedEvent)
    // TODO: nối tiếp sang API thanh toán / giữ ghế
  }

  // ===== Tính sự kiện sắp tới =====
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

      {/* Modal chi tiết sự kiện */}
      {isDetailOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedEvent?.title ?? 'Chi tiết sự kiện'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {loadingDetail && (
                <p className="text-gray-500 text-center py-4">
                  Đang tải chi tiết...
                </p>
              )}

              {detailError && (
                <p className="text-red-500 text-center py-4">
                  Lỗi: {detailError}
                </p>
              )}

              {!loadingDetail && !detailError && selectedEvent && (
                <>
                  {/* Description */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>

                  {/* Event Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 mr-2 mt-0.5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Thời gian</p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedEvent.startTime),
                            'dd/MM/yyyy HH:mm',
                            { locale: vi }
                          )}
                        </p>
                        <p className="text-sm text-gray-600">đến</p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedEvent.endTime),
                            'dd/MM/yyyy HH:mm',
                            { locale: vi }
                          )}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.venueName && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Địa điểm</p>
                          <p className="font-medium">
                            {selectedEvent.venueName}
                          </p>

                          {selectedEvent.areaName && (
                            <p className="text-sm text-gray-700 mt-1">
                              Khu vực:{' '}
                              <span className="font-medium">
                                {selectedEvent.areaName}
                              </span>
                              {selectedEvent.floor && (
                                <span className="text-gray-600">
                                  {' '}
                                  (Tầng {selectedEvent.floor})
                                </span>
                              )}
                            </p>
                          )}

                          {selectedEvent.areaCapacity != null && (
                            <p className="text-xs text-gray-500 mt-1">
                              Sức chứa khu vực: {selectedEvent.areaCapacity} chỗ
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedEvent.location && (
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
                        <div>
                          <p className="text-sm text-gray-600">Vị trí</p>
                          <p className="font-medium">
                            {selectedEvent.location}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start">
                      <Users className="w-5 h-5 mr-2 mt-0.5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Số chỗ</p>
                        <p className="font-medium">
                          Tối đa {selectedEvent.maxSeats} người
                        </p>
                        {selectedEvent.currentParticipants != null && (
                          <p className="text-sm text-gray-600">
                            Đã đăng ký:{' '}
                            {selectedEvent.currentParticipants}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="w-5 h-5 mr-2 mt-0.5 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-600">Trạng thái</p>
                        <p className="font-medium">
                          {selectedEvent.status}
                        </p>
                      </div>
                    </div>

                    {selectedEvent.speakerName && (
                      <div className="flex items-start">
                        <span className="text-xl mr-2">👤</span>
                        <div>
                          <p className="text-sm text-gray-600">Diễn giả</p>
                          <p className="font-medium">
                            {selectedEvent.speakerName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tickets */}
                  {selectedEvent.tickets &&
                    selectedEvent.tickets.length > 0 && (
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Các loại vé
                        </h3>
                        <div className="space-y-3">
                          {selectedEvent.tickets.map((ticket) => (
                            <button
                              key={ticket.categoryTicketId}
                              type="button"
                              onClick={() =>
                                openSeatModal({
                                  categoryTicketId: ticket.categoryTicketId,
                                  name: ticket.name,
                                  price: ticket.price,
                                  maxQuantity: ticket.maxQuantity,
                                  status: ticket.status,
                                })
                              }
                              className="w-full flex items-center justify-between border rounded-lg px-4 py-3 hover:bg-gray-50 text-left"
                            >
                              <div>
                                <p className="font-medium">{ticket.name}</p>
                                <p className="text-sm text-gray-600">
                                  Số lượng tối đa: {ticket.maxQuantity} •
                                  Trạng thái: {ticket.status}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Nhấn để chọn ghế
                                </p>
                              </div>
                              <p className="font-semibold text-lg text-blue-600">
                                {ticket.price.toLocaleString('vi-VN')} đ
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Buttons – chỉ còn nút Đóng */}
                  <div className="border-t mt-6 pt-6 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn ghế */}
      {isSeatModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Chọn ghế – {selectedTicket.name}
              </h2>
              <button
                onClick={closeSeatModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Sự kiện:{' '}
              <span className="font-medium">{selectedEvent?.title}</span>
            </p>

            {loadingSeats && (
              <p className="text-gray-500 mb-3">
                Đang tải danh sách ghế...
              </p>
            )}

            {seatError && (
              <p className="text-red-500 mb-3">{seatError}</p>
            )}

            {!loadingSeats && !seatError && (
              <>
                {seats.length === 0 ? (
                  <p className="text-gray-600 mb-4">
                    Hiện không còn ghế trống trong khu vực này.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {seats.map((seat) => (
                      <button
                        key={seat.seatId}
                        type="button"
                        onClick={() => setSelectedSeat(seat)}
                        className={`border rounded-lg px-3 py-2 text-sm ${
                          selectedSeat?.seatId === seat.seatId
                            ? 'border-blue-600 bg-blue-50 font-semibold'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {seat.seatCode || seat.seatId}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={closeSeatModal}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={confirmSeat}
                disabled={!selectedSeat}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedSeat
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Xác nhận ghế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
