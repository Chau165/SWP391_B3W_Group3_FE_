import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle2, XCircle, FileClock, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EventDetailModal } from '../components/events/EventDetailModal'
import { ProcessRequestModal } from '../components/events/ProcessRequestModal'
import type { EventDetail } from '../types/event'

type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type EventRequest = {
  requestId: number
  title: string
  description?: string
  reason?: string
  preferredStartTime?: string
  preferredEndTime?: string
  expectedParticipants?: number
  bannerUrl?: string
  studentName?: string
  createdAt: string
  status: EventRequestStatus
  createdEventId?: number
}

const getStatusLabel = (status: EventRequestStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'Đã duyệt'
    case 'REJECTED':
      return 'Bị từ chối'
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
    default:
      return 'bg-yellow-100 text-yellow-800'
  }
}

export default function EventRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isStaff = user?.role === 'STAFF'
  const isOrganizer = user?.role === 'ORGANIZER'
  const [requests, setRequests] = useState<EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [requestToProcess, setRequestToProcess] = useState<EventRequest | null>(null)

  useEffect(() => {
    fetchEventRequests()
  }, [isStaff, isOrganizer])

  const fetchEventRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      // Staff sees all requests, Organizer sees only their own
      const endpoint = isStaff 
        ? 'http://localhost:3000/api/staff/event-requests'
        : 'http://localhost:3000/api/event-requests/my'
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Event requests data:', data)
        console.log('First request:', data[0])
        setRequests(data)
      } else {
        throw new Error('Failed to fetch event requests')
      }
    } catch (error) {
      console.error('Error fetching event requests:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch event requests')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (request: EventRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRequest(null)
  }

  const handleEditEvent = () => {
    if (!selectedRequest) return
    
    // For approved events, use createdEventId; otherwise use requestId
    const eventId = selectedRequest.status === 'APPROVED' && selectedRequest.createdEventId 
      ? selectedRequest.createdEventId 
      : selectedRequest.requestId
    
    navigate(`/dashboard/events/${eventId}/edit`)
  }

  const handleApprove = (request: EventRequest) => {
    setRequestToProcess(request)
    setProcessAction('APPROVE')
    setIsProcessModalOpen(true)
  }

  const handleReject = (request: EventRequest) => {
    setRequestToProcess(request)
    setProcessAction('REJECT')
    setIsProcessModalOpen(true)
  }

  const handleProcessRequest = async (areaId: number, organizerNote: string) => {
    if (!requestToProcess) return

    try {
      const token = localStorage.getItem('token')
      const payload = {
        requestId: requestToProcess.requestId,
        action: processAction,
        organizerNote: organizerNote,
        areaId: areaId
      }
      console.log('Process payload:', payload)
      
      const response = await fetch('http://localhost:3000/api/event-requests/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert(processAction === 'APPROVE' ? 'Đã duyệt yêu cầu thành công!' : 'Đã từ chối yêu cầu.')
        fetchEventRequests()
      } else {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to process request')
      }
    } catch (error) {
      console.error('Error processing request:', error)
      alert('Không thể xử lý yêu cầu. Vui lòng thử lại.')
    }
  }

  // Convert EventRequest to EventDetail format for modal
  const convertToEventDetail = (request: EventRequest): EventDetail | null => {
    if (!request) return null
    
    return {
      eventId: request.requestId,
      title: request.title,
      description: request.description || 'Chưa có mô tả',
      startTime: request.preferredStartTime || new Date().toISOString(),
      endTime: request.preferredEndTime || new Date().toISOString(),
      location: 'Chưa xác định',
      maxSeats: request.expectedParticipants || 0,
      currentParticipants: 0,
      status: request.status,
      bannerUrl: request.bannerUrl || null,
      tickets: [],
      areaId: undefined,
    } as EventDetail
  }

  if (!isStaff && !isOrganizer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Bạn không có quyền truy cập trang này.
        </p>
        <Link to="/dashboard" className="text-blue-600 mt-4 inline-block">
          Quay lại Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isStaff ? 'Quản lý yêu cầu sự kiện' : 'Yêu cầu sự kiện của tôi'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isStaff 
              ? 'Duyệt các yêu cầu tổ chức sự kiện do sinh viên gửi lên.'
              : 'Theo dõi các yêu cầu tổ chức sự kiện bạn đã gửi cho Ban tổ chức.'
            }
          </p>
        </div>
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
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <FileClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Hiện chưa có yêu cầu sự kiện nào
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Khi sinh viên gửi yêu cầu, dữ liệu sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tiêu đề
                </th>
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
                {isStaff && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr 
                  key={req.requestId} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewDetails(req)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  {isStaff && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {req.studentName}
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
                  {isStaff && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {req.status === 'PENDING' && (
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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

      <EventDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        event={convertToEventDetail(selectedRequest!)}
        loading={false}
        error={null}
        token={localStorage.getItem('token')}
        userRole={user?.role}
        onEdit={handleEditEvent}
      />

      <ProcessRequestModal
        isOpen={isProcessModalOpen}
        onClose={() => setIsProcessModalOpen(false)}
        onSubmit={handleProcessRequest}
        action={processAction}
        request={requestToProcess}
      />
    </div>
  )
}

