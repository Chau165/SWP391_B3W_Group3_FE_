// ===================== FILE: src/components/common/SeatGrid.tsx =====================
// Component hiển thị sơ đồ ghế (grid) theo hàng/cột.
// - Nhận danh sách ghế từ BE
// - Gom ghế theo hàng (rowNo), tạo grid theo cột (colNo)
// - Hiển thị màu theo trạng thái ghế (AVAILABLE/BOOKED/HOLD...)
// - Cho phép chọn ghế (click) và trả ghế về component cha qua onSeatSelect
// - Có hỗ trợ: maxReached (đã chọn đủ ghế) và disabled (khóa toàn bộ grid)

import { useState } from 'react'

// ===================== TYPE: Seat =====================
// Kiểu dữ liệu ghế dùng trong toàn app
export type Seat = {
  seatId: number       // id ghế duy nhất
  seatCode: string     // mã ghế hiển thị (vd: A1, A2)
  rowNo: string        // hàng (vd: A, B, C)
  colNo: string        // cột (vd: 1, 2, 3) - đang là string nên hay parseInt
  status: string       // trạng thái ghế (AVAILABLE/BOOKED/HOLD/...)
  seatType?: string    // loại ghế (VIP/STANDARD) - optional
  areaId: number       // id khu vực
}

// ===================== PROPS =====================
// Props component cha truyền vào để SeatGrid render và xử lý click
interface SeatGridProps {
  seats: Seat[]                          // danh sách ghế
  loading?: boolean                      // đang load ghế hay không
  selectedSeats?: Seat[]                 // danh sách ghế đã chọn (để highlight)
  onSeatSelect?: (seat: Seat | null) => void // callback trả về ghế khi user click
  maxReached?: boolean                   // đã chọn đủ số ghế tối đa chưa (vd tối đa 4)
  // Khi true: khóa toàn bộ grid (read-only), dùng khi event đã kết thúc
  disabled?: boolean
  // Khi false: không cho chọn ghế nhưng vẫn hiển thị trạng thái ghế (view-only)
  allowSelect?: boolean
}

