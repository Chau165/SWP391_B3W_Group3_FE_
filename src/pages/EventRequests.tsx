import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle2, XCircle, FileClock, PlusCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { EventRequestDetailModal } from '../components/events/EventRequestDetailModal'
import { ProcessRequestModal } from '../components/events/ProcessRequestModal'

type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

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
  const [pendingRequests, setPendingRequests] = useState<EventRequest[]>([])
  const [processedRequests, setProcessedRequests] = useState<EventRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false)
  const [processAction, setProcessAction] = useState<'APPROVE' | 'REJECT'>('APPROVE')
  const [requestToProcess, setRequestToProcess] = useState<EventRequest | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending')

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
        
        // Handle new API structure: { pending: [], approved: [], rejected: [] }
        if (data.pending || data.approved || data.rejected) {
          const pending = Array.isArray(data.pending) ? data.pending : []
          const processed = [
            ...(Array.isArray(data.approved) ? data.approved : []),
            ...(Array.isArray(data.rejected) ? data.rejected : [])
          ]
          setPendingRequests(pending)
          setProcessedRequests(processed)
          setRequests([...pending, ...processed])
        } else if (Array.isArray(data)) {
          // Handle legacy flat array structure
          setRequests(data)
          setPendingRequests(data.filter(req => req.status === 'PENDING'))
          setProcessedRequests(data.filter(req => req.status === 'APPROVED' || req.status === 'REJECTED'))
        }
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

  // Filter requests based on active tab (only for staff)
  const filteredRequests = isStaff 
    ? activeTab === 'pending'
      ? pendingRequests
      : processedRequests
    : requests

  const pendingCount = pendingRequests.length
  const processedCount = processedRequests.length

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

      {/* Tabs for Staff */}
      {isStaff && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đang chờ duyệt
                {pendingCount > 0 && (
                  <span className="ml-2 py-0.5 px-2 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('processed')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'processed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đã xử lý
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
            {isStaff && activeTab === 'pending' 
              ? 'Không có yêu cầu đang chờ duyệt'
              : isStaff && activeTab === 'processed'
              ? 'Chưa có yêu cầu nào được xử lý'
              : 'Hiện chưa có yêu cầu sự kiện nào'
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {isStaff && activeTab === 'pending'
              ? 'Khi có yêu cầu mới, chúng sẽ xuất hiện tại đây.'
              : isStaff && activeTab === 'processed'
              ? 'Các yêu cầu đã duyệt hoặc từ chối sẽ hiển thị ở đây.'
              : 'Khi bạn gửi yêu cầu, dữ liệu sẽ xuất hiện tại đây.'
            }
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
                {isStaff && activeTab === 'pending' && (
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
                  {isStaff && activeTab === 'pending' && (
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

      <EventRequestDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        request={selectedRequest}
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

