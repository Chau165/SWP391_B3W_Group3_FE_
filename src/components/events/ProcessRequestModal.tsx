// ===================== IMPORTS =====================

// Icon X dùng cho nút đóng modal
import { X } from 'lucide-react'

// useState/useEffect dùng quản lý state & lifecycle React
import { useState, useEffect } from 'react'

// ToastContext để hiển thị thông báo (warning/success/error)
import { useToast } from '../../contexts/ToastContext'

// ===================== TYPES =====================

// Area: kiểu dữ liệu khu vực (địa điểm) mà BE trả về
// areaId: id khu vực
// areaName: tên khu vực
// capacity: sức chứa tối đa
type Area = {
  areaId: number
  areaName: string
  capacity: number
}

// Props của modal xử lý request
type ProcessRequestModalProps = {
  // isOpen: modal có đang mở không
  isOpen: boolean

  // onClose: callback đóng modal (component cha truyền xuống)
  onClose: () => void

  // onSubmit: callback gửi dữ liệu duyệt/từ chối lên cha
  // areaId: khu vực được chọn (khi APPROVE)
  // organizerNote: ghi chú cho organizer
  onSubmit: (areaId: number, organizerNote: string) => void

  // action: hành động đang xử lý: APPROVE (duyệt) hoặc REJECT (từ chối)
  action: 'APPROVE' | 'REJECT'

  // request: request đang được xử lý (có thể null nếu chưa chọn request)
  request: {
    requestId: number
    title: string
    preferredStartTime?: string
    preferredEndTime?: string
    expectedCapacity?: number
  } | null
}

// ===================== COMPONENT =====================

