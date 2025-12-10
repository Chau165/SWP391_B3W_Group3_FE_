import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PaymentSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const [ticketId, setTicketId] = useState<string | null>(null)

  // Guard: only show success if VNPay response indicates success
  useEffect(() => {
    const vnpResponseCode = params.get('vnp_ResponseCode')
    const vnpTxnNo = params.get('vnp_TransactionNo')
    const ticket = params.get('ticketId')
    const status = params.get('status')

    // VNPay success code is "00". Anything else -> failed.
    const isSuccess = vnpResponseCode === '00' || status === 'success'
    if (!isSuccess) {
      navigate('/payment-failed' + location.search, { replace: true })
      return
    }

    // Optional: must have a transaction number or ticketId
    if (!vnpTxnNo && !ticket) {
      navigate('/payment-failed' + location.search, { replace: true })
      return
    }

    setTicketId(ticket)
  }, [location.search, navigate])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="bg-white rounded-lg shadow-md p-10 max-w-md text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán thành công
        </h1>
        <p className="text-gray-600 mb-4">
          Vé của bạn đã được tạo. Bạn có thể xem trong mục{' '}
          <span className="font-semibold">Vé của tôi</span>.
        </p>

        {ticketId && (
          <p className="text-sm text-gray-500 mb-4">
            Mã vé: <span className="font-mono">{ticketId}</span>
          </p>
        )}

        <div className="space-y-3">
          <Link
            to="/dashboard/my-tickets"
            className="block w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Xem vé của tôi
          </Link>
          <Link
            to="/dashboard"
            className="block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Về Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
