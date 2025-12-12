// src/components/events/EventDetailModal.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Users, Clock, MapPin, X } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import type { EventDetail } from '../../types/event'
import { SeatGrid, type Seat } from '../common/SeatGrid'

type Ticket = {
  categoryTicketId: number
  name: string
  price: number
  maxQuantity: number
  status: string
}

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: EventDetail | null
  loading: boolean
  error: string | null
  token: string | null
  userRole?: string
  onEdit?: () => void
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  loading,
  error,
  token,
  userRole,
  onEdit,
}: EventDetailModalProps) {
  const navigate = useNavigate()

  // 1 loại vé đang chọn (VIP / STANDARD / ...)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  // Nhiều ghế đã chọn
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [allSeats, setAllSeats] = useState<Seat[]>([])
  const [vipTotal, setVipTotal] = useState<number>(0)
  const [standardTotal, setStandardTotal] = useState<number>(0)
  const [loadingSeats, setLoadingSeats] = useState(false)

  // ===== HELPER: check trạng thái ghế =====
  const isSeatAvailableForSelect = (seat: Seat) => {
    // BE đang trả về status = 'AVAILABLE' | 'BOOKED' | 'CHECKED_IN' | 'PENDING'
    // => chỉ cho click khi là AVAILABLE
    return seat.status === 'AVAILABLE'
  }

  const isSeatAvailableForCount = (seat: Seat, isVIP: boolean) => {
    const seatIsVIP = seat.seatType === 'VIP'
    // chỉ tính ghế AVAILABLE là còn lại
    return seatIsVIP === isVIP && seat.status === 'AVAILABLE'
  }

  // ========== LOAD SEAT LAYOUT ==========
  useEffect(() => {
    const fetchSeats = async () => {
      if (!event || !event.areaId || !token) return

      setLoadingSeats(true)

      try {
        // Tất cả seat theo event (để vẽ grid)
        const seatsRes = await fetch(
          `http://localhost:3000/api/seats?areaId=${event.areaId}&eventId=${event.eventId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (seatsRes.ok) {
          const seatsData = await seatsRes.json()
          console.log('All seats data:', seatsData)
          setAllSeats(seatsData.seats || [])
        }

        // Tổng VIP / STANDARD
        const [vipRes, standardRes] = await Promise.all([
          fetch(
            `http://localhost:3000/api/seats?areaId=${event.areaId}&eventId=${event.eventId}&seatType=VIP`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          ),
          fetch(
            `http://localhost:3000/api/seats?areaId=${event.areaId}&eventId=${event.eventId}&seatType=STANDARD`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            },
          ),
        ])

        if (vipRes.ok) {
          const vipData = await vipRes.json()
          console.log('VIP total:', vipData.total)
          setVipTotal(vipData.total || 0)
        }

        if (standardRes.ok) {
          const standardData = await standardRes.json()
          console.log('STANDARD total:', standardData.total)
          setStandardTotal(standardData.total || 0)
        }
      } catch (err: any) {
        console.error('Error loading seats:', err)
      } finally {
        setLoadingSeats(false)
      }
    }

    if (event && !loading) {
      fetchSeats()
    }
  }, [event, loading, token])

  // ========== HANDLE CHỌN LOẠI VÉ ==========
  const handleSelectTicket = (ticket: Ticket) => {
    // Giữ nguyên ghế đã chọn khi đổi loại vé
    setSelectedTicket(ticket)
  }

  // ========== HANDLE CHỌN / BỎ CHỌN GHẾ ==========
  const handleSeatSelect = (seat: Seat) => {
    if (!event) return

    // ❌ Không cho chọn ghế đang BOOKED / CHECKED_IN / PENDING
    if (!isSeatAvailableForSelect(seat)) {
      if (seat.status === 'PENDING') {
        alert(
          `Ghế ${seat.seatCode} đang được giữ chỗ trong quá trình thanh toán. Vui lòng chọn ghế khác.`,
        )
      }
      return
    }

    // ✅ Cho phép chọn tự do - tự động map ticket theo seat type
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.seatId === seat.seatId)
      if (exists) {
        // Bỏ chọn nếu đã được chọn
        return prev.filter((s) => s.seatId !== seat.seatId)
      }
      
      // ❌ Giới hạn tối đa 4 ghế - không hiển thị thông báo, chỉ ngăn chọn
      if (prev.length >= 4) {
        return prev
      }
      
      // Thêm mới
      return [...prev, seat]
    })
  }

  // ========== CONFIRM & ĐI TỚI TRANG PAYMENT ==========
  const confirmSeats = () => {
    if (!event || selectedSeats.length === 0) return

    // Tính tổng tiền dựa trên seat type (VIP/STANDARD)
    let totalAmount = 0
    const vipTicket = event.tickets?.find((t) => t.name.toUpperCase().includes('VIP'))
    const standardTicket = event.tickets?.find((t) => !t.name.toUpperCase().includes('VIP'))

    // Đếm số lượng từng loại ghế
    let vipCount = 0
    let standardCount = 0

    selectedSeats.forEach((seat) => {
      if (seat.seatType === 'VIP' && vipTicket) {
        totalAmount += vipTicket.price
        vipCount++
      } else if (seat.seatType === 'STANDARD' && standardTicket) {
        totalAmount += standardTicket.price
        standardCount++
      }
    })

    // Nếu người dùng đã chọn ticket thủ công, ưu tiên dùng ticket đó
    const ticketToUse = selectedTicket || 
      (selectedSeats[0]?.seatType === 'VIP' ? vipTicket : standardTicket)

    if (!ticketToUse) {
      alert('Không tìm thấy loại vé phù hợp')
      return
    }

    const seatIds = selectedSeats.map((s) => s.seatId)
    const seatCodes = selectedSeats.map((s) => s.seatCode)

    // Tạo ticket breakdown cho hiển thị
    const ticketBreakdown = []
    if (vipCount > 0 && vipTicket) {
      ticketBreakdown.push({ name: vipTicket.name, count: vipCount, price: vipTicket.price })
    }
    if (standardCount > 0 && standardTicket) {
      ticketBreakdown.push({ name: standardTicket.name, count: standardCount, price: standardTicket.price })
    }

    navigate('/dashboard/payment', {
      state: {
        eventId: event.eventId,
        categoryTicketId: ticketToUse.categoryTicketId,
        seatIds,
        eventTitle: event.title,
        ticketName: ticketToUse.name,
        ticketBreakdown, // Thêm thông tin chi tiết về các loại vé
        seatCodes,
        pricePerTicket: ticketToUse.price,
        quantity: selectedSeats.length,
        totalAmount,
      },
    })
  }

  const handleClose = () => {
    setSelectedTicket(null)
    setSelectedSeats([])
    setAllSeats([])
    setVipTotal(0)
    setStandardTotal(0)
    onClose()
  }

  if (!isOpen) return null

  // Tính tổng tiền hiển thị ở footer - dựa trên seat type
  let totalAmount = 0
  if (event && selectedSeats.length > 0) {
    const vipTicket = event.tickets?.find((t) => t.name.toUpperCase().includes('VIP'))
    const standardTicket = event.tickets?.find((t) => !t.name.toUpperCase().includes('VIP'))

    selectedSeats.forEach((seat) => {
      if (seat.seatType === 'VIP' && vipTicket) {
        totalAmount += vipTicket.price
      } else if (seat.seatType === 'STANDARD' && standardTicket) {
        totalAmount += standardTicket.price
      }
    })
  }

  const selectedSeatCodesText =
    selectedSeats.length > 0
      ? selectedSeats.map((s) => s.seatCode).join(', ')
      : ''

  return (
    <>
      {/* Event Detail Modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {event?.title ?? 'Chi tiết sự kiện'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading && (
              <p className="text-gray-500 text-center py-4">
                Đang tải chi tiết...
              </p>
            )}

            {error && (
              <p className="text-red-500 text-center py-4">Lỗi: {error}</p>
            )}

            {!loading && !error && event && (
              <>
                {/* Banner Image */}
                {event.bannerUrl && (
                  <div className="mb-6">
                    <img
                      src={event.bannerUrl}
                      alt={event.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
                  <p className="text-gray-700">{event.description}</p>
                </div>

                {/* Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 mr-2 mt-0.5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Thời gian</p>
                      <p className="font-medium">
                        {format(new Date(event.startTime), 'dd/MM/yyyy HH:mm', {
                          locale: vi,
                        })}
                      </p>
                      <p className="text-sm text-gray-600">đến</p>
                      <p className="font-medium">
                        {format(new Date(event.endTime), 'dd/MM/yyyy HH:mm', {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  </div>

                  {event.venueName && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Địa điểm</p>
                        <p className="font-medium">{event.venueName}</p>

                        {event.areaName && (
                          <p className="text-sm text-gray-700 mt-1">
                            Khu vực:{' '}
                            <span className="font-medium">{event.areaName}</span>
                            {event.floor && (
                              <span className="text-gray-600">
                                {' '}
                                (Tầng {event.floor})
                              </span>
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

                  {event.location && (
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 mr-2 mt-0.5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Vị trí</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <Users className="w-5 h-5 mr-2 mt-0.5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Số chỗ</p>
                      <p className="font-medium">
                        Tối đa {event.maxSeats} người
                      </p>
                      {event.currentParticipants != null && (
                        <p className="text-sm text-gray-600">
                          Đã đăng ký: {event.currentParticipants}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="w-5 h-5 mr-2 mt-0.5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Trạng thái</p>
                      <p className="font-medium">{event.status}</p>
                    </div>
                  </div>

                  {event.speakerName && (
                    <div className="flex items-start">
                      <span className="text-xl mr-2">👤</span>
                      <div>
                        <p className="text-sm text-gray-600">Diễn giả</p>
                        <p className="font-medium">{event.speakerName}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tickets Info */}
                {event.tickets && event.tickets.length > 0 && (
                  <div className="border-t pt-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Giá vé</h3>
                    <div className="space-y-2">
                      {event.tickets.map((ticket) => {
                        const isVIP = ticket.name.toUpperCase().includes('VIP')
                        const total = isVIP ? vipTotal : standardTotal

                        // chỉ tính ghế AVAILABLE là còn lại
                        const availableCount = allSeats.filter((s: Seat) =>
                          isSeatAvailableForCount(s, isVIP),
                        ).length

                        const isSelectedTicket =
                          selectedTicket?.categoryTicketId ===
                          ticket.categoryTicketId

                        return (
                          <div
                            key={ticket.categoryTicketId}
                            onClick={() =>
                              handleSelectTicket({
                                categoryTicketId: ticket.categoryTicketId,
                                name: ticket.name,
                                price: ticket.price,
                                maxQuantity: ticket.maxQuantity,
                                status: ticket.status,
                              })
                            }
                            className={`flex items-center justify-between py-2 px-3 rounded-lg border cursor-pointer transition
                              ${
                                isSelectedTicket
                                  ? 'border-blue-600 bg-blue-50'
                                  : 'border-transparent hover:bg-gray-50'
                              }`}
                          >
                            <div>
                              <p className="font-medium">{ticket.name}</p>
                              <p className="text-sm text-gray-600">
                                Còn lại: {availableCount}/{total}
                              </p>
                            </div>
                            <p className="font-semibold text-lg text-gray-900">
                              {ticket.price.toLocaleString('vi-VN')} đ
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* All Seats Display */}
                {event.areaId && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Chọn ghế</h3>

                    <SeatGrid
                      seats={allSeats}
                      loading={loadingSeats}
                      selectedSeats={selectedSeats}
                      onSeatSelect={(seat) => seat && handleSeatSelect(seat)}
                      maxReached={selectedSeats.length >= 4}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t mt-6 pt-6 flex justify-between items-center">
                  <div>
                    {selectedSeats.length > 0 && (
                      <div className="text-left">
                        <p className="text-sm text-gray-600">Tổng tiền</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {totalAmount.toLocaleString('vi-VN')} đ
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Ghế: {selectedSeatCodesText || 'Chưa chọn'}
                          {' · '}Số lượng: {selectedSeats.length}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {userRole === 'ORGANIZER' &&
                      event.status === 'APPROVED' &&
                      onEdit && (
                        <button
                          onClick={onEdit}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Cập nhật thông tin
                        </button>
                      )}
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
                    {selectedSeats.length > 0 && (
                      <button
                        onClick={confirmSeats}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Xác nhận đặt ghế
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
