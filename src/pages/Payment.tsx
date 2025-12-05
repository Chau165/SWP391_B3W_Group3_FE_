import { useNavigate, useLocation } from 'react-router-dom'
import { CreditCard, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type PaymentState = {
  eventTitle?: string
  ticketName?: string
  seatCode?: string
  price?: number
}

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state || {}) as PaymentState

  const handlePay = () => {
    // Mock payment – replace with real gateway later
    const isSuccess = true
    if (isSuccess) {
      navigate('/dashboard/payment/success')
    } else {
      navigate('/dashboard/payment/failed')
    }
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
              Xác nhận thông tin và tiến hành thanh toán.
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
            {state.ticketName && (
              <p>
                Loại vé:{' '}
                <span className="font-medium">{state.ticketName}</span>
              </p>
            )}
            {state.seatCode && (
              <p>
                Ghế:{' '}
                <span className="font-medium">{state.seatCode}</span>
              </p>
            )}
            <p>
              Số tiền:{' '}
              <span className="font-semibold text-gray-900">
                {(state.price || 0).toLocaleString('vi-VN')} đ
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán (mock)
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Thẻ ngân hàng</option>
              <option>Ví điện tử</option>
              <option>Tiền mặt tại quầy</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handlePay}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Thanh toán (mock)
          </button>

          <p className="text-xs text-gray-400 text-center">
            Đây chỉ là màn hình mô phỏng thanh toán cho đồ án. Khi tích hợp
            backend, hãy thay bằng cổng thanh toán thực tế (VNPay, MoMo,...).
          </p>
        </div>
      </div>
    </div>
  )
}


