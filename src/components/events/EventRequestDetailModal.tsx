// src/components/events/EventRequestDetailModal.tsx
import { X, Calendar, Users, FileText, User, Clock, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPDATING' | 'EXPIRED'

interface EventRequestDetailModalProps {
  isOpen: boolean
  onClose: () => void
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
  userRole?: string
  onEdit?: () => void
}

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

export function EventRequestDetailModal({
  isOpen,
  onClose,
  request,
  userRole,
  onEdit
}: EventRequestDetailModalProps) {
  if (!isOpen || !request) return null

  const parseDate = (dateStr: string) => {
    try {
      // Handle format: "Dec 24, 2025 5:30:00 PM"
      return new Date(dateStr)
    } catch {
      return new Date()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">{request.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Status Badge */}
          <div className="mb-6">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(request.status)}`}>
              {getStatusLabel(request.status)}
            </span>
          </div>

          {/* Description */}
          {request.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Mô tả
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Request Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Requester */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Người đề xuất</p>
                <p className="font-medium text-gray-900">{request.requesterName || 'Không có thông tin'}</p>
              </div>
            </div>

            {/* Expected Capacity */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Số lượng dự kiến</p>
                <p className="font-medium text-gray-900">{request.expectedCapacity} người</p>
              </div>
            </div>

            {/* Preferred Start Time */}
            <div className="flex items-start">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Thời gian bắt đầu mong muốn</p>
                <p className="font-medium text-gray-900">
                  {format(parseDate(request.preferredStartTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </p>
              </div>
            </div>

            {/* Preferred End Time */}
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

            {/* Created At */}
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

            {/* Processed At (if processed) */}
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

            {/* Processed By (if processed) */}
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

          {/* Organizer Note (if exists) */}
          {request.organizerNote && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Ghi chú từ ban tổ chức</h3>
              <p className="text-sm text-blue-800 whitespace-pre-wrap">{request.organizerNote}</p>
            </div>
          )}

          {/* Created Event ID (if approved) */}
          {request.status === 'APPROVED' && request.createdEventId && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Sự kiện đã được tạo với ID:</span> {request.createdEventId}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            {userRole === 'ORGANIZER' && request.status === 'UPDATING' && request.createdEventId && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Cập nhật thông tin
              </button>
            )}
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
