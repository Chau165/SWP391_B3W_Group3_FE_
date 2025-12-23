/**
 * =============================================================================
 * PAYMENT PAGE - Trang thanh toán vé sự kiện qua VNPay
 * =============================================================================
 *
 * Mô tả:
 * - Trang này nhận dữ liệu vé đã chọn từ trang trước (EventDetail / Dashboard)
 * - Hiển thị thông tin vé cho user kiểm tra lại
 * - Khi bấm “Thanh toán qua VNPay” → redirect sang Backend
 * - Backend tạo URL VNPay (có checksum) → đưa user sang VNPay thanh toán
 * - VNPay xong sẽ callback/redirect về trang success hoặc failed
 *
 * Flow hoạt động:
1.Student vào EventDetail.tsx → chọn ghế trong SeatGrid
2.Bấm mua/tiếp tục → navigate('/dashboard/payment', { state: {...} }) truyền eventId, categoryTicketId, seatIds, thông tin hiển thị
3.Trang Payment.tsx đọc location.state → hiển thị xác nhận → bấm “Thanh toán”
4.Payment tạo query params và redirect full page sang backend: /api/payment-ticket?...
5.Backend validate seat/event/ticket + tạo VNPay payment URL + ký vnp_SecureHash → redirect user sang VNPay
6.VNPay xử lý xong → redirect về backend ReturnURL/IPN → backend verify chữ ký + check vnp_ResponseCode
Backend cập nhật đơn/vé → redirect về FE PaymentSuccess hoặc PaymentFailed (kèm query params như status, ticketIds, vnp_ResponseCode…)
 *
 * Author: Group 3 - SWP391
 * =============================================================================
 */

// ======================== IMPORTS ========================

// Import hook điều hướng và đọc state của React Router
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
// useNavigate: Hook để điều hướng programmatically (bằng code) trong React Router
// useLocation: Hook để lấy thông tin URL hiện tại + state truyền từ trang trước

// Import icon để trang đẹp hơn
import { CreditCard, ArrowLeft } from 'lucide-react'
// CreditCard: icon thẻ/ thanh toán
// ArrowLeft: icon mũi tên quay lại

// Import Link để tạo link chuyển trang không reload
import { Link } from 'react-router-dom'
// Link: chuyển route trong SPA (Single Page App) mà không reload toàn trang

// Import AuthContext để lấy user đang đăng nhập
import { useAuth } from '../contexts/AuthContext'
// useAuth: custom hook lấy user (thông tin đăng nhập) từ context toàn app

// ======================== TYPE DEFINITIONS ========================

/**
 * PaymentState - Định nghĩa cấu trúc dữ liệu được truyền từ trang chọn vé
 *
 * Dữ liệu này được truyền qua location.state khi navigate từ EventDetail/Dashboard.
 * Mục tiêu: giúp trang Payment biết user chọn vé nào, ghế nào, tiền bao nhiêu...
 */
type PaymentState = {
  eventId: number // ID của sự kiện (bắt buộc)
  categoryTicketId: number // ID loại vé đã chọn (bắt buộc)

  seatIds?: number[] // Mảng ID các ghế đã chọn (bắt buộc nếu vé có ghế)
  eventTitle?: string // Tên sự kiện (để hiển thị)
  ticketName?: string // Tên loại vé (để hiển thị)

  ticketBreakdown?: Array<{
    // Chi tiết từng loại vé nếu user chọn nhiều loại
    name: string // tên loại vé
    count: number // số lượng vé loại đó
    price: number // giá 1 vé loại đó
  }>

  seatCodes?: string[] // Mã ghế hiển thị (A1, A2, ...)
  rowNo?: string // số hàng ghế hiển thị

  pricePerTicket?: number // giá mỗi vé (để hiển thị)
  quantity?: number // số lượng vé (để hiển thị)
  totalAmount?: number // tổng tiền (để hiển thị)
}

// ======================== MAIN COMPONENT ========================

