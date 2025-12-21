// Import Link để chuyển trang trong SPA, useNavigate để điều hướng bằng code
import { Link, useNavigate } from 'react-router-dom'

// Lấy thông tin user đăng nhập (role) từ AuthContext
import { useAuth } from '../contexts/AuthContext'

// ToastContext để hiển thị thông báo (success/error/warning)
import { useToast } from '../contexts/ToastContext'

// Import icon để hiển thị UI đẹp hơn
import { CheckCircle2, XCircle, FileClock, PlusCircle } from 'lucide-react'

// useEffect để gọi API khi component mount / khi dependencies thay đổi
// useState để quản lý state dữ liệu
import { useEffect, useState } from 'react'

// Modal xem chi tiết request
import { EventRequestDetailModal } from '../components/events/EventRequestDetailModal'

// Modal xử lý request (Approve/Reject + chọn area + note)
import { ProcessRequestModal } from '../components/events/ProcessRequestModal'

/**
 * Enum kiểu trạng thái yêu cầu tổ chức sự kiện
 * - PENDING: chờ duyệt
 * - APPROVED: đã duyệt
 * - REJECTED: bị từ chối
 * - UPDATING: đã duyệt nhưng còn thiếu thông tin (VD banner) → yêu cầu organizer cập nhật
 * - EXPIRED: hết hạn (nếu có nghiệp vụ)
 */
type EventRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UPDATING'
  | 'EXPIRED'

/**
 * Kiểu dữ liệu EventRequest (map theo BE trả về)
 * Lưu ý: có nhiều field optional vì có thể BE không luôn trả đủ
 */
type EventRequest = {
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
}

/**
 * getStatusLabel:
 * Chuyển status code -> text tiếng Việt để hiển thị UI
 */
