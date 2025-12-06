// src/components/events/EventDetailModal.tsx
import { useState, useEffect } from 'react'
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
}

export function EventDetailModal({
  isOpen,
  onClose,
  event,
  loading,
  error,
  token,
}: EventDetailModalProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [vipSeats, setVipSeats] = useState<Seat[]>([])
  const [standardSeats, setStandardSeats] = useState<Seat[]>([])
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatsError, setSeatsError] = useState<string | null>(null)

  // Fetch seats when event detail loads
  useEffect(() => {
    const fetchSeats = async () => {
      if (!event || !event.areaId || !token) return

      setLoadingSeats(true)
      setSeatsError(null)

      try {
        // Fetch both VIP and STANDARD seats
        const [vipRes, standardRes] = await Promise.all([
          fetch(`/api/seats?areaId=${event.areaId}&eventId=${event.eventId}&seatType=VIP`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(`/api/seats?areaId=${event.areaId}&eventId=${event.eventId}&seatType=STANDARD`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (vipRes.ok) {
          const vipData = await vipRes.json()
          setVipSeats(vipData.seats || [])
        }

        if (standardRes.ok) {
          const standardData = await standardRes.json()
          setStandardSeats(standardData.seats || [])
        }
      } catch (err: any) {
        console.error('Error loading seats:', err)
        setSeatsError('Không thể tải danh sách ghế')
      } finally {
        setLoadingSeats(false)
      }
    }

    if (event && !loading) {
      fetchSeats()
    }
  }, [event, loading, token])

  const confirmSeat = () => {
    if (!selectedSeat || !selectedTicket || !event) return

    // TODO: Call API to reserve seat + create order
    // For now, redirect to payment page
    window.location.href = '/dashboard/payment'
  }

  const handleClose = () => {
    setSelectedTicket(null)
    setSelectedSeat(null)
    setVipSeats([])
    setStandardSeats([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Event Detail Modal */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
        onClick={onClose}
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
                    <h3 className="text-lg font-semibold mb-4">
                      Giá vé
                    </h3>
                    <div className="space-y-2">
                      {event.tickets.map((ticket) => {
                        const isVIP = ticket.name.toUpperCase().includes('VIP')
                        const availableSeats = isVIP ? vipSeats : standardSeats
                        const remainingQuantity = availableSeats.filter(
                          s => s.status === 'AVAILABLE' || s.status === 'ACTIVE'
                        ).length
                        
                        return (
                          <div
                            key={ticket.categoryTicketId}
                            className="flex items-center justify-between py-2"
                          >
                            <div>
                              <p className="font-medium">{ticket.name}</p>
                              <p className="text-sm text-gray-600">
                                Còn lại: {remainingQuantity}/{ticket.maxQuantity}
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
                    <h3 className="text-lg font-semibold mb-4">
                      Chọn ghế
                    </h3>
                    
                    {loadingSeats ? (
                      <p className="text-gray-500 text-center py-4">Đang tải ghế...</p>
                    ) : seatsError ? (
                      <p className="text-red-500 text-center py-4">{seatsError}</p>
                    ) : (
                      <SeatGrid
                        eventId={event.eventId}
                        areaId={event.areaId}
                        token={token}
                        selectedSeat={selectedSeat}
                        onSeatSelect={(seat) => {
                          setSelectedSeat(seat)
                          // Auto-select ticket based on seat type
                          const ticket = event.tickets?.find(t => {
                            const isVIPTicket = t.name.toUpperCase().includes('VIP')
                            const isVIPSeat = seat?.seatType === 'VIP'
                            return isVIPTicket === isVIPSeat
                          })
                          if (ticket) {
                            setSelectedTicket({
                              categoryTicketId: ticket.categoryTicketId,
                              name: ticket.name,
                              price: ticket.price,
                              maxQuantity: ticket.maxQuantity,
                              status: ticket.status,
                            })
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t mt-6 pt-6 flex justify-between items-center">
                  <div>
                    {selectedTicket && selectedSeat && (
                      <div className="text-left">
                        <p className="text-sm text-gray-600">Tổng tiền</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {selectedTicket.price.toLocaleString('vi-VN')} đ
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {selectedTicket.name} - Ghế {selectedSeat.seatCode}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Đóng
                    </button>
                    {selectedTicket && selectedSeat && (
                      <button
                        onClick={confirmSeat}
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
