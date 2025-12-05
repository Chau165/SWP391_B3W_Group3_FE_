import { Link } from 'react-router-dom'
import { FileText, CreditCard, Eye } from 'lucide-react'

type MockBill = {
  id: string
  createdAt: string
  totalAmount: number
  status: 'PENDING' | 'PAID' | 'CANCELED'
}

// Temporary mock data – replace with API later
const mockBills: MockBill[] = []

export default function MyBills() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hóa đơn của tôi</h1>
        <div className="flex items-center text-sm text-gray-500">
          <FileText className="w-4 h-4 mr-2" />
          Quản lý hóa đơn thanh toán vé sự kiện
        </div>
      </div>

      {mockBills.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Bạn chưa có hóa đơn nào</p>
          <p className="text-sm text-gray-400 mt-2">
            Khi bạn mua vé sự kiện, hóa đơn sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã hóa đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số tiền
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockBills.map(bill => (
                <tr key={bill.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{bill.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {bill.totalAmount.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        bill.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <CreditCard className="w-3 h-3 mr-1" />
                      {bill.status === 'PAID'
                        ? 'Đã thanh toán'
                        : bill.status === 'PENDING'
                        ? 'Chờ thanh toán'
                        : 'Đã hủy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <Link
                      to={`/dashboard/bills/${bill.id}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </Link>
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


