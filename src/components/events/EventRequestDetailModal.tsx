// src/components/events/EventRequestDetailModal.tsx

// Import icon từ lucide-react để hiển thị UI (nút đóng, icon calendar, users...)
// X: icon đóng modal
// Calendar: icon lịch
// Users: icon số lượng
// FileText: icon mô tả
// User: icon người dùng
// Clock: icon thời gian
// Edit: icon nút cập nhật
import { X, Calendar, Users, FileText, User, Clock, Edit } from 'lucide-react'

// format: format ngày giờ theo pattern (dd/MM/yyyy HH:mm)
// vi: locale tiếng Việt (hiển thị đúng định dạng)
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// ===================== TYPE DEFINITIONS =====================

// EventRequestStatus: kiểu union string cho trạng thái request
// - PENDING: chờ duyệt
// - APPROVED: đã duyệt
// - REJECTED: bị từ chối
// - UPDATING: chờ organizer cập nhật thông tin (thường do thiếu banner/thiếu data)
// - EXPIRED: hết hạn
type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPDATING' | 'EXPIRED'

// Props mà component modal này nhận từ component cha (EventRequests page)
interface EventRequestDetailModalProps {
  // isOpen: modal có đang mở không
  isOpen: boolean

  // onClose: hàm đóng modal (cha truyền xuống)
  onClose: () => void

  // request: dữ liệu chi tiết request cần hiển thị
  // nếu null -> không có dữ liệu, modal không render
  request: {
    requestId: number
    requesterId: number
    requesterName?: string
    title: string
    description: string
    preferredStartTime: string
    preferredEndTime: string
    expectedCapacity: number
    status: EventRequestStatus
    createdAt: string
    processedBy?: number
    processedByName?: string
    processedAt?: string
    organizerNote?: string
    createdEventId?: number
    bannerUrl?: string
  } | null

  // userRole: vai trò user hiện tại (ORGANIZER/STAFF/...)
  // dùng để quyết định có hiện nút “Cập nhật thông tin” hay không
  userRole?: string

  // onEdit: callback để đi tới trang edit event (cha truyền xuống)
  onEdit?: () => void
}

// ===================== HELPER FUNCTIONS =====================

// getStatusLabel: map status (mã) -> label tiếng Việt để hiển thị UI
const getStatusLabel = (status: EventRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'Đã duyệt'
    case 'REJECTED':
      return 'Bị từ chối'
    case 'UPDATING':
      return 'Chờ Cập Nhật Thông Tin'
    case 'EXPIRED':
      return 'Hết hạn'
    default:
      return 'Đang chờ duyệt'
  }
}