const getStatusLabel = (status: EventRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'Hoàn Thành'
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

/**
 * getStatusClass:
 * Trả về class Tailwind khác nhau theo trạng thái
 * -> màu badge trạng thái
 */
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

/**
 * =============================================================================
 * EVENT REQUESTS PAGE - Trang quản lý yêu cầu tổ chức sự kiện
 * =============================================================================
 *
 * Trang này phục vụ 2 role:
 *
 * 1) STAFF:
 *  - Xem tất cả event request của sinh viên/organizer gửi lên
 *  - Tab "Chờ": gồm PENDING + UPDATING
 *  - Tab "Đã xử lý": gồm APPROVED + REJECTED
 *  - Có thể Approve / Reject request ở tab "Chờ"
 *
 * 2) ORGANIZER:
 *  - Chỉ xem request của chính mình (endpoint /my)
 *  - Có thể tạo request mới (nút "Gửi yêu cầu mới")
 *  - Nếu request ở trạng thái UPDATING thì có thể bấm sửa event (onEdit)
 *
 * Flow:
 * A) Vào trang -> useEffect gọi fetchEventRequests()
 * B) fetchEventRequests:
 *   - Gọi API lấy request list (staff/all hoặc organizer/my)
 *   - Gọi thêm API /events để lấy bannerUrl event (để check thiếu banner)
 *   - Nếu request APPROVED mà event chưa có banner -> đổi status thành UPDATING
 *   - Chia danh sách thành waitingRequests và processedRequests
 * C) User click 1 row -> mở modal EventRequestDetailModal xem chi tiết
 * D) Staff click Approve/Reject -> mở ProcessRequestModal -> submit -> gọi API process
 * =============================================================================
 */
export default function EventRequests() {
  // Lấy user từ AuthContext để check role
  const { user } = useAuth()

  // showToast dùng để hiển thị thông báo
  const { showToast } = useToast()

  // navigate để chuyển trang bằng code
  const navigate = useNavigate()

  // Role check
  const isStaff = user?.role === 'STAFF'
  const isOrganizer = user?.role === 'ORGANIZER'

  // requests: danh sách request tổng (có thể dùng cho fallback)
  const [requests, setRequests] = useState<EventRequest[]>([])

  // waitingRequests: danh sách request đang chờ (PENDING + UPDATING)
  const [waitingRequests, setWaitingRequests] = useState<EventRequest[]>([])

  // processedRequests: danh sách request đã xử lý (APPROVED + REJECTED)
  const [processedRequests, setProcessedRequests] = useState<EventRequest[]>([])

  // loading + error cho UI
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // selectedRequest: request đang được chọn để xem modal detail
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(
    null,
  )

  // isModalOpen: điều khiển mở/đóng modal detail
  const [isModalOpen, setIsModalOpen] = useState(false)

  // isProcessModalOpen: điều khiển mở/đóng modal approve/reject
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)

  // processAction: action staff chọn (APPROVE hoặc REJECT)
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT'>(
    'APPROVE',
  )

  // requestToProcess: request staff đang chuẩn bị xử lý trong ProcessRequestModal
  const [requestToProcess, setRequestToProcess] = useState<EventRequest | null>(
    null,
  )

  // activeTab: tab đang chọn (waiting / processed)
  const [activeTab, setActiveTab] = useState<'waiting' | 'processed'>('waiting')

  /**
   * useEffect:
   * Khi vào trang hoặc khi role thay đổi (staff/organizer)
   * -> gọi fetchEventRequests để load dữ liệu
   */
  useEffect(() => {
    fetchEventRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, isOrganizer])

  /**
   * fetchEventRequests:
   * - Lấy token
   * - Chọn endpoint theo role:
   *   + Staff: /api/staff/event-requests (lấy tất cả)
   *   + Organizer: /api/event-requests/my (lấy của mình)
   * - Sau đó gọi /api/events để lấy bannerUrl của event
   * - Nếu request APPROVED mà event không có banner -> chuyển thành UPDATING
   * - Tách danh sách thành waiting và processed
   */
  const fetchEventRequests = async () => {
    try {
      const token = localStorage.getItem('token')

      // Staff thấy tất cả requests, Organizer chỉ thấy của mình
      const endpoint = isStaff
        ? 'http://localhost:3000/api/staff/event-requests'
        : 'http://localhost:3000/api/event-requests/my'

      // Call API lấy request list
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Event requests data:', data)

        // ===== BƯỚC 2: Fetch events để lấy bannerUrl (mapping eventId -> bannerUrl) =====
        const eventsResponse = await fetch('http://localhost:3000/api/events', {
          headers: {
            Authorization: `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true',
          },
        })

        let eventsMap = new Map()
        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()

          // BE trả cấu trúc {openEvents:[], closedEvents:[]}
          const allEvents = [
            ...(eventsData.openEvents || []),
            ...(eventsData.closedEvents || []),
          ]

          // Map eventId -> bannerUrl để check thiếu banner
          allEvents.forEach((event: any) => {
            eventsMap.set(event.eventId, event.bannerUrl)
          })
        }

        /**
         * updateRequestStatus:
         * Nếu req.status = APPROVED và có createdEventId:
         *  - lấy bannerUrl của event đó
         *  - nếu bannerUrl rỗng -> đổi status thành UPDATING
         *  - nếu có banner -> attach bannerUrl vào req để modal hiển thị
         */
        const updateRequestStatus = (req: EventRequest): EventRequest => {
          if (req.status === 'APPROVED' && req.createdEventId) {
            const bannerUrl = eventsMap.get(req.createdEventId)
            if (!bannerUrl || bannerUrl.trim() === '') {
              return {
                ...req,
                status: 'UPDATING' as EventRequestStatus,
                bannerUrl: undefined,
              }
            }
            return { ...req, bannerUrl }
          }
          return req
        }

        /**
         * BE có thể trả theo 2 kiểu:
         * 1) New structure: { pending: [], approved: [], rejected: [] }
         * 2) Legacy: trả thẳng 1 mảng []
         */
        if (data.pending || data.approved || data.rejected) {
          // New structure
          const pending = Array.isArray(data.pending) ? data.pending : []
          let approved = Array.isArray(data.approved)
            ? data.approved.map(updateRequestStatus)
            : []
          const rejected = Array.isArray(data.rejected) ? data.rejected : []

          // approved sau khi update có thể bị chuyển thành UPDATING
          const updating = approved.filter(
            (req: EventRequest) => req.status === 'UPDATING',
          )
          approved = approved.filter(
            (req: EventRequest) => req.status === 'APPROVED',
          )

          // Waiting = pending + updating
          const waiting = [...pending, ...updating]

          // Processed = approved + rejected
          const processed = [...approved, ...rejected]

          // Update state để render tab
          setWaitingRequests(waiting)
          setProcessedRequests(processed)

          // requests tổng (nếu cần)
          setRequests([...waiting, ...processed])
        } else if (Array.isArray(data)) {
          // Legacy flat array
          const updatedData = data.map(updateRequestStatus)
          setRequests(updatedData)

          // Waiting tab: PENDING + UPDATING
          setWaitingRequests(
            updatedData.filter(
              (req) => req.status === 'PENDING' || req.status === 'UPDATING',
            ),
          )

          // Processed tab: APPROVED + REJECTED
          setProcessedRequests(
            updatedData.filter(
              (req) => req.status === 'APPROVED' || req.status === 'REJECTED',
            ),
          )
        }
      } else {
        // Nếu response không ok
        throw new Error('Failed to fetch event requests')
      }
    } catch (error) {
      // Lỗi network/BE
      console.error('Error fetching event requests:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to fetch event requests',
      )
    } finally {
      // Dù ok/fail đều tắt loading
      setLoading(false)
    }
  }

  /**
   * Click row -> mở modal xem chi tiết
   */
  const handleViewDetails = (request: EventRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  /**
   * Đóng modal detail
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
  }

  /**
   * handleEditEvent:
   * - Chỉ cho phép sửa khi status = UPDATING
   * - Lấy createdEventId để navigate sang trang edit event
   */
  const handleEditEvent = () => {
    if (!selectedRequest) return

    // chỉ status UPDATING mới sửa
    if (selectedRequest.status !== 'UPDATING') return

    // Nếu BE tạo event từ request thì dùng createdEventId
    const eventId = selectedRequest.createdEventId || selectedRequest.requestId

    // Đóng modal trước khi navigate
    setIsModalOpen(false)

    // Navigate đến trang edit event
    navigate(`/dashboard/events/${eventId}/edit`)
  }

  /**
   * Staff bấm Approve -> mở Process modal
   */
  const handleApprove = (request: EventRequest) => {
    setRequestToProcess(request)
    setProcessAction('APPROVE')
    setIsProcessModalOpen(true)
  }

  /**
   * Staff bấm Reject -> mở Process modal
   */
  const handleReject = (request: EventRequest) => {
    setRequestToProcess(request)
    setProcessAction('REJECT')
    setIsProcessModalOpen(true)
  }

  /**
   * handleProcessRequest:
   * - Nhận dữ liệu từ ProcessRequestModal (areaId + organizerNote)
   * - Gọi API process để approve/reject
   * - Thành công -> toast + reload list
   */
  const handleProcessRequest = async (areaId: number, organizerNote: string) => {
    if (!requestToProcess) return

    try {
      const token = localStorage.getItem('token')

      // payload gửi BE xử lý
      const payload = {
        requestId: requestToProcess.requestId,
        action: processAction, // APPROVE hoặc REJECT
        organizerNote: organizerNote,
        areaId: areaId,
      }
      console.log('Process payload:', payload)

      // Call API process
      const response = await fetch(
        'http://localhost:3000/api/event-requests/process',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      )

      if (response.ok) {
        // Thành công
        showToast(
          'success',
          processAction === 'APPROVE'
            ? 'Đã duyệt yêu cầu thành công!'
            : 'Đã từ chối yêu cầu.',
        )

        // Reload danh sách
        fetchEventRequests()
      } else {
        // Fail
        const errorData = await response.text()
        const errorMessage = errorData || 'Failed to process request'
        showToast('error', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error processing request:', error)
      showToast('error', 'Không thể xử lý yêu cầu. Vui lòng thử lại.')
    }
  }

  /**
   * Nếu user không phải STAFF hoặc ORGANIZER -> chặn truy cập
   */
  if (!isStaff && !isOrganizer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Bạn không có quyền truy cập trang này.</p>
        <Link to="/dashboard" className="text-blue-600 mt-4 inline-block">
          Quay lại Dashboard
        </Link>
      </div>
    )
  }

  /**
   * filteredRequests:
   * - Nếu đang ở tab waiting -> hiển thị waitingRequests
   * - Nếu tab processed -> hiển thị processedRequests
   */
  const filteredRequests =
    isStaff || isOrganizer
      ? activeTab === 'waiting'
        ? waitingRequests
        : processedRequests
      : requests

  // Count số request cho badge tab
  const waitingCount = waitingRequests.length
  const processedCount = processedRequests.length

  // ======================= UI RENDER =======================
  return (
    <div>
      {/* Header trang */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isStaff ? 'Quản lý yêu cầu sự kiện' : 'Yêu cầu sự kiện của tôi'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff
              ? 'Duyệt các yêu cầu tổ chức sự kiện do sinh viên gửi lên.'
              : 'Theo dõi các yêu cầu tổ chức sự kiện bạn đã gửi cho Ban tổ chức.'}
          </p>
        </div>

        {/* Organizer có thể tạo request mới */}
        {isOrganizer && (
          <Link
            to="/dashboard/event-requests/create"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Gửi yêu cầu mới
          </Link>
        )}
      </div>

      {/* Tabs chỉ áp dụng cho staff/organizer */}
      {(isStaff || isOrganizer) && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {/* Tab "Chờ" */}
              <button
                onClick={() => setActiveTab('waiting')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'waiting'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Chờ
                {/* Badge số lượng */}
                {waitingCount > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {waitingCount}
                  </span>
                )}
              </button>

              {/* Tab "Đã xử lý" */}
              <button
                onClick={() => setActiveTab('processed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'processed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đã xử lý
                {/* Badge số lượng */}
                {processedCount > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-800 text-xs font-medium">
                    {processedCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Loading / Error / Empty / Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchEventRequests}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <FileClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {(isStaff || isOrganizer) && activeTab === 'waiting'
              ? 'Không có yêu cầu đang chờ'
              : (isStaff || isOrganizer) && activeTab === 'processed'
              ? 'Chưa có yêu cầu nào được xử lý'
              : 'Hiện chưa có yêu cầu sự kiện nào'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {(isStaff || isOrganizer) && activeTab === 'waiting'
              ? 'Các yêu cầu đang chờ duyệt và chờ cập nhật thông tin sẽ hiển thị ở đây.'
              : (isStaff || isOrganizer) && activeTab === 'processed'
              ? 'Các yêu cầu đã hoàn thành hoặc bị từ chối sẽ hiển thị ở đây.'
              : 'Khi bạn gửi yêu cầu, dữ liệu sẽ xuất hiện tại đây.'}
          </p>
        </div>
      ) : (
        // Hiển thị bảng danh sách request
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>

                {/* Staff mới cần cột người gửi */}
                {isStaff && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người gửi
                  </th>
                )}

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày gửi
                </th>

                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>

                {/* Staff + tab waiting mới có cột thao tác */}
                {isStaff && activeTab === 'waiting' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr
                  key={req.requestId}
                  className="hover:bg-gray-50 cursor-pointer"
                  // Click cả row để mở modal detail
                  onClick={() => handleViewDetails(req)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.title}
                  </td>

                  {isStaff && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.requesterName || 'N/A'}
                    </td>
                  )}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleString('vi-VN')}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                        req.status,
                      )}`}
                    >
                      {getStatusLabel(req.status)}
                    </span>
                  </td>

                  {/* Staff + waiting tab: có nút duyệt/từ chối (chỉ khi PENDING) */}
                  {isStaff && activeTab === 'waiting' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {req.status === 'PENDING' && (
                        // stopPropagation để click nút không trigger click row (không mở modal)
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleApprove(req)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal xem chi tiết request */}
      <EventRequestDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
        userRole={user?.role}
        onEdit={handleEditEvent} // organizer sửa event khi UPDATING
      />

      {/* Modal duyệt/từ chối request */}
      <ProcessRequestModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSubmit={handleProcessRequest} // submit process gọi API
        action={processAction} // APPROVE / REJECT
        request={requestToProcess}
      />
    </div>
  )
}
