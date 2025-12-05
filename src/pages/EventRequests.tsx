import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CheckCircle2, XCircle, FileClock } from 'lucide-react'

type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type MockEventRequest = {
  id: string
  title: string
  studentName: string
  createdAt: string
  status: EventRequestStatus
}

// Temporary mock – replace with API later
const mockRequests: MockEventRequest[] = []

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
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'

  if (!isOrganizer) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Chỉ Event Organizer hoặc Staff mới có quyền xem danh sách yêu cầu
          sự kiện.
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
            Quản lý yêu cầu sự kiện
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Duyệt các yêu cầu tổ chức sự kiện do sinh viên gửi lên.
          </p>
        </div>
      </div>

      {mockRequests.length === 0 ? (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người gửi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày gửi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.studentName}
                  </td>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Duyệt
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100"
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      Từ chối
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


