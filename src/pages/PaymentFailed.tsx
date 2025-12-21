// Import hook của React Router:
// - useLocation: dùng để đọc URL hiện tại (query params từ backend/VNPay redirect)
// - useNavigate: dùng để điều hướng user sang trang khác bằng code
import { useLocation, useNavigate } from 'react-router-dom'

// Import icon XCircle (dấu X đỏ) để biểu thị trạng thái thất bại
import { XCircle } from 'lucide-react'

// Component PaymentFailed: trang hiển thị khi thanh toán VNPay thất bại
export default function PaymentFailed() {
  // Lấy thông tin URL hiện tại (bao gồm query string)
  const location = useLocation()

  // Hook điều hướng trang (VD: về Dashboard)
  const navigate = useNavigate()

  /**
   * URLSearchParams:
   * - Dùng để parse query string trong URL
   * - location.search có dạng: "?vnp_ResponseCode=01&message=..."
   */
  const params = new URLSearchParams(location.search)

  /**
   * Lấy mã phản hồi từ VNPay
   * - vnp_ResponseCode: mã trạng thái thanh toán VNPay
   *   VD:
   *   - "00": thành công (thường không vào trang này)
   *   - "01": giao dịch chưa hoàn tất
   *   - "24": khách hàng hủy giao dịch
   *   - ...
   */
  const vnpResponseCode = params.get('vnp_ResponseCode')

  /**
   * Lấy thông điệp lỗi (message) từ query params
   *
   * Backend hoặc VNPay có thể gửi message với các key khác nhau,
   * nên ta lần lượt fallback:
   * 1) message
   * 2) reason
   * 3) vnp_Message
   *
   * → đảm bảo có thông tin hiển thị cho user
   */
  const vnpMessage =
    params.get('message') ||
    params.get('reason') ||
    params.get('vnp_Message')

  /**
   * ===================== RENDER UI =====================
   *
   * Trang này có nhiệm vụ:
   * - Thông báo thanh toán thất bại
   * - Hiển thị mã lỗi VNPay (nếu có)
   * - Hiển thị lý do lỗi (nếu có)
   * - Cho user quay về Dashboard
   */
  return (
    // Wrapper căn giữa nội dung cả chiều ngang và dọc
    <div className="flex items-center justify-center min-h-[400px]">
      {/* Card nền trắng hiển thị thông tin lỗi */}
      <div className="bg-white rounded-lg shadow-md p-10 max-w-md text-center">
        {/* Icon X đỏ biểu thị thất bại */}
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />

        {/* Tiêu đề */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Thanh toán thất bại
        </h1>

        {/* 
          Nội dung mô tả lỗi:
          - Nếu có vnp_ResponseCode → hiển thị mã lỗi VNPay
          - Nếu không có → hiển thị thông báo lỗi chung
          - Nếu có message → nối thêm lý do chi tiết
        */}
        <p className="text-gray-600 mb-6">
          {vnpResponseCode
            ? `Mã lỗi VNPay: ${vnpResponseCode}`
            : 'Đã xảy ra lỗi trong quá trình thanh toán.'}

          {/* Nếu có message thì nối thêm " - message" */}
          {vnpMessage ? ` - ${vnpMessage}` : ''}
        </p>

        {/* Khối nút hành động */}
        <div className="space-y-3">
          {/* Nút quay về Dashboard */}
          <button
            onClick={() => navigate('/')} // điều hướng về trang Dashboard/Home
            className="block w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
