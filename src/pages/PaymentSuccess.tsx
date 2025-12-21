// Import hook của React Router để:
// - useLocation: lấy URL hiện tại (bao gồm query string ?a=...)
// - useNavigate: điều hướng sang trang khác bằng code
import { useLocation, useNavigate } from 'react-router-dom'

// Import icon check thành công để hiển thị UI
import { CheckCircle2 } from 'lucide-react'

// Import hook của React:
// - useEffect: chạy side-effect khi component mount / khi dependency đổi
// - useState: lưu state (ở đây là ticketIds lấy từ query string)
import { useEffect, useState } from 'react'

// Component trang PaymentSuccess: hiển thị khi thanh toán VNPay thành công
export default function PaymentSuccess() {
  // Lấy thông tin location hiện tại (có location.search = "?status=success&ticketIds=...")
  const location = useLocation()

  // navigate dùng để chuyển trang (VD: /my-tickets, /, /payment-failed)
  const navigate = useNavigate()

  // State lưu mã vé trả về từ backend qua query params
  // ticketIds có thể là chuỗi "1,2,3" hoặc "ABC123", hoặc null nếu không có
  const [ticketIds, setTicketIds] = useState<string | null>(null)

  /**
   * useEffect: chạy mỗi khi query string thay đổi (location.search)
   * Mục tiêu:
   * - Đọc query params từ URL
   * - Kiểm tra status
   * - Lấy ticketIds/ticketId để hiển thị cho user
   *
   * Lý do cần đọc query params:
   * - Sau khi VNPay thanh toán xong, backend thường redirect về FE kèm query
   *   ví dụ: /payment-success?status=success&ticketIds=12,13
   */
  useEffect(() => {
    // Tạo object URLSearchParams để đọc query string dễ dàng
    // location.search là phần sau dấu "?" trong URL
    const params = new URLSearchParams(location.search)

    // Lấy param "status" từ URL (vd: success / failed / pending...)
    const status = params.get('status')

    /**
     * Nếu backend redirect về trang success nhưng status lại không phải "success"
     * -> coi như thất bại và chuyển user sang trang /payment-failed
     *
     * navigate('/payment-failed' + location.search):
     * - giữ nguyên query params để trang failed cũng đọc được thông tin
     *
     * { replace: true }:
     * - thay thế history entry hiện tại
     * - user bấm Back không quay lại success “bị sai status”
     */
    if (status && status !== 'success') {
      navigate('/payment-failed' + location.search, { replace: true })
      return // dừng effect
    }

    /**
     * Backend hiện tại gửi "ticketIds"
     * nhưng để tương thích trường hợp cũ hoặc khác backend,
     * ta fallback về "ticketId" nếu "ticketIds" không có
     *
     * Ví dụ:
     * - ticketIds=12,13,14 (nhiều vé)
     * - ticketId=12 (1 vé)
     */
    const ticketsParam = params.get('ticketIds') ?? params.get('ticketId')

    // Cập nhật state để UI hiển thị "Mã vé: ..."
    setTicketIds(ticketsParam)
  }, [location.search, navigate]) // dependency: chạy lại khi query string hoặc navigate thay đổi

  /**
   * ===================== RENDER UI =====================
   * Trang này hiển thị:
   * - Icon thành công
   * - Thông báo thanh toán thành công
   * - Nếu có ticketIds thì hiển thị mã vé
   * - 2 nút:
   *   + Xem Vé của tôi -> /my-tickets
   *   + Về Dashboard -> /
   */
  return (
    // Wrapper căn giữa cả trang (flex) và đặt chiều cao tối thiểu để đẹp UI
    <div className="flex items-center justify-center min-h-[400px]">
      {/* Card trắng để chứa nội dung */}
      <div className="bg-white rounded-lg shadow-md p-10 max-w-md text-center">
        {/* Icon check xanh biểu thị thành công */}
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />

        {/* Tiêu đề thông báo */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán thành công
        </h1>

        {/* Mô tả: vé đã được tạo và hướng dẫn user xem ở mục “Vé của tôi” */}
        <p className="text-gray-600 mb-4">
          Vé của bạn đã được tạo. Bạn có thể xem trong mục{' '}
          <span className="font-semibold">Vé của tôi</span>.
        </p>

        {/* 
          Conditional rendering:
          - Chỉ hiển thị đoạn “Mã vé” nếu ticketIds có giá trị (không null/empty)
          - Đây là thông tin backend trả về sau khi thanh toán
        */}
        {ticketIds && (
          <p className="text-sm text-gray-500 mb-4">
            Mã vé:{' '}
            {/* font-mono: hiển thị dạng mã code (đẹp/ dễ đọc) */}
            <span className="font-mono">{ticketIds}</span>
          </p>
        )}

        {/* Khối nút điều hướng */}
        <div className="space-y-3">
          {/* Nút đi tới trang danh sách vé của user */}
          <button
            onClick={() => navigate('/my-tickets')} // điều hướng tới /my-tickets
            className="block w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            Xem Vé của tôi
          </button>

          {/* Nút về Dashboard (ở đây bạn dùng route "/") */}
          <button
            onClick={() => navigate('/')} // điều hướng về trang dashboard/home
            className="block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
