import { useLocation, useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

export default function PaymentFailed() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)

  const vnpResponseCode = params.get('vnp_ResponseCode')
  const vnpMessage =
    params.get('message') ||
    params.get('reason') ||
    params.get('vnp_Message')

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-lg shadow-md p-10 max-w-md text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán thất bại
        </h1>
        <p className="text-gray-600 mb-6">
          {vnpResponseCode
            ? `Mã lỗi VNPay: ${vnpResponseCode}`
            : 'Đã xảy ra lỗi trong quá trình thanh toán.'}
          {vnpMessage ? ` - ${vnpMessage}` : ''}
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