export function ProcessRequestModal({
  isOpen,
  onClose,
  onSubmit,
  action,
  request
}: ProcessRequestModalProps) {

  // Lấy hàm showToast để hiển thị thông báo nhỏ trên UI
  const { showToast } = useToast()

  // Danh sách khu vực có thể chọn (kết quả từ API)
  const [areas, setAreas] = useState<Area[]>([])

  // selectedAreaId: id khu vực đang được chọn
  // mặc định 0 = chưa chọn/không hợp lệ
  const [selectedAreaId, setSelectedAreaId] = useState<number>(0)

  // organizerNote: ghi chú staff gửi cho organizer
  const [organizerNote, setOrganizerNote] = useState('')

  // loading: đang gọi API lấy khu vực khả dụng
  const [loading, setLoading] = useState(false)

  // error: thông báo lỗi khi fetch areas
  const [error, setError] = useState<string | null>(null)

  // ===================== EFFECT: THEO DÕI MỞ MODAL ĐỂ FETCH AREAS =====================
  useEffect(() => {
    // Log debug: xem modal mở chưa, action gì, request có không và thời gian request
    console.log('Modal state:', {
      isOpen,
      action,
      hasRequest: !!request,
      preferredStartTime: request?.preferredStartTime,
      preferredEndTime: request?.preferredEndTime
    })

    /**
     * Chỉ fetch khu vực khi:
     * - modal đang mở
     * - action là APPROVE
     * - request có preferredStartTime và preferredEndTime
     *
     * Vì khi REJECT thì không cần chọn khu vực => không fetch
     */
    if (isOpen && action === 'APPROVE' && request?.preferredStartTime && request?.preferredEndTime) {
      console.log('Fetching available areas...')
      fetchAvailableAreas()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Lý do disable:
    // fetchAvailableAreas dùng request trong closure; tránh warning dependency quá nhiều
  }, [isOpen, action, request?.requestId, request?.preferredStartTime, request?.preferredEndTime])

  // ===================== FUNCTION: FETCH KHU VỰC TRỐNG THEO THỜI GIAN =====================
  const fetchAvailableAreas = async () => {
    // Nếu thiếu thời gian -> không gọi API
    if (!request?.preferredStartTime || !request?.preferredEndTime) return

    // Bật loading, reset error
    setLoading(true)
    setError(null)

    try {
      // Lấy token auth từ localStorage
      const token = localStorage.getItem('token')

      /**
       * formatDateTime:
       * BE yêu cầu format: "yyyy-MM-dd HH:mm:ss"
       * Trong khi request có thể trả dạng ISO hoặc dạng string khác
       * => parse sang Date rồi format thủ công
       */
      const formatDateTime = (dateStr: string) => {
        const d = new Date(dateStr)

        // Nếu parse ra Invalid Date => return rỗng để báo lỗi
        if (Number.isNaN(d.getTime())) {
          console.error('Invalid date from request:', dateStr)
          return ''
        }

        // pad 2 chữ số cho tháng/ngày/giờ/phút/giây
        const pad = (n: number) => n.toString().padStart(2, '0')

        const year = d.getFullYear()
        const month = pad(d.getMonth() + 1)
        const day = pad(d.getDate())
        const hours = pad(d.getHours())
        const minutes = pad(d.getMinutes())
        const seconds = pad(d.getSeconds())

        // Ví dụ: "2025-12-10 08:00:00"
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }

      // Convert thời gian từ request sang format BE cần
      const startTime = formatDateTime(request.preferredStartTime)
      const endTime = formatDateTime(request.preferredEndTime)

      // Nếu format fail => setError và return sớm
      if (!startTime || !endTime) {
        setError('Thời gian sự kiện không hợp lệ')
        setLoading(false)
        return
      }

      // Log để debug
      console.log('Original times:', {
        start: request.preferredStartTime,
        end: request.preferredEndTime
      })
      console.log('Formatted times for API:', { startTime, endTime })

      /**
       * API lấy khu vực trống:
       * /api/areas/free?startTime=...&endTime=...
       * encodeURIComponent để tránh lỗi ký tự đặc biệt (space, :)
       */
      const url = `http://localhost:3000/api/areas/free?startTime=${encodeURIComponent(
        startTime
      )}&endTime=${encodeURIComponent(endTime)}`

      console.log('Fetching areas from:', url)

      // Gọi API
      const response = await fetch(url, {
        headers: {
          // Bearer token để xác thực
          Authorization: `Bearer ${token ?? ''}`
        }
      })

      console.log('Areas response status:', response.status)

      // Nếu response OK
      if (response.ok) {
        const data = await response.json()
        console.log('Available areas (raw):', data)

        // BE trả có thể dạng { areas: [...] }
        const allAreas = Array.isArray(data.areas) ? data.areas : []

        // Lấy expectedCapacity từ request (số lượng dự kiến)
        const expectedCapacity = request?.expectedCapacity ?? 0

        /**
         * Lọc các khu vực đủ sức chứa:
         * - Nếu expectedCapacity > 0 => chỉ lấy area.capacity >= expectedCapacity
         * - Nếu expectedCapacity = 0 => lấy tất cả
         */
        const filteredAreas =
          expectedCapacity > 0
            ? allAreas.filter((area: Area) => area.capacity >= expectedCapacity)
            : allAreas

        console.log('Filtered areas:', {
          expectedCapacity,
          allAreasCount: allAreas.length,
          filteredCount: filteredAreas.length
        })

        // Set state areas để hiển thị dropdown
        setAreas(filteredAreas)

        // Nếu có khu vực => auto chọn khu đầu tiên
        if (filteredAreas.length > 0) {
          setSelectedAreaId(filteredAreas[0].areaId)
        } else {
          // Không có area phù hợp => selected = 0
          setSelectedAreaId(0)
        }

      } else {
        // Nếu response lỗi -> đọc text để parse message
        const errorText = await response.text()
        console.error('Error response:', errorText)

        // Cố gắng parse JSON { message: "..."} nếu backend trả
        try {
          const errorData = JSON.parse(errorText)

          // Nếu message có câu “hiện tại hoặc tương lai” => thời gian đã qua
          if (errorData.message && errorData.message.includes('hiện tại hoặc tương lai')) {
            throw new Error('Thời gian sự kiện đã qua. Không thể phê duyệt yêu cầu này.')
          } else if (errorData.message) {
            // Nếu có message cụ thể => show luôn
            throw new Error(errorData.message)
          }
        } catch (e) {
          // Nếu parse JSON fail, hoặc lỗi khác
          // Nếu e là Error với message khác default thì throw tiếp
          if (e instanceof Error && e.message !== 'Failed to fetch available areas') {
            throw e
          }
        }

        // Fallback message chung
        throw new Error('Không thể tải danh sách khu vực. Vui lòng thử lại.')
      }

    } catch (error) {
      // Catch lỗi network / throw ở trên
      console.error('Error fetching areas:', error)

      // Set error để hiển thị trên UI
      setError(
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách khu vực. Vui lòng thử lại.'
      )
    } finally {
      // Dù thành công hay fail đều tắt loading
      setLoading(false)
    }
  }

  // ===================== SUBMIT FORM =====================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    /**
     * Nếu APPROVE thì bắt buộc phải có selectedAreaId != 0
     * Nếu không có -> toast warning và return
     */
    if (action === 'APPROVE' && selectedAreaId === 0) {
      showToast('warning', 'Vui lòng chọn khu vực cho sự kiện')
      return
    }

    // Gửi dữ liệu lên cha
    // Với REJECT: areaId vẫn gửi (có thể là 0) nhưng cha có thể ignore
    onSubmit(selectedAreaId, organizerNote)

    // Đóng modal và reset state
    handleClose()
  }

  // ===================== CLOSE MODAL + RESET STATE =====================
  const handleClose = () => {
    // reset các state về mặc định
    setSelectedAreaId(0)
    setOrganizerNote('')
    setError(null)

    // gọi callback đóng modal
    onClose()
  }

  // Nếu modal không mở hoặc request null => không render
  if (!isOpen || !request) return null

  // ===================== UI RENDER =====================
  return (
    // Overlay modal
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Box modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {/* Title đổi theo action */}
            {action === 'APPROVE' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
          </h2>

          {/* Nút đóng */}
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Hiển thị tên sự kiện */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sự kiện
            </label>
            <p className="text-sm text-gray-600">{request.title}</p>
          </div>

          {/* Hiển thị số lượng dự kiến nếu có */}
          {request.expectedCapacity && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng người tham gia dự kiến
              </label>
              <p className="text-sm text-gray-600">{request.expectedCapacity} người</p>
            </div>
          )}

          {/* Nếu action là APPROVE => bắt buộc chọn khu vực */}
          {action === 'APPROVE' && (
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Chọn khu vực <span className="text-red-500">*</span>
              </label>

              {/* Loading trạng thái */}
              {loading ? (
                <p className="text-sm text-gray-500">Đang tải khu vực khả dụng...</p>

              ) : error ? (
                // Nếu lỗi => show error text
                <p className="text-sm text-red-500">{error}</p>

              ) : areas.length === 0 ? (
                // Không có area nào phù hợp
                <p className="text-sm text-red-500">
                  Không có khu vực nào khả dụng trong khung thời gian này
                </p>

              ) : (
                // Dropdown area list
                <select
                  id="area"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {areas.map((area) => (
                    <option key={area.areaId} value={area.areaId}>
                      {area.areaName} (Sức chứa: {area.capacity})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Ghi chú cho organizer (optional) */}
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú cho người tổ chức
            </label>
            <textarea
              id="note"
              value={organizerNote}
              onChange={(e) => setOrganizerNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Nhập ghi chú (không bắt buộc)"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {/* Hủy */}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>

            {/* Submit */}
            <button
              type="submit"
              // Nếu APPROVE mà đang loading hoặc không có area => disable
              disabled={action === 'APPROVE' && (loading || areas.length === 0)}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                action === 'APPROVE'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {action === 'APPROVE' ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