// ===================== COMPONENT =====================
export function SeatGrid({
  seats,
  loading = false,
  selectedSeats = [],
  onSeatSelect,
  maxReached = false,
  disabled = false,
  allowSelect = true,
}: SeatGridProps) {
  // error state hiện tại chưa set ở đâu (đang = null cố định),
  // nhưng để sẵn để sau này có thể hiển thị lỗi.
  const [error] = useState<string | null>(null)

  // ===================== UI: LOADING =====================
  // Nếu đang load danh sách ghế => hiển thị text loading
  if (loading) {
    return <p className="text-gray-500 mb-3">Đang tải danh sách ghế...</p>
  }

  // ===================== UI: ERROR =====================
  // Nếu có lỗi => hiển thị lỗi (hiện code này không set error nên hầu như không vào)
  if (error) {
    return <p className="text-red-500 mb-3">{error}</p>
  }

  // Debug: log danh sách ghế
  console.log('Seats state:', seats)
  console.log('Seats length:', seats.length)

  // ===================== UI: EMPTY =====================
  // Nếu mảng ghế rỗng => báo không còn ghế
  if (seats.length === 0) {
    return (
      <p className="text-gray-600 mb-4">
        Hiện không còn ghế trống trong khu vực này.
      </p>
    )
  }

  // ===================== GROUP SEATS BY ROW =====================
  // Mục tiêu: gom ghế theo hàng (rowNo)
  // Ví dụ: seatsByRow["A"] = [A1, A2, A3...], seatsByRow["B"] = [B1, B2...]
  const seatsByRow: Record<string, Seat[]> = {}
  seats.forEach((seat) => {
    // Nếu rowNo null/empty => gán 'Unknown'
    const rowKey = seat.rowNo || 'Unknown'
    // Nếu row chưa có => tạo mảng rỗng
    if (!seatsByRow[rowKey]) {
      seatsByRow[rowKey] = []
    }
    // Thêm ghế vào đúng row
    seatsByRow[rowKey].push(seat)
  })

  console.log('Seats grouped by row:', seatsByRow) // Debug log

  // ===================== FIND MAX COLUMNS =====================
  // Tìm số cột lớn nhất trong tất cả các hàng
  // Mục đích: tạo grid đều nhau (mọi hàng đều có đủ slot cột),
  // những cột không có ghế thì để placeholder null (ô trống).
  const maxColumns = Math.max(
    1,
    ...Object.values(seatsByRow).map((rowSeats) =>
      Math.max(1, ...rowSeats.map((s) => parseInt(s.colNo || '1'))),
    ),
  )

  // ===================== CREATE FULL GRID FOR A ROW =====================
  // Tạo grid dạng (Seat | null)[] theo số cột maxCols
  // col từ 1..maxCols:
  // - nếu tìm thấy ghế đúng col => đưa ghế vào
  // - nếu không có => null (placeholder)
  const createSeatGrid = (rowSeats: Seat[], maxCols: number) => {
    const grid: (Seat | null)[] = []
    for (let col = 1; col <= maxCols; col++) {
      // Tìm ghế trong hàng có colNo = col
      const seat = rowSeats.find((s) => parseInt(s.colNo) === col)
      // Nếu không có ghế => null
      grid.push(seat || null)
    }
    return grid
  }

  // ===================== COLOR/STYLE FOR A SEAT =====================
  // Trả về className Tailwind để render màu ghế theo trạng thái
  const getSeatColor = (
    seat: Seat,
    isSelected: boolean,
    gridDisabled: boolean = false,
  ) => {
    /**
     * Nếu grid disabled (event ended...) và ghế không được chọn:
     * -> hiển thị mờ + không cho tương tác
     * -> text-transparent để ẩn seatCode (trông như khóa toàn bộ)
     */
    if (gridDisabled && !isSelected) {
      return 'border-gray-200 bg-white cursor-not-allowed text-transparent'
    }

    // Nếu ghế đang được chọn => highlight xanh dương
    if (isSelected) return 'border-blue-600 bg-blue-100 font-semibold'

    /**
     * Nếu đã chọn đủ số ghế (maxReached) mà ghế này chưa chọn:
     * -> khóa các ghế còn lại (không cho chọn thêm)
     * -> text-transparent để ẩn seatCode
     */
    if (maxReached && !isSelected) {
      return 'border-gray-200 bg-white cursor-not-allowed text-transparent'
    }

    // Nếu ghế đã được đặt/chiếm => đỏ, disable
    if (
      seat.status === 'BOOKED' ||
      seat.status === 'RESERVED' ||
      seat.status === 'OCCUPIED'
    ) {
      return 'border-red-400 bg-red-100 cursor-not-allowed text-red-800'
    }

    // Nếu ghế đang giữ chỗ / hold => xám, disable
    if (seat.status === 'HOLD') {
      return 'border-gray-400 bg-gray-200 cursor-not-allowed text-gray-700'
    }

    // Mặc định xem là ghế trống (AVAILABLE) => xanh lá + hover
    return 'border-green-400 bg-green-50 hover:bg-green-100 text-green-800'
  }

  // ===================== IDENTIFY VIP/STANDARD SECTIONS =====================
  // sortedRows: danh sách tên hàng được sort tăng dần (A,B,C...)
  const sortedRows = Object.keys(seatsByRow).sort()

  // vipRows: những hàng có ít nhất 1 ghế seatType === 'VIP'
  const vipRows = sortedRows.filter((row) =>
    seatsByRow[row].some((seat) => seat.seatType === 'VIP'),
  )

  // standardRows: những hàng có ít nhất 1 ghế seatType === 'STANDARD'
  const standardRows = sortedRows.filter((row) =>
    seatsByRow[row].some((seat) => seat.seatType === 'STANDARD'),
  )

  // Lấy row đầu và cuối để vẽ viền section đẹp (border top/bottom)
  const firstVipRow = vipRows[0]
  const lastVipRow = vipRows[vipRows.length - 1]
  const firstStandardRow = standardRows[0]
  const lastStandardRow = standardRows[standardRows.length - 1]

  // Có section nào không?
  const hasVipSection = vipRows.length > 0
  const hasStandardSection = standardRows.length > 0

  // ===================== RENDER UI =====================
  return (
    <div className="mb-6">
      {/* ===================== LABEL VIP SECTION ===================== */}
      {/* Nếu có VIP => hiển thị nhãn VIP SECTION phía trên */}
      {hasVipSection && (
        <div className="mb-2 flex items-center gap-2">
          <div className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full border border-red-300">
            VIP SECTION
          </div>
        </div>
      )}

      {/* ===================== GRID THEO HÀNG ===================== */}
      <div className="space-y-3">
        {sortedRows.map((row) => {
          // Tạo grid cho hàng hiện tại (có null placeholder)
          const seatGrid = createSeatGrid(seatsByRow[row], maxColumns)

          // Xác định hàng này thuộc VIP hay STANDARD
          const isVipRow = vipRows.includes(row)
          const isStandardRow = standardRows.includes(row)

          // Xác định hàng đầu/cuối của section để bo góc/border đẹp
          const isFirstVipRow = row === firstVipRow
          const isLastVipRow = row === lastVipRow
          const isFirstStandardRow = row === firstStandardRow
          const isLastStandardRow = row === lastStandardRow

          return (
            <div key={row}>
              {/* ===================== LABEL STANDARD SECTION ===================== */}
              {/* Nhãn STANDARD hiện trước hàng STANDARD đầu tiên */}
              {isFirstStandardRow && hasStandardSection && (
                <div className="mb-2 mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-300">
                    STANDARD SECTION
                  </div>
                </div>
              )}

              {/* 1 dòng (row) gồm: ký hiệu hàng + danh sách ghế */}
              <div className="flex items-center space-x-2">
                {/* Cột hiển thị chữ hàng (A/B/C) */}
                <div className="w-8 text-center font-semibold text-gray-700 text-sm">
                  {row}
                </div>

                {/* Khối ghế trong hàng */}
                <div
                  className={`flex gap-2 ${
                    // Nếu là VIP row => thêm border đỏ + nền đỏ nhạt
                    isVipRow
                      ? `${isFirstVipRow ? 'pt-3' : ''} ${
                          isLastVipRow ? 'pb-3' : ''
                        } pl-2 pr-2 border-l-4 border-r-4 border-red-500 ${
                          isFirstVipRow ? 'border-t-4 rounded-t-lg' : ''
                        } ${
                          isLastVipRow ? 'border-b-4 rounded-b-lg' : ''
                        } bg-red-50/30`
                      : // Nếu là STANDARD row => border xanh dương + nền xanh nhạt
                      isStandardRow
                      ? `${isFirstStandardRow ? 'pt-3' : ''} ${
                          isLastStandardRow ? 'pb-3' : ''
                        } pl-2 pr-2 border-l-4 border-r-4 border-blue-400 ${
                          isFirstStandardRow ? 'border-t-4 rounded-t-lg' : ''
                        } ${
                          isLastStandardRow ? 'border-b-4 rounded-b-lg' : ''
                        } bg-blue-50/30`
                      : ''
                  }`}
                >
                  {/* Render từng "ô" trong seatGrid */}
                  {seatGrid.map((seat, index) =>
                    seat ? (
                      // Nếu ô có ghế => render button
                      <button
                        key={seat.seatId}
                        type="button"
                        onClick={() => {
                          // Nếu grid (event ended) hoặc ghế không AVAILABLE => không làm gì
                          if (disabled || seat.status !== 'AVAILABLE') return
                          // Nếu component cha không cho phép chọn ghế (view-only) => không làm gì
                          if (!allowSelect) return
                          // Nếu không có callback => không làm gì
                          if (typeof onSeatSelect !== 'function') return
                          // Nếu hợp lệ => báo ghế lên component cha
                          onSeatSelect(seat)
                        }}
                        // Disable nút khi:
                        // - grid disabled (event ended)
                        // - hoặc ghế không AVAILABLE
                        // - hoặc không cho phép chọn ghế (view-only)
                        disabled={disabled || seat.status !== 'AVAILABLE' || !allowSelect}
                        className={`w-12 h-10 border-2 rounded-lg text-xs font-medium transition-colors ${
                          getSeatColor(seat, selectedSeats.some((s) => s.seatId === seat.seatId), disabled)
                        }`}
                        // Tooltip khi hover
                        title={
                          disabled
                            ? `${seat.seatCode}: sự kiện đã kết thúc`
                            : `${seat.seatCode} (${seat.seatType}): ${seat.status}`
                        }
                      >
                        {/* Nếu maxReached và ghế chưa selected => ẩn seatCode */}
                        {maxReached &&
                        !selectedSeats.some((s) => s.seatId === seat.seatId)
                          ? ''
                          : seat.seatCode}
                      </button>
                    ) : (
                      // Nếu ô null => render div trống để giữ layout cột
                      <div
                        key={`empty-${row}-${index}`}
                        className="w-12 h-10"
                      ></div>
                    ),
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===================== LEGEND / CHÚ THÍCH ===================== */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-2">Chú thích:</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-green-50 border-2 border-green-400 rounded mr-1.5"></div>
            <span>Ghế trống</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gray-200 border-2 border-gray-400 rounded mr-1.5"></div>
            <span>Đang đặt</span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-400 rounded mr-1.5"></div>
            <span>Đã đặt</span>
          </div>
        </div>
      </div>
    </div>
  )
}
