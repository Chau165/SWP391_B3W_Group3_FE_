import { Link } from 'react-router-dom'
import { FileClock, PlusCircle } from 'lucide-react'

type EventRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type MockEventRequest = {
  id: string
  title: string
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

export default function MyEventRequests() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Yêu cầu sự kiện của tôi
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi các yêu cầu tổ chức sự kiện bạn đã gửi cho Ban tổ chức.
          </p>
        </div>
        <Link
          to="/dashboard/event-requests/create"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Gửi yêu cầu mới
        </Link>
      </div>

      {mockRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <FileClock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            Bạn chưa có yêu cầu sự kiện nào
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Hãy bắt đầu bằng cách gửi một yêu cầu tổ chức sự kiện mới.
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
                  Ngày gửi
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


