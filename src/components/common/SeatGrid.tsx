// src/components/common/SeatGrid.tsx
import { useState } from 'react'

export type Seat = {
  seatId: number
  seatCode: string
  rowNo: string
  colNo: string
  status: string
  seatType?: string
  areaId: number
}

interface SeatGridProps {
  seats: Seat[]
  loading?: boolean
  selectedSeat: Seat | null
  onSeatSelect: (seat: Seat | null) => void
}

export function SeatGrid({ seats, loading = false, selectedSeat, onSeatSelect }: SeatGridProps) {
  const [error] = useState<string | null>(null)

  if (loading) {
    return <p className="text-gray-500 mb-3">Đang tải danh sách ghế...</p>
  }

  if (error) {
    return <p className="text-red-500 mb-3">{error}</p>
  }

  console.log('Seats state:', seats)
  console.log('Seats length:', seats.length)

  if (seats.length === 0) {
    return (
      <p className="text-gray-600 mb-4">
        Hiện không còn ghế trống trong khu vực này.
      </p>
    )
  }

  // Group seats by row
  const seatsByRow: Record<string, Seat[]> = {}
  seats.forEach(seat => {
    const rowKey = seat.rowNo || 'Unknown'
    if (!seatsByRow[rowKey]) {
      seatsByRow[rowKey] = []
    }
    seatsByRow[rowKey].push(seat)
  })

  console.log('Seats grouped by row:', seatsByRow) // Debug log

  // Find the maximum number of columns across all rows
  const maxColumns = Math.max(1, ...Object.values(seatsByRow).map(rowSeats =>
    Math.max(1, ...rowSeats.map(s => parseInt(s.colNo || '1')))
  ))

  // Create a full grid with placeholders for missing seats
  const createSeatGrid = (rowSeats: Seat[], maxCols: number) => {
    const grid: (Seat | null)[] = []
    for (let col = 1; col <= maxCols; col++) {
      const seat = rowSeats.find(s => parseInt(s.colNo) === col)
      grid.push(seat || null)
    }
    return grid
  }

  const getSeatColor = (seat: Seat, isSelected: boolean) => {
    if (isSelected) return 'border-blue-600 bg-blue-100 font-semibold'
    
    // Reserved, booked, and occupied seats are red
    if (seat.status === 'RESERVED' || seat.status === 'OCCUPIED' || seat.status === 'BOOKED') {
      return 'border-red-300 bg-red-50 cursor-not-allowed'
    }
    
    // Available seats: VIP = yellow, STANDARD = grey
    if (seat.seatType === 'VIP') {
      return 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
    }
    
    // STANDARD or default
    return 'border-gray-300 bg-gray-50 hover:bg-gray-100'
  }

  // Identify VIP rows
  const sortedRows = Object.keys(seatsByRow).sort()
  const vipRows = sortedRows.filter(row => 
    seatsByRow[row].some(seat => seat.seatType === 'VIP')
  )
  const firstVipRow = vipRows[0]
  const lastVipRow = vipRows[vipRows.length - 1]
  const hasVipSection = vipRows.length > 0

  return (
    <div className="mb-6">
      {/* VIP Section Label */}
      {hasVipSection && (
        <div className="mb-2 flex items-center gap-2">
          <div className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-300">
            VIP SECTION
          </div>
        </div>
      )}

      {/* Seat Grid */}
      <div className="space-y-3">
        {sortedRows.map((row, rowIndex) => {
          const seatGrid = createSeatGrid(seatsByRow[row], maxColumns)
          const isVipRow = vipRows.includes(row)
          const isFirstVipRow = row === firstVipRow
          const isLastVipRow = row === lastVipRow
          
          return (
            <div 
              key={row} 
              className={`flex items-center space-x-2 ${
                isVipRow 
                  ? `${isFirstVipRow ? 'pt-3' : ''} ${isLastVipRow ? 'pb-3' : ''} pl-2 pr-2 border-l-4 border-r-4 border-red-500 ${
                      isFirstVipRow ? 'border-t-4 rounded-t-lg' : ''
                    } ${
                      isLastVipRow ? 'border-b-4 rounded-b-lg' : ''
                    } bg-red-50/30`
                  : ''
              }`}
            >
              <div className="w-8 text-center font-semibold text-gray-700 text-sm">{row}</div>
              <div className="flex-1 flex gap-2">
                {seatGrid.map((seat, index) => (
                  seat ? (
                    <button
                      key={seat.seatId}
                      type="button"
                      onClick={() => seat.status !== 'OCCUPIED' && seat.status !== 'RESERVED' && seat.status !== 'BOOKED' && onSeatSelect(seat)}
                      disabled={seat.status === 'OCCUPIED' || seat.status === 'RESERVED' || seat.status === 'BOOKED'}
                      className={`w-12 h-10 border-2 rounded-lg text-xs font-medium transition-colors ${
                        getSeatColor(seat, selectedSeat?.seatId === seat.seatId)
                      }`}
                      title={`${seat.seatCode} (${seat.seatType}): ${seat.status}`}
                    >
                      {seat.seatCode}
                    </button>
                  ) : (
                    <div key={`empty-${row}-${index}`} className="w-12 h-10"></div>
                  )
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Chú thích:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-yellow-50 border-2 border-yellow-300 rounded mr-1.5"></div>
            <span>VIP (Trống)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-50 border-2 border-gray-300 rounded mr-1.5"></div>
            <span>Standard (Trống)</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-50 border-2 border-red-300 rounded mr-1.5"></div>
            <span>Đã đặt/Đã ngồi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
