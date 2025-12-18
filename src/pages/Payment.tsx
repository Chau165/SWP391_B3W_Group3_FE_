/**
 * =============================================================================
 * PAYMENT PAGE - Trang thanh toán vé sự kiện qua VNPay
 * =============================================================================
 * 
 * Mô tả: Trang này hiển thị thông tin vé đã chọn và cho phép người dùng
 *        tiến hành thanh toán thông qua cổng VNPay.
 * 
 * Flow hoạt động:
 * 1. User chọn vé từ trang EventDetail → navigate đến /dashboard/payment với state
 * 2. Trang Payment hiển thị thông tin vé từ location.state
 * 3. User bấm "Thanh toán" → redirect sang Backend API
 * 4. Backend tạo URL VNPay với checksum → redirect user sang VNPay
 * 5. User thanh toán xong → VNPay callback về /payment-success hoặc /payment-failed
 * 
 * Author: Group 3 - SWP391
 * =============================================================================
 */

// ======================== IMPORTS ========================
import { useNavigate, useLocation } from 'react-router-dom'
// useNavigate: Hook để điều hướng programmatically trong React Router
// useLocation: Hook để lấy thông tin URL hiện tại và state được truyền từ trang trước

import { CreditCard, ArrowLeft } from 'lucide-react'
// Icons từ thư viện Lucide React cho UI

import { Link } from 'react-router-dom'
// Component Link để tạo navigation links

import { useAuth } from '../contexts/AuthContext'
// Custom hook để lấy thông tin user đang đăng nhập từ AuthContext

// ======================== TYPE DEFINITIONS ========================
/**
 * PaymentState - Định nghĩa cấu trúc dữ liệu được truyền từ trang chọn vé
 * 
 * Dữ liệu này được truyền qua location.state khi navigate từ EventDetail
 */
type PaymentState = {
  eventId: number              // ID của sự kiện (bắt buộc)
  categoryTicketId: number     // ID loại vé đã chọn (bắt buộc)
  seatIds?: number[]           // Mảng ID các ghế đã chọn
  eventTitle?: string          // Tên sự kiện (hiển thị UI)
  ticketName?: string          // Tên loại vé (hiển thị UI)
  ticketBreakdown?: Array<{    // Chi tiết từng loại vé (nếu chọn nhiều loại)
    name: string               // Tên loại vé
    count: number              // Số lượng
    price: number              // Giá mỗi vé
  }>
  seatCodes?: string[]         // Mã ghế (VD: "A1", "A2") - hiển thị UI
  rowNo?: string               // Số hàng ghế
  pricePerTicket?: number      // Giá mỗi vé
  quantity?: number            // Số lượng vé
  totalAmount?: number         // Tổng tiền thanh toán
}

