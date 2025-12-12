import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PaymentSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const [ticketIds, setTicketIds] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)

    const status = params.get('status')
    // Nếu backend lỡ redirect kèm status khác "success" thì chuyển sang trang failed
    if (status && status !== 'success') {
      navigate('/payment-failed' + location.search, { replace: true })
      return
    }

    // BE hiện tại gửi ticketIds, fallback về ticketId nếu cần
    const ticketsParam = params.get('ticketIds') ?? params.get('ticketId')
    setTicketIds(ticketsParam)
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

        {ticketIds && (
          <p className="text-sm text-gray-500 mb-4">
            Mã vé:{' '}
            <span className="font-mono">
              {ticketIds}
            </span>
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate('/my-tickets')}
            className="block w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Xem Vé của tôi
          </button>
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
