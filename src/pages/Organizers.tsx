import { UserCircle2, PlusCircle } from 'lucide-react'

type MockOrganizer = {
  id: string
  name: string
  email: string
  totalEvents: number
}

// Temporary mock – replace with API later
const mockOrganizers: MockOrganizer[] = []

export default function Organizers() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Organizer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các đơn vị / cá nhân tổ chức sự kiện.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Thêm Organizer (mock)
        </button>
      </div>

      {mockOrganizers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <UserCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Chưa có Organizer nào</p>
          <p className="text-sm text-gray-400 mt-2">
            Khi bạn thêm Organizer hoặc kết nối API, danh sách sẽ hiển thị tại
            đây.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số sự kiện đã tạo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockOrganizers.map(org => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {org.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {org.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                    {org.totalEvents}
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