// ======================== MAIN COMPONENT ========================
export default function Payment() {
  // -------------------- HOOKS --------------------
  const navigate = useNavigate()   // Hook điều hướng
  const location = useLocation()   // Hook lấy location object (chứa state)
  const { user } = useAuth()       // Lấy thông tin user từ AuthContext

  // -------------------- LẤY DỮ LIỆU TỪ STATE --------------------
  /**
   * Lấy state được truyền từ trang trước (EventDetail)
   * Nếu không có state (user truy cập trực tiếp URL) → state = {}
   * Type assertion để TypeScript hiểu kiểu dữ liệu
   */
  const state = (location.state || {}) as PaymentState

  // -------------------- XỬ LÝ THANH TOÁN --------------------
  /**
   * handlePay - Xử lý khi user bấm nút "Thanh toán qua VNPay"
   * 
   * Flow:
   * 1. Validate dữ liệu (eventId, categoryTicketId, seatIds)
   * 2. Kiểm tra user đã đăng nhập chưa
   * 3. Tạo URL với query params
   * 4. Redirect toàn trang sang Backend API
   */
  const handlePay = () => {
    // ===== BƯỚC 1: VALIDATE DỮ LIỆU VÉ =====
    // Kiểm tra các thông tin bắt buộc có tồn tại không
    if (!state.eventId || !state.categoryTicketId || !state.seatIds || state.seatIds.length === 0) {
      alert('Thiếu thông tin vé, vui lòng chọn lại vé từ Dashboard.')
      navigate('/dashboard')  // Redirect về dashboard để chọn lại
      return
    }

    // ===== BƯỚC 2: KIỂM TRA ĐĂNG NHẬP =====
    // Lấy userId từ user object (có thể là userId hoặc id tùy API response)
    // Dùng nullish coalescing (??) để fallback
    const userId = (user as any)?.userId ?? (user as any)?.id
    if (!userId) {
      alert('Bạn cần đăng nhập trước khi thanh toán.')
      navigate('/login')  // Redirect về trang login
      return
    }

    // ===== BƯỚC 3: TẠO URL VỚI QUERY PARAMS =====
    /**
     * URLSearchParams - API chuẩn của JavaScript để tạo query string
     * Tự động encode các giá trị đặc biệt (space, &, =, ...)
     */
    const params = new URLSearchParams({
      userId: String(userId),                    // ID người dùng
      eventId: String(state.eventId),            // ID sự kiện
      categoryTicketId: String(state.categoryTicketId),  // ID loại vé
      seatIds: state.seatIds.join(','),          // Danh sách ID ghế, ngăn cách bởi dấu phẩy
    })

    /**
     * URL API thanh toán
     * 
     * Lưu ý: Dùng /api/... thay vì URL đầy đủ
     * → Vite proxy sẽ forward request đến Backend (localhost:8084)
     * → Tránh lỗi CORS khi development
     * 
     * Config proxy trong vite.config.ts:
     * '/api': { target: 'http://localhost:8084/FPTEventManagement', ... }
     */
    const paymentUrl = `/api/payment-ticket?${params.toString()}`

    // ===== BƯỚC 4: REDIRECT SANG BACKEND =====
    /**
     * window.location.replace() thay vì navigate()
     * 
     * Lý do: 
     * - navigate() chỉ hoạt động trong SPA (Single Page App)
     * - Backend sẽ redirect tiếp sang VNPay (external URL)
     * - Cần full page navigation, không phải client-side routing
     * 
     * replace() vs assign():
     * - replace(): Không lưu vào history (user không back được về trang này)
     * - assign(): Lưu vào history (user có thể back)
     * → Dùng replace() vì không muốn user back về trang payment sau khi thanh toán
     */
    window.location.replace(paymentUrl)
  }

  // ======================== RENDER UI ========================
  return (
    <div className="max-w-2xl mx-auto">
      {/* -------------------- NÚT QUAY LẠI -------------------- */}
      {/* Link component từ React Router - không reload trang */}
      <Link
        to="/dashboard"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại Dashboard
      </Link>

      {/* -------------------- CARD CHÍNH -------------------- */}
      <div className="bg-white rounded-lg shadow-md p-8">
        
        {/* ========== HEADER ========== */}
        <div className="flex items-center mb-6">
          {/* Icon thanh toán */}
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

        {/* ========== THÔNG TIN VÉ ========== */}
        {/* Hiển thị chi tiết vé được truyền từ state */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Thông tin vé
          </h2>
          <div className="space-y-1 text-sm text-gray-600">
            
            {/* ----- Tên sự kiện ----- */}
            <p>
              Sự kiện:{' '}
              <span className="font-medium">
                {/* Fallback nếu không có eventTitle */}
                {state.eventTitle || 'Sự kiện demo (mock)'}
              </span>
            </p>

            {/* ----- Loại vé ----- */}
            {/* 
              Conditional rendering:
              - Nếu có ticketBreakdown (nhiều loại vé) → hiển thị từng loại
              - Nếu chỉ có ticketName (1 loại vé) → hiển thị tên
              - Không có gì → không render
            */}
            {state.ticketBreakdown && state.ticketBreakdown.length > 0 ? (
              <p>
                Loại vé:{' '}
                <span className="font-medium">
                  {/* Map qua từng loại vé và hiển thị: "Tên x Số lượng" */}
                  {state.ticketBreakdown.map((t, idx) => (
                    <span key={idx}>
                      {t.name} x{t.count}
                      {/* Thêm dấu phẩy nếu không phải item cuối */}
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

            {/* ----- Vị trí ghế ----- */}
            {/* Chỉ hiển thị nếu có rowNo hoặc seatCodes */}
            {(state.rowNo || (state.seatCodes && state.seatCodes.length > 0)) && (
              <p>
                Vị trí ghế:{' '}
                <span className="font-medium">
                  {/* Hiển thị hàng nếu có */}
                  {state.rowNo ? `Hàng ${state.rowNo}` : ''}
                  {/* Thêm dấu phẩy nếu có cả hàng và ghế */}
                  {state.rowNo && state.seatCodes && state.seatCodes.length > 0 ? ', ' : ''}
                  {/* Hiển thị danh sách ghế, ngăn cách bởi dấu phẩy */}
                  {state.seatCodes && state.seatCodes.length > 0 ? `Ghế ${state.seatCodes.join(', ')}` : ''}
                </span>
              </p>
            )}

            {/* ----- Số tiền ----- */}
            <p>
              Số tiền:{' '}
              <span className="font-semibold text-gray-900">
                {/* 
                  toLocaleString('vi-VN'): Format số theo định dạng Việt Nam
                  Ví dụ: 1000000 → "1.000.000"
                  Fallback: totalAmount → pricePerTicket → 0
                */}
                {(state.totalAmount || state.pricePerTicket || 0).toLocaleString('vi-VN')} đ
              </span>
            </p>

            {/* ----- Chi tiết tính tiền (nếu có) ----- */}
            {/* Hiển thị: "Số lượng x Giá mỗi vé" */}
            {state.quantity && state.pricePerTicket && (
              <p className="text-xs text-gray-500">
                {state.quantity} x {(state.pricePerTicket).toLocaleString('vi-VN')} đ
              </p>
            )}
          </div>
        </div>

        {/* ========== PHƯƠNG THỨC THANH TOÁN & NÚT BẤM ========== */}
        <div className="space-y-4">
          
          {/* ----- Dropdown chọn phương thức ----- */}
          {/* 
            Hiện tại chỉ có VNPay, nhưng dùng dropdown để dễ mở rộng
            (thêm Momo, ZaloPay, ... sau này)
          */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>VNPay (Internet Banking / Thẻ)</option>
            </select>
          </div>

          {/* ----- Nút thanh toán ----- */}
          {/* 
            type="button": Tránh submit form (nếu nằm trong form)
            onClick={handlePay}: Gọi hàm xử lý thanh toán
          */}
          <button
            type="button"
            onClick={handlePay}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Thanh toán qua VNPay
          </button>

          {/* ----- Ghi chú ----- */}
          {/* &quot; là HTML entity cho dấu ngoặc kép " (tránh lỗi JSX) */}
          <p className="text-xs text-gray-400 text-center">
            Khi bấm &quot;Thanh toán qua VNPay&quot;, bạn sẽ được chuyển sang
            cổng thanh toán VNPay để hoàn tất giao dịch.
          </p>
        </div>
      </div>
    </div>
  )
}

// ======================== END OF FILE ========================
