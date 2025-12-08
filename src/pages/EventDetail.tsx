// src/pages/EventDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Users, MapPin, Clock, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { EventDetail } from '../types/event'
import { SeatGrid, type Seat } from '../components/common/SeatGrid'

type Ticket = {
  categoryTicketId: number
  name: string
  price: number
  maxQuantity: number
  status: string
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const token = localStorage.getItem('token')
  useAuth()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  // Seat selection modal state
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('Không có mã sự kiện trên đường dẫn')
      setLoading(false)
      return
    }

    const fetchDetail = async () => {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)

        const res = await fetch(`/api/events/detail?id=${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (res.status === 404) {
          setEvent(null)
          setNotFound(true)
          return
        }

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại')
          }

          let msg = `Lỗi khi tải chi tiết sự kiện (HTTP ${res.status})`
          try {
            const data = await res.json()
            if (data && typeof data === 'object' && 'message' in data) {
              msg = (data as any).message || msg
            }
          } catch {}

          throw new Error(msg)
        }

        const data: EventDetail = await res.json()
        setEvent(data)
      } catch (err: any) {
        console.error('Lỗi load event detail:', err)
        setError(err?.message ?? 'Không thể tải chi tiết sự kiện')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [id])

  const openSeatModal = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsSeatModalOpen(true)
    setSelectedSeat(null)
    
    // Fetch seats when modal opens
    if (event?.areaId && event?.eventId) {
      setLoadingSeats(true)
      try {
        const res = await fetch(
          `/api/seats?areaId=${event.areaId}&eventId=${event.eventId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        
        if (res.ok) {
          const data = await res.json()
          const seatsArray = data.seats || []
          const sortedSeats = seatsArray.sort((a: any, b: any) => (a.seatId || 0) - (b.seatId || 0))
          setAllSeats(sortedSeats)
        }
      } catch (err) {
        console.error('Error fetching seats:', err)
      } finally {
        setLoadingSeats(false)
      }
    }
  }

  const closeSeatModal = () => {
    setIsSeatModalOpen(false)
    setSelectedTicket(null)
    setSelectedSeat(null)
  }

  const confirmSeat = () => {
    if (!selectedSeat || !selectedTicket || !event) return

    // TODO: Call API to reserve seat + create order
    // For now, redirect to payment page
    window.location.href = '/dashboard/payment'
  }

  // ===== UI: Loading =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải chi tiết sự kiện...</p>
        </div>
      </div>
    )
  }

  // ===== UI: Error =====
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
          <p className="text-red-600 font-medium mb-2">Có lỗi xảy ra</p>
          <p className="text-red-500">{error}</p>
        </div>
        <Link
          to="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách sự kiện
        </Link>
      </div>
    )
  }

  // ===== UI: Not found =====
  if (notFound || !event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
          <p className="text-yellow-800 font-medium">
            Không tìm thấy sự kiện hoặc sự kiện không còn khả dụng.
          </p>
        </div>
        <Link
          to="/events"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách sự kiện
        </Link>
      </div>
    )
  }

  // ===== UI chính =====
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/events"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">
          {event.title}
        </h1>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Mô tả</h3>
          <p className="text-gray-700 leading-relaxed">{event.description}</p>
        </div>

        {/* Event Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
          {/* Thời gian */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Thời gian</p>
              <p className="font-medium text-gray-900">
                {format(new Date(event.startTime), 'dd/MM/yyyy HH:mm', {
                  locale: vi,
                })}
              </p>
              <p className="text-sm text-gray-500 my-1">đến</p>
              <p className="font-medium text-gray-900">
                {format(new Date(event.endTime), 'dd/MM/yyyy HH:mm', {
                  locale: vi,
                })}
              </p>
            </div>
          </div>

          {/* Địa điểm + khu vực */}
          {event.venueName && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Địa điểm</p>
                <p className="font-medium text-gray-900">{event.venueName}</p>

                {event.areaName && (
                  <p className="text-sm text-gray-700 mt-1">
                    Khu vực:{' '}
                    <span className="font-medium">{event.areaName}</span>
                    {event.floor && (
                      <span className="text-gray-600"> (Tầng {event.floor})</span>
                    )}
                  </p>
                )}

                {event.areaCapacity != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sức chứa khu vực: {event.areaCapacity} chỗ
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Vị trí chi tiết (location) */}
          {event.location && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Vị trí</p>
                <p className="font-medium text-gray-900">{event.location}</p>
              </div>
            </div>
          )}

          {/* Số chỗ */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Số chỗ</p>
              <p className="font-medium text-gray-900">
                Tối đa {event.maxSeats} người
              </p>
              {event.currentParticipants != null && (
                <p className="text-sm text-gray-600 mt-1">
                  Đã đăng ký:{' '}
                  <span className="font-medium">
                    {event.currentParticipants}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Trạng thái */}
          <div className="flex items-start">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === 'OPEN'
                    ? 'bg-green-100 text-green-800'
                    : event.status === 'CLOSED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {event.status}
              </span>
            </div>
          </div>

          {/* Diễn giả */}
          {event.speakerName && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Diễn giả</p>
                <p className="font-medium text-gray-900">
                  {event.speakerName}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tickets Section */}
      {event.tickets && event.tickets.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Các loại vé
          </h2>
          <div className="space-y-4">
            {event.tickets.map((ticket) => (
              <button
                key={ticket.categoryTicketId}
                type="button"
                onClick={() => openSeatModal(ticket as Ticket)}
                className="w-full flex items-center justify-between border-2 border-gray-200 rounded-lg px-6 py-4 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
              >
                <div className="flex-1">
                  <p className="font-semibold text-lg text-gray-900">
                    {ticket.name}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Số lượng: {ticket.maxQuantity}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'AVAILABLE' || ticket.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Nhấn để chọn ghế
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-2xl text-blue-600">
                    {ticket.price.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Seat Selection Modal */}
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
              Sự kiện: <span className="font-medium">{event.title}</span>
            </p>

            {event && event.areaId ? (
              <SeatGrid
                seats={allSeats}
                loading={loadingSeats}
                selectedSeat={selectedSeat}
                onSeatSelect={setSelectedSeat}
              />
            ) : (
              <p className="text-red-500 mb-3">
                Sự kiện chưa cấu hình khu vực (areaId).
              </p>
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

