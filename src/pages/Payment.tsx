import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type PaymentState = {
  eventId: number
  categoryTicketId: number
  seatIds?: number[]
  eventTitle?: string
  ticketName?: string
  ticketBreakdown?: Array<{ name: string; count: number; price: number }>
  seatCodes?: string[]
  rowNo?: string
  pricePerTicket?: number
  quantity?: number
  totalAmount?: number
}

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const state = (location.state || {}) as PaymentState

  const handlePay = () => {
    // Thiếu state → quay lại dashboard
    if (!state.eventId || !state.categoryTicketId || !state.seatIds || state.seatIds.length === 0) {
      alert('Thiếu thông tin vé, vui lòng chọn lại vé từ Dashboard.')
      navigate('/dashboard')
      return
    }

    const userId = (user as any)?.userId ?? (user as any)?.id
    if (!userId) {
      alert('Bạn cần đăng nhập trước khi thanh toán.')
      navigate('/login')
      return
    }

    const params = new URLSearchParams({
      userId: String(userId),
      eventId: String(state.eventId),
      categoryTicketId: String(state.categoryTicketId),
      seatIds: state.seatIds.join(','),
    })

    // Nhờ proxy Vite, /api/... → http://localhost:8084/FPTEventManagement/...
    const paymentUrl = `/api/payment-ticket?${params.toString()}`

    // 👉 Điều hướng toàn trang (không mở tab mới)
    window.location.replace(paymentUrl)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại Dashboard
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thanh toán vé</h1>
            <p className="text-sm text-gray-500">
              Xác nhận thông tin và tiến hành thanh toán qua VNPay.
            </p>
          </div>
        </div>

        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Thông tin vé
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            <p>
              Sự kiện:{' '}
              <span className="font-medium">
                {state.eventTitle || 'Sự kiện demo (mock)'}
              </span>
            </p>
            {state.ticketBreakdown && state.ticketBreakdown.length > 0 ? (
              <p>
                Loại vé:{' '}
                <span className="font-medium">
                  {state.ticketBreakdown.map((t, idx) => (
                    <span key={idx}>
                      {t.name} x{t.count}
                      {idx < state.ticketBreakdown!.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </span>
              </p>
            ) : state.ticketName ? (
              <p>
                Loại vé:{' '}
                <span className="font-medium">{state.ticketName}</span>
              </p>
            ) : null}
            {(state.rowNo || (state.seatCodes && state.seatCodes.length > 0)) && (
              <p>
                Vị trí ghế:{' '}
                <span className="font-medium">
                  {state.rowNo ? `Hàng ${state.rowNo}` : ''}
                  {state.rowNo && state.seatCodes && state.seatCodes.length > 0 ? ', ' : ''}
                  {state.seatCodes && state.seatCodes.length > 0 ? `Ghế ${state.seatCodes.join(', ')}` : ''}
                </span>
              </p>
            )}
            <p>
              Số tiền:{' '}
              <span className="font-semibold text-gray-900">
                {(state.totalAmount || state.pricePerTicket || 0).toLocaleString('vi-VN')} đ
              </span>
            </p>
            {state.quantity && state.pricePerTicket && (
              <p className="text-xs text-gray-500">
                {state.quantity} x {(state.pricePerTicket).toLocaleString('vi-VN')} đ
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>VNPay (Internet Banking / Thẻ)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePay}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Thanh toán qua VNPay
          </button>

          <p className="text-xs text-gray-400 text-center">
            Khi bấm &quot;Thanh toán qua VNPay&quot;, bạn sẽ được chuyển sang
            cổng thanh toán VNPay để hoàn tất giao dịch.
          </p>
        </div>
      </div>
    </div>
  )
}