export default function Payment() {
  // -------------------- HOOKS --------------------

  // navigate dùng để chuyển trang bằng code (vd: về dashboard, sang login...)
  const navigate = useNavigate()

  // location chứa thông tin route hiện tại, bao gồm location.state từ trang trước
  // nếu copy url trực tiếp thì location.state sẽ undefined nên frontend sẽ detect 
  // thiếu dữ liệu và điều hướng về Dashboard để chọn lại vé.
  const location = useLocation()

  // lấy user + token từ AuthContext (user/token có thể null nếu chưa đăng nhập)
  const { user, token } = useAuth()

  // -------------------- LẤY DỮ LIỆU TỪ STATE --------------------

  /**
   * state: chính là dữ liệu vé được trang trước truyền sang.
   *
   * Nếu user truy cập thẳng URL /dashboard/payment (không đi từ flow chọn vé)
   * thì location.state sẽ undefined → fallback {} để tránh crash.
   *
   * "as PaymentState": type assertion để TypeScript hiểu biến state theo kiểu PaymentState.
   */
  const state = (location.state || {}) as PaymentState

  // payment method: 'vnpay' or 'wallet'
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'wallet'>('vnpay')

  // -------------------- XỬ LÝ THANH TOÁN --------------------

  /**
   * handlePay - chạy khi user bấm nút “Thanh toán qua VNPay”
   *
   * Nhiệm vụ:
   * 1) Validate dữ liệu bắt buộc (eventId, categoryTicketId, seatIds)
   * 2) Check login: lấy userId để backend biết ai đang mua
   * 3) Tạo query params
   * 4) Redirect full page sang backend endpoint tạo thanh toán
   */
  const handlePay = () => {
    // ===== BƯỚC 1: VALIDATE DỮ LIỆU VÉ =====

    // Nếu thiếu eventId/categoryTicketId hoặc không có seatIds → báo lỗi + về dashboard
    // (tùy nghiệp vụ: nếu vé không có ghế thì seatIds có thể không bắt buộc, nhưng code hiện tại đang bắt buộc)
    if (
      !state.eventId ||
      !state.categoryTicketId ||
      !state.seatIds ||
      state.seatIds.length === 0
    ) {
      // alert: popup thông báo nhanh cho user
      alert('Thiếu thông tin vé, vui lòng chọn lại vé từ Dashboard.')

      // chuyển về /dashboard để user chọn lại vé
      navigate('/dashboard')
      return // dừng hàm tại đây
    }

    // ===== BƯỚC 2: KIỂM TRA ĐĂNG NHẬP =====

    /**
     * Lấy userId từ object user:
     * - Một số backend trả user.userId
     * - Một số backend trả user.id
     * -> dùng ?? để fallback nếu userId undefined/null thì lấy id
     */
    const userId = (user as any)?.userId ?? (user as any)?.id

    // Nếu không có userId → user chưa login hoặc context chưa có user
    if (!userId) {
      alert('Bạn cần đăng nhập trước khi thanh toán.')

      // điều hướng sang trang login
      navigate('/login')
      return
    }

    // ===== BƯỚC 3: TẠO URL VỚI QUERY PARAMS =====

    /**
     * URLSearchParams:
     * - Tạo query string chuẩn: key=value&key2=value2...
     * - Tự encode các ký tự đặc biệt (space, &, =,...)
     *
     * Mục tiêu: gửi dữ liệu cần thiết cho backend tạo đơn thanh toán VNPay
     */
    const params = new URLSearchParams({
      userId: String(userId), // ép về string để URLSearchParams nhận
      eventId: String(state.eventId),
      categoryTicketId: String(state.categoryTicketId),

      // seatIds: mảng id ghế → join thành chuỗi "1,2,3"
      seatIds: state.seatIds.join(','),
    })

    /**
     * paymentUrl:
     * - Gọi vào endpoint backend (thông qua proxy /api)
     * - Vite proxy sẽ chuyển /api/payment-ticket sang backend thật
     * - Tránh CORS khi dev
     */
    const paymentUrl = `/api/payment-ticket?${params.toString()}`

    // ===== BƯỚC 4: REDIRECT SANG BACKEND =====

    /**
     * window.location.replace(paymentUrl):
     * - Điều hướng “toàn trang” (full page navigation)
     * - Cần vì backend sẽ redirect sang VNPay (domain ngoài)
     *
     * replace() khác assign():
     * - replace(): không lưu history (user bấm back không quay lại payment dễ gây lỗi)
     * - assign(): có lưu history
     */
    window.location.replace(paymentUrl)
  }

  // Handle wallet payment: submit a POST form so browser will follow backend redirect
  const handleWalletPay = () => {
    if (
      !state.eventId ||
      !state.categoryTicketId ||
      !state.seatIds ||
      state.seatIds.length === 0
    ) {
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

    const params: Record<string, string> = {
      userId: String(userId),
      eventId: String(state.eventId),
      seatIds: state.seatIds.join(','),
    }

    // create form and submit (full page POST) so backend can redirect to FE success
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/wallet/pay-ticket'
    form.style.display = 'none'

    Object.entries(params).forEach(([k, v]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = k
      input.value = v
      form.appendChild(input)
    })

    // include token (if available) so backend filters that expect a token can validate
    const savedToken = token ?? localStorage.getItem('token')
    if (savedToken) {
      const t1 = document.createElement('input')
      t1.type = 'hidden'
      t1.name = 'token'
      t1.value = savedToken
      form.appendChild(t1)

      const t2 = document.createElement('input')
      t2.type = 'hidden'
      t2.name = 'authorization'
      t2.value = `Bearer ${savedToken}`
      form.appendChild(t2)
    }

    document.body.appendChild(form)
    form.submit()
  }

  // ======================== RENDER UI ========================

  return (
    // Container căn giữa, giới hạn độ rộng
    <div className="max-w-2xl mx-auto">
      {/* -------------------- NÚT QUAY LẠI -------------------- */}
      {/* Link về dashboard, chuyển trang trong SPA, không reload */}
      <Link
        to="/dashboard" // route dashboard
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        {/* Icon mũi tên */}
        <ArrowLeft className="w-4 h-4 mr-2" />
        {/* Text */}
        Quay lại Dashboard
      </Link>

      {/* -------------------- CARD CHÍNH -------------------- */}
      {/* Card nền trắng + shadow */}
      <div className="bg-white rounded-lg shadow-md p-8">
        {/* ========== HEADER ========== */}
        <div className="flex items-center mb-6">
          {/* Icon tròn xanh nhạt */}
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <CreditCard className="w-5 h-5 text-blue-600" />
          </div>

          {/* Tiêu đề + mô tả */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thanh toán vé</h1>
            <p className="text-sm text-gray-500">
              Xác nhận thông tin và tiến hành thanh toán qua VNPay.
            </p>
          </div>
        </div>

        {/* ========== THÔNG TIN VÉ ========== */}
        {/* Box hiển thị thông tin vé để user xác nhận trước khi trả tiền */}
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            Thông tin vé
          </h2>

          {/* Danh sách thông tin vé */}
          <div className="space-y-1 text-sm text-gray-600">
            {/* ----- Tên sự kiện ----- */}
            <p>
              Sự kiện:{' '}
              <span className="font-medium">
                {/* Nếu state.eventTitle không có thì hiển thị fallback */}
                {state.eventTitle || 'Sự kiện demo (mock)'}
              </span>
            </p>

            {/* ----- Loại vé ----- */}
            {/* 
              Conditional rendering:
              - Nếu có ticketBreakdown (nhiều loại vé) → hiển thị từng loại
              - Nếu chỉ có ticketName → hiển thị tên 1 loại
              - Nếu không có gì → không render
            */}
            {state.ticketBreakdown && state.ticketBreakdown.length > 0 ? (
              <p>
                Loại vé:{' '}
                <span className="font-medium">
                  {/* Duyệt qua từng loại vé và hiển thị: "Tên x Số lượng" */}
                  {state.ticketBreakdown.map((t, idx) => (
                    <span key={idx}>
                      {t.name} x{t.count}
                      {/* Nếu chưa phải item cuối → thêm dấu phẩy */}
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
            {(state.rowNo ||
              (state.seatCodes && state.seatCodes.length > 0)) && (
              <p>
                Vị trí ghế:{' '}
                <span className="font-medium">
                  {/* Nếu có rowNo thì hiển thị "Hàng X" */}
                  {state.rowNo ? `Hàng ${state.rowNo}` : ''}

                  {/* Nếu có cả hàng và ghế thì thêm dấu phẩy ngăn cách */}
                  {state.rowNo &&
                  state.seatCodes &&
                  state.seatCodes.length > 0
                    ? ', '
                    : ''}

                  {/* Nếu có seatCodes thì hiển thị "Ghế A1, A2" */}
                  {state.seatCodes && state.seatCodes.length > 0
                    ? `Ghế ${state.seatCodes.join(', ')}`
                    : ''}
                </span>
              </p>
            )}

            {/* ----- Số tiền ----- */}
            <p>
              Số tiền:{' '}
              <span className="font-semibold text-gray-900">
                {/*
                  toLocaleString('vi-VN'): format số theo chuẩn VN
                  Ví dụ: 1000000 → "1.000.000"
                  Fallback: ưu tiên totalAmount, nếu không có thì dùng pricePerTicket, nếu vẫn không có thì 0
                */}
                {(state.totalAmount || state.pricePerTicket || 0).toLocaleString(
                  'vi-VN',
                )}{' '}
                đ
              </span>
            </p>

            {/* ----- Chi tiết tính tiền (nếu có) ----- */}
            {/* Nếu có quantity và pricePerTicket → hiển thị "SL x giá" */}
            {state.quantity && state.pricePerTicket && (
              <p className="text-xs text-gray-500">
                {state.quantity} x {state.pricePerTicket.toLocaleString('vi-VN')}{' '}
                đ
              </p>
            )}
          </div>
        </div>

        {/* ========== PHƯƠNG THỨC THANH TOÁN & NÚT BẤM ========== */}
        <div className="space-y-4">
          {/* ----- Dropdown chọn phương thức ----- */}
          {/* 
            Hiện tại chỉ có VNPay
            Dùng <select> để sau này dễ mở rộng (Momo, ZaloPay...)
          */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phương thức thanh toán
            </label>

            {/* select cho phép chọn VNPay hoặc Wallet */}
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="vnpay">VNPay (Internet Banking / Thẻ)</option>
              <option value="wallet">Wallet (Ví nội bộ)</option>
            </select>
          </div>

          {/* ----- Nút thanh toán ----- */}
          {/* 
            type="button": tránh submit (nếu nằm trong form)
            onClick={handlePay}: gọi hàm tạo URL và redirect sang backend
          */}
          <button
            type="button"
            onClick={paymentMethod === 'vnpay' ? handlePay : handleWalletPay}
            className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {paymentMethod === 'vnpay' ? 'Thanh toán qua VNPay' : 'Thanh toán bằng Wallet'}
          </button>

          {/* ----- Ghi chú ----- */}
          {/* &quot; là HTML entity cho dấu ngoặc kép " để JSX không lỗi */}
          <p className="text-xs text-gray-400 text-center">
            {paymentMethod === 'vnpay' ? (
              <>Khi bấm "Thanh toán qua VNPay", bạn sẽ được chuyển sang cổng thanh toán VNPay để hoàn tất giao dịch.</>
            ) : (
              <>Khi bấm "Thanh toán bằng Wallet", hệ thống sẽ trừ tiền trong ví và chuyển bạn tới trang xác nhận.</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

// ======================== END OF FILE ========================