// getStatusClass: map status -> CSS class Tailwind để tô màu badge
// APPROVED -> xanh
// REJECTED -> đỏ
// UPDATING -> xanh dương
// default (PENDING) -> vàng
const getStatusClass = (status: EventRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    case 'UPDATING':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

// ===================== MAIN COMPONENT =====================

export function EventRequestDetailModal({
  isOpen,
  onClose,
  request,
  userRole,
  onEdit
}: EventRequestDetailModalProps) {

  // Nếu modal không mở hoặc request null -> không render gì cả
  // Đây là pattern phổ biến để tránh render DOM không cần thiết
  if (!isOpen || !request) return null

  /**
   * parseDate:
   * - Chuyển string ngày giờ từ backend -> Date object
   * - try/catch để tránh crash nếu string sai format
   * - comment trong code nói backend có thể trả dạng: "Dec 24, 2025 5:30:00 PM"
   */
  const parseDate = (dateStr: string) => {
    try {
      // Handle format: "Dec 24, 2025 5:30:00 PM"
      return new Date(dateStr)
    } catch {
      // Nếu parse fail -> return Date hiện tại để tránh lỗi format()
      return new Date()
    }
  }

  // ===================== UI RENDER =====================

  return (
    // Overlay fullscreen:
    // fixed inset-0: phủ toàn màn hình
    // bg-black bg-opacity-50: nền đen mờ
    // flex center: căn giữa modal
    // z-50: nổi lên trên
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Khung modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* ===================== HEADER ===================== */}
        {/* sticky top-0: header dính trên khi scroll nội dung modal */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          {/* Tiêu đề modal lấy từ request.title */}
          <h2 className="text-2xl font-bold text-gray-900">{request.title}</h2>

          {/* Nút đóng modal */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* ===================== CONTENT ===================== */}
        <div className="px-6 py-4">

          {/* ===== Badge trạng thái ===== */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(
                request.status,
              )}`}
            >
              {getStatusLabel(request.status)}
            </span>
          </div>

          {/* ===== Mô tả (Description) ===== */}
          {/* Chỉ hiển thị nếu request.description có dữ liệu */}
          {request.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Mô tả
              </h3>
              {/* whitespace-pre-wrap: giữ xuống dòng đúng như text */}
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* ===== Grid thông tin request ===== */}
          {/* grid 1 cột ở mobile, 2 cột ở desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

            {/* -------- Người đề xuất -------- */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Người đề xuất</p>
                <p className="font-medium text-gray-900">
                  {request.requesterName || 'Không có thông tin'}
                </p>
              </div>
            </div>

            {/* -------- Số lượng dự kiến -------- */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Số lượng dự kiến</p>
                <p className="font-medium text-gray-900">{request.expectedCapacity} người</p>
              </div>
            </div>

            {/* -------- Thời gian bắt đầu mong muốn -------- */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Thời gian bắt đầu mong muốn</p>
                <p className="font-medium text-gray-900">
                  {/* format theo dd/MM/yyyy HH:mm, locale vi */}
                  {format(parseDate(request.preferredStartTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            {/* -------- Thời gian kết thúc mong muốn -------- */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Thời gian kết thúc mong muốn</p>
                <p className="font-medium text-gray-900">
                  {format(parseDate(request.preferredEndTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            {/* -------- Ngày tạo request -------- */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày tạo</p>
                <p className="font-medium text-gray-900">
                  {format(parseDate(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            {/* -------- Ngày xử lý (chỉ hiển thị nếu đã xử lý) -------- */}
            {request.processedAt && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Ngày xử lý</p>
                  <p className="font-medium text-gray-900">
                    {format(parseDate(request.processedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </p>
                </div>
              </div>
            )}

            {/* -------- Người xử lý (chỉ hiển thị nếu có processedByName) -------- */}
            {request.processedByName && (
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Người xử lý</p>
                  <p className="font-medium text-gray-900">{request.processedByName}</p>
                </div>
              </div>
            )}
          </div>

          {/* ===== Ghi chú từ ban tổ chức ===== */}
          {/* Chỉ hiển thị nếu organizerNote tồn tại */}
          {request.organizerNote && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Ghi chú từ ban tổ chức
              </h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                {request.organizerNote}
              </p>
            </div>
          )}

          {/* ===== Hiển thị createdEventId nếu request đã APPROVED ===== */}
          {/* Ý nghĩa: sau khi staff duyệt, backend tạo event thật và trả eventId */}
          {request.status === 'APPROVED' && request.createdEventId && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Sự kiện đã được tạo với ID:</span> {request.createdEventId}
              </p>
            </div>
          )}

          {/* ===================== ACTION BUTTONS ===================== */}
          {/* Footer nút action */}
          <div className="flex justify-end gap-3 pt-4 border-t">

            {/* Nút “Cập nhật thông tin” chỉ hiện khi:
                - userRole là ORGANIZER
                - status là UPDATING (tức là staff yêu cầu cập nhật)
                - có createdEventId (đã có event được tạo)
                - có callback onEdit
             */}
            {userRole === 'ORGANIZER' &&
              request.status === 'UPDATING' &&
              request.createdEventId &&
              onEdit && (
                <button
                  onClick={onEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Cập nhật thông tin
                </button>
              )}

            {/* Nút đóng modal luôn có */}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
