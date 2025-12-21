/**
 * =============================================================================
 * FILE: CheckIn.tsx
 * MÔ TẢ: Trang quản lý Check-in / Check-out vé sự kiện
 * 
 * CHỨC NĂNG CHÍNH:
 * - Quét mã QR trên vé để check-in/check-out người tham dự sự kiện
 * - Hỗ trợ quét cả vé đơn lẻ và nhiều vé cùng lúc (multi-ticket)
 * - Cho phép nhập thủ công mã vé nếu không quét được QR
 * - Hiển thị kết quả check-in/check-out với thông tin chi tiết
 * 
 * ĐỊNH DẠNG QR HỖ TRỢ:
 * - Vé đơn: số nguyên (123) hoặc URL có ticketId=123
 * - Nhiều vé: "TICKETS:123,124,125"
 * =============================================================================
 */

// =============================================================================
// IMPORT CÁC THƯ VIỆN VÀ MODULES CẦN THIẾT
// =============================================================================

import { useState, useEffect, useRef } from 'react'
// useState: Hook để quản lý trạng thái của component (tab đang chọn, đang quét, kết quả...)
// useEffect: Hook để xử lý side-effect (khởi động/dừng camera) khi trạng thái thay đổi
// useRef: Hook để giữ tham chiếu đến đối tượng scanner giữa các lần render mà không gây re-render

import { useAuth } from '../contexts/AuthContext'
// Custom hook để lấy thông tin người dùng đang đăng nhập từ AuthContext
// Dùng để kiểm tra quyền truy cập (chỉ STAFF/ADMIN mới được check-in/checkout)

import { Html5Qrcode } from 'html5-qrcode'
// Thư viện bên thứ 3 để quét mã QR bằng camera trên trình duyệt web
// Hỗ trợ nhiều loại mã vạch và QR code

import { Scan, CheckCircle, XCircle, Search, LogIn, LogOut } from 'lucide-react'
// Các icon từ thư viện lucide-react:
// - Scan: icon quét mã
// - CheckCircle: icon thành công (dấu check trong vòng tròn)
// - XCircle: icon thất bại (dấu X trong vòng tròn)
// - Search: icon tìm kiếm
// - LogIn: icon đăng nhập (dùng cho tab Check-in)
// - LogOut: icon đăng xuất (dùng cho tab Check-out)

import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
// Thư viện date-fns để định dạng ngày giờ
// - format: hàm format ngày giờ theo pattern chỉ định
// - vi: locale tiếng Việt để hiển thị ngày tháng đúng định dạng VN

// =============================================================================
// ĐỊNH NGHĨA KIỂU DỮ LIỆU (TYPE DEFINITIONS)
// =============================================================================

type TabType = 'checkin' | 'checkout'
// Kiểu dữ liệu cho 2 tab: 'checkin' (vào sự kiện) và 'checkout' (ra khỏi sự kiện)

// =============================================================================
// COMPONENT CHÍNH: CheckIn
// =============================================================================

export default function CheckIn() {
  // ===========================================================================
  // KHAI BÁO CÁC STATE VÀ REF
  // ===========================================================================

  // Lấy thông tin user từ AuthContext
  // Đặt tên _user (có underscore) vì hiện tại chưa sử dụng trực tiếp trong component
  const { user: _user } = useAuth()

  // Lấy token xác thực từ localStorage để gửi kèm trong header Authorization khi gọi API
  // Kiểm tra typeof window !== 'undefined' để tránh lỗi khi chạy Server-Side Rendering (SSR)
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null

  // State lưu tab đang được chọn, mặc định là 'checkin'
  const [activeTab, setActiveTab] = useState<TabType>('checkin')

  // State kiểm soát việc bật/tắt camera quét QR
  // true = đang quét, false = không quét
  const [scanning, setScanning] = useState(false)

  // State lưu giá trị input khi người dùng nhập mã vé thủ công
  const [manualCode, setManualCode] = useState('')

  // Ref giữ tham chiếu đến instance của Html5Qrcode (đối tượng scanner)
  // Dùng ref thay vì state vì không cần re-render khi thay đổi scanner
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // State lưu kết quả trả về sau khi gọi API check-in/check-out
  // - success: boolean cho biết thành công hay thất bại
  // - message: thông báo hiển thị cho người dùng
  // - registration: dữ liệu chi tiết về vé/sự kiện (tùy chọn)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    registration?: any
  } | null>(null)

  // ===========================================================================
  // EFFECT: QUẢN LÝ KHỞI ĐỘNG VÀ DỪNG CAMERA QR SCANNER
  // ===========================================================================

  /**
   * useEffect này chạy khi state 'scanning' thay đổi
   * - Khi scanning = true và chưa có scanner: khởi tạo và bật camera
   * - Khi component unmount hoặc scanning = false: dừng và dọn dẹp scanner
   */
  useEffect(() => {
    // Chỉ khởi tạo scanner khi đang quét VÀ chưa có instance scanner
    if (scanning && !scannerRef.current) {
      // Tạo instance Html5Qrcode mới, gắn vào element có id="reader"
      const html5QrCode = new Html5Qrcode('reader')
      scannerRef.current = html5QrCode

      // Bắt đầu quét QR với các cấu hình:
      // - facingMode: 'environment' = sử dụng camera sau (phù hợp quét QR)
      // - fps: 10 = quét 10 khung hình/giây
      // - qrbox: kích thước vùng quét QR (280x280 pixel)
      html5QrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 280, height: 280 } },
          (decodedText) => {
            // Callback khi quét thành công - nhận được nội dung QR
            processAction(decodedText) // Xử lý check-in/check-out
            stopScanning() // Dừng quét sau khi đã quét được
          },
          () => {},  // Callback khi quét thất bại - bỏ trống vì không cần xử lý
        )
        .catch((err) => {
          // Xử lý lỗi khi không thể khởi động camera (ví dụ: không có quyền camera)
          console.error('Unable to start scanning', err)
        })
    }

    // Cleanup function: chạy khi component unmount hoặc dependency thay đổi
    // Đảm bảo dừng camera và giải phóng tài nguyên
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})  // Dừng quét (bỏ qua lỗi nếu có)
        scannerRef.current.clear()  // Xóa element video khỏi DOM
        scannerRef.current = null   // Reset ref về null
      }
    }
  }, [scanning])  // Dependency: chỉ chạy lại khi 'scanning' thay đổi

  // ===========================================================================
  // EFFECT: RESET STATE KHI CHUYỂN TAB
  // ===========================================================================

  /**
   * useEffect này chạy khi người dùng chuyển tab (check-in <-> check-out)
   * Reset tất cả state về trạng thái ban đầu để bắt đầu fresh
   */
  useEffect(() => {
    stopScanning()      // Dừng camera nếu đang quét
    setResult(null)     // Xóa kết quả cũ
    setManualCode('')   // Xóa input nhập tay
  }, [activeTab])  // Dependency: chạy khi 'activeTab' thay đổi

  // ===========================================================================
  // HÀM DỪNG QUÉT QR
  // ===========================================================================

  /**
   * Dừng camera scanner và reset state scanning về false
   * Được gọi khi: quét xong, nhấn nút dừng, hoặc chuyển tab
   */
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {})  // Dừng camera
      scannerRef.current.clear()                  // Xóa element video
      scannerRef.current = null                   // Reset ref
    }
    setScanning(false)  // Cập nhật state
  }

  // ===========================================================================
  // HÀM CHUẨN HÓA NỘI DUNG QR CODE
  // ===========================================================================

  /**
   * Chuẩn hóa chuỗi text từ QR để tránh lỗi do ký tự đặc biệt
   * Một số QR code có thể chứa các ký tự ẩn hoặc ký tự Unicode đặc biệt
   * 
   * @param text - Chuỗi gốc đọc được từ QR
   * @returns Chuỗi đã được làm sạch
   */
  const normalizeQrText = (text: string) => {
    return text
      .replace(/\uFEFF/g, '')           // Loại bỏ BOM (Byte Order Mark) - ký tự đánh dấu đầu file
      .replace(/[\u200B-\u200D]/g, '')  // Loại bỏ zero-width characters (ký tự có độ rộng = 0)
      .replace(/[：]/g, ':')            // Chuyển fullwidth colon (：) thành colon thường (:)
      .trim()                            // Xóa khoảng trắng đầu và cuối chuỗi
  }

  // ===========================================================================
  // HÀM KIỂM TRA QR CODE NHIỀU VÉ
  // ===========================================================================

  /**
   * Kiểm tra xem QR code có phải định dạng nhiều vé không
   * Định dạng nhiều vé: "TICKETS:123,124,125"
   * 
   * @param text - Nội dung QR code
   * @returns true nếu là QR nhiều vé, false nếu không
   */
  const isMultiTicketQr = (text: string) => {
    return normalizeQrText(text).toUpperCase().startsWith('TICKETS:')
  }

  // ===========================================================================
  // HÀM TRÍCH XUẤT TICKET ID TỪ QR CODE
  // ===========================================================================

  /**
   * Trích xuất ticketId từ nội dung QR code (dành cho vé đơn)
   * Hỗ trợ 2 định dạng:
   * 1. Số nguyên trực tiếp: "123"
   * 2. URL có tham số: "...?ticketId=123"
   * 
   * @param code - Nội dung QR code hoặc mã nhập tay
   * @returns ticketId (số nguyên) hoặc null nếu không tìm thấy
   */
  const extractTicketId = (code: string): number | null => {
    const trimmed = normalizeQrText(code)

    // Thử parse trực tiếp thành số
    const numeric = Number(trimmed)
    // Kiểm tra: không phải NaN, là số nguyên, và lớn hơn 0
    if (!Number.isNaN(numeric) && Number.isInteger(numeric) && numeric > 0) {
      return numeric
    }

    // Thử tìm pattern ticketId=xxx trong chuỗi (không phân biệt hoa thường)
    const match = trimmed.match(/ticketId=(\d+)/i)
    if (match) {
      return Number(match[1])  // match[1] là nhóm capture đầu tiên (\d+)
    }

    // Không tìm thấy ticketId hợp lệ
    return null
  }

  // ===========================================================================
  // HÀM XỬ LÝ CHÍNH: GỌI API CHECK-IN/CHECK-OUT
  // ===========================================================================

  /**
   * Hàm chính xử lý logic check-in hoặc check-out
   * Được gọi khi: quét QR thành công HOẶC nhập mã thủ công
   * 
   * Luồng xử lý:
   * 1. Kiểm tra token (phải đăng nhập mới được thực hiện)
   * 2. Chuẩn hóa và phân tích nội dung QR
   * 3. Xây dựng endpoint API phù hợp (check-in/check-out, đơn vé/nhiều vé)
   * 4. Gọi API và xử lý response
   * 5. Cập nhật state result để hiển thị kết quả
   * 
   * @param qrCode - Nội dung QR code hoặc mã nhập tay
   */
  const processAction = async (qrCode: string) => {
    // Reset kết quả cũ trước khi xử lý
    setResult(null)

    // Kiểm tra đăng nhập - chỉ STAFF/ADMIN mới có token hợp lệ
    if (!token) {
      setResult({
        success: false,
        message: `Bạn cần đăng nhập STAFF/ADMIN để thực hiện ${
          activeTab === 'checkin' ? 'check-in' : 'check-out'
        }.`,
      })
      return
    }

    // Chuẩn hóa nội dung QR
    const cleaned = normalizeQrText(qrCode)

    try {
      // =====================================================================
      // XÂY DỰNG ENDPOINT API DỰA TRÊN TAB VÀ LOẠI VÉ
      // =====================================================================
      // Quy tắc:
      // - TAB CHECK-IN:
      //    + QR nhiều vé (TICKETS:123,124) => /api/staff/checkin?ticketCode=TICKETS:123,124
      //    + Vé đơn (123)                  => /api/staff/checkin?ticketId=123
      // - TAB CHECK-OUT: tương tự, thay checkin bằng checkout
      let apiEndpoint = ''

      if (activeTab === 'checkin') {
        // *** XỬ LÝ CHECK-IN ***
        if (isMultiTicketQr(cleaned)) {
          // Trường hợp QR nhiều vé: gửi nguyên chuỗi ticketCode
          apiEndpoint = `/api/staff/checkin?ticketCode=${encodeURIComponent(
            cleaned,
          )}`
        } else {
          // Trường hợp vé đơn: trích xuất và gửi ticketId
          const ticketId = extractTicketId(cleaned)
          if (!ticketId) {
            // Không trích xuất được ticketId -> báo lỗi
            setResult({
              success: false,
              message: 'QR không hợp lệ hoặc không đọc được ticketId.',
            })
            return
          }
          apiEndpoint = `/api/staff/checkin?ticketId=${encodeURIComponent(
            String(ticketId),
          )}`
        }
      } else {
        // *** XỬ LÝ CHECK-OUT ***
        // Logic tương tự check-in, hỗ trợ cả multi-ticket
        if (isMultiTicketQr(cleaned)) {
          apiEndpoint = `/api/staff/checkout?ticketCode=${encodeURIComponent(
            cleaned,
          )}`
        } else {
          const ticketId = extractTicketId(cleaned)
          if (!ticketId) {
            setResult({
              success: false,
              message: 'QR không hợp lệ hoặc không đọc được ticketId.',
            })
            return
          }
          apiEndpoint = `/api/staff/checkout?ticketId=${encodeURIComponent(
            String(ticketId),
          )}`
        }
      }

      // =====================================================================
      // GỌI API CHECK-IN/CHECK-OUT
      // =====================================================================
      const res = await fetch(apiEndpoint, {
        method: 'POST',                    // Phương thức POST
        credentials: 'include',            // Gửi kèm cookie (nếu có)
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`, // Token xác thực
        },
      })

      // Parse response JSON, nếu lỗi thì trả về object rỗng
      const data = await res.json().catch(() => ({} as any))

      // =====================================================================
      // XỬ LÝ RESPONSE THẤT BẠI (HTTP status không phải 2xx)
      // =====================================================================
      if (!res.ok) {
        // Lấy message lỗi từ response, ưu tiên error > message > mặc định
        const msg =
          (data && (data.error || data.message)) ||
          `${activeTab === 'checkin' ? 'Check-in' : 'Check-out'} thất bại (HTTP ${
            res.status
          })`

        setResult({
          success: false,
          message: msg,
        })
        return
      }

      // =====================================================================
      // XỬ LÝ RESPONSE THÀNH CÔNG - NHIỀU VÉ (MULTI-TICKET)
      // =====================================================================
      // Backend trả về mảng results[] khi xử lý nhiều vé cùng lúc
      if (data && Array.isArray(data.results)) {
        setResult({
          success: !!data.success,
          message:
            data.message ||
            `${activeTab === 'checkin' ? 'Check-in' : 'Check-out'} thành công`,
          registration: {
            results: data.results,           // Mảng kết quả từng vé
            totalTickets: data.totalTickets, // Tổng số vé
            successCount: data.successCount, // Số vé thành công
            failCount: data.failCount,       // Số vé thất bại
          },
        })
        return
      }

      // =====================================================================
      // XỬ LÝ RESPONSE THÀNH CÔNG - VÉ ĐƠN (SINGLE-TICKET)
      // =====================================================================
      // Xử lý đặc biệt cho check-out khi backend vẫn trả results[]
      if (activeTab === 'checkout' && data.results && data.results.length > 0) {
        const firstResult = data.results[0]
        setResult({
          success: data.success || firstResult.success,
          message: data.message || firstResult.message || 'Check-out thành công',
          registration: {
            ticketId: firstResult.ticketId,
            checkedOutAt: firstResult.checkoutTime,
            eventName: firstResult.eventName,
          },
        })
      } else {
        // Trường hợp response đơn giản (không có results[])
        setResult({
          success: true,
          message:
            data.message ||
            `${activeTab === 'checkin' ? 'Check-in' : 'Check-out'} thành công`,
          registration: {
            ticketId: data.ticketId,
            checkedInAt: data.checkinTime,
            checkedOutAt: data.checkoutTime,
            eventName: data.eventName,
          },
        })
      }
    } catch (error) {
      // Xử lý lỗi mạng hoặc lỗi không mong đợi
      console.error(error)
      setResult({
        success: false,
        message: 'Lỗi kết nối API',
      })
    }
  }

  // ===========================================================================
  // HÀM XỬ LÝ NHẬP MÃ THỦ CÔNG
  // ===========================================================================

  /**
   * Xử lý khi người dùng nhấn nút Search hoặc Enter sau khi nhập mã thủ công
   * Gọi processAction với mã đã nhập và xóa input
   */
  const handleManualAction = () => {
    if (manualCode.trim()) {
      processAction(manualCode.trim())  // Xử lý với mã đã nhập
      setManualCode('')                  // Xóa input sau khi submit
    }
  }

  // ===========================================================================
  // HÀM RESET KẾT QUẢ
  // ===========================================================================

  /**
   * Xóa kết quả hiện tại để quét/nhập vé tiếp theo
   */
  const resetResult = () => {
    setResult(null)
  }

  // ===========================================================================
  // BIẾN TIỆN ÍCH CHO RENDER
  // ===========================================================================

  // Biến boolean kiểm tra đang ở tab check-in hay không
  const isCheckIn = activeTab === 'checkin'
  
  // Label hiển thị dựa theo tab hiện tại
  const actionLabel = isCheckIn ? 'Check-in' : 'Check-out'

  // ===========================================================================
  // PHẦN RENDER GIAO DIỆN (JSX)
  // ===========================================================================

  return (
    <div>
      {/* ===== TIÊU ĐỀ TRANG ===== */}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Check-in / Check-out sự kiện
      </h1>

      {/* ===== TAB CHUYỂN ĐỔI CHECK-IN / CHECK-OUT ===== */}
      {/* Thanh tab cho phép người dùng chuyển đổi giữa 2 chế độ */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 max-w-md">
        {/* Nút tab Check-in */}
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'checkin'
              ? 'bg-white text-blue-600 shadow-sm'  // Style khi tab đang được chọn
              : 'text-gray-600 hover:text-gray-900' // Style khi tab không được chọn
          }`}
        >
          <LogIn className="w-5 h-5" />
          Check-in
        </button>

        {/* Nút tab Check-out */}
        <button
          onClick={() => setActiveTab('checkout')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'checkout'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <LogOut className="w-5 h-5" />
          Check-out
        </button>
      </div>

      {/* ===== LAYOUT 2 CỘT: QUÉT QR + KẾT QUẢ ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* =====================================================
            CỘT TRÁI: KHU VỰC QUÉT MÃ QR VÀ NHẬP THỦ CÔNG
            ===================================================== */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Quét mã QR - {actionLabel}</h2>

          {/* Điều kiện render: Khi KHÔNG đang quét - hiển thị nút bắt đầu và form nhập tay */}
          {!scanning ? (
            <div className="space-y-4">
              {/* Nút bắt đầu quét QR */}
              <button
                onClick={() => {
                  resetResult()        // Xóa kết quả cũ
                  setScanning(true)    // Bật camera quét
                }}
                className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center text-white ${
                  isCheckIn
                    ? 'bg-blue-600 hover:bg-blue-700'    // Màu xanh cho check-in
                    : 'bg-purple-600 hover:bg-purple-700' // Màu tím cho check-out
                }`}
              >
                <Scan className="w-5 h-5 mr-2" />
                Bắt đầu quét {actionLabel}
              </button>

              {/* Đường kẻ phân cách với chữ "Hoặc" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>

              {/* Form nhập mã thủ công */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập mã QR / ID vé thủ công
                </label>
                <div className="flex space-x-2">
                  {/* Input nhập mã */}
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Ví dụ: 123 hoặc TICKETS:123,124"
                    className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${
                      isCheckIn ? 'focus:ring-blue-500' : 'focus:ring-purple-500'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualAction()} // Nhấn Enter để submit
                  />
                  {/* Nút tìm kiếm/submit */}
                  <button
                    onClick={handleManualAction}
                    className="px-4 py-2 text-white rounded-lg bg-gray-600 hover:bg-gray-700"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Điều kiện render: Khi ĐANG quét - hiển thị camera và nút dừng */
            <div className="space-y-4">
              {/* Container hiển thị video từ camera */}
              <div className="relative bg-black rounded-xl overflow-hidden">
                {/* Element để Html5Qrcode render video vào */}
                <div id="reader" className="w-full h-full" style={{ minHeight: 320 }} />

                {/* Overlay: Khung hướng dẫn quét (không nhận click - pointer-events-none) */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {/* Khung vuông với 4 góc bo tròn để người dùng căn QR vào */}
                  <div
                    className={`relative w-64 h-64 rounded-xl border-2 ${
                      isCheckIn ? 'border-green-400/80' : 'border-purple-400/80'
                    }`}
                  >
                    {/* Góc trên trái */}
                    <div
                      className={`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl ${
                        isCheckIn ? 'border-green-400' : 'border-purple-400'
                      }`}
                    />
                    {/* Góc trên phải */}
                    <div
                      className={`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl ${
                        isCheckIn ? 'border-green-400' : 'border-purple-400'
                      }`}
                    />
                    {/* Góc dưới trái */}
                    <div
                      className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl ${
                        isCheckIn ? 'border-green-400' : 'border-purple-400'
                      }`}
                    />
                    {/* Góc dưới phải */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl ${
                        isCheckIn ? 'border-green-400' : 'border-purple-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Hướng dẫn quét ở dưới màn hình camera */}
                <div className="absolute bottom-4 inset-x-4 bg-black/60 text-white text-sm text-center rounded-lg px-3 py-2">
                  Đưa mã QR vào trong khung và giữ máy ổn định để {actionLabel.toLowerCase()}
                </div>
              </div>

              {/* Nút dừng quét */}
              <button
                onClick={() => {
                  stopScanning()  // Tắt camera
                  resetResult()   // Xóa kết quả
                }}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
              >
                Dừng quét
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            CỘT PHẢI: KẾT QUẢ CHECK-IN/CHECK-OUT
            ===================================================== */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Kết quả {actionLabel}</h2>

          {/* Điều kiện render: Chưa có kết quả - hiển thị placeholder */}
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              <Scan className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có kết quả {actionLabel.toLowerCase()}</p>
              <p className="text-sm mt-2">Quét mã QR hoặc nhập mã thủ công để bắt đầu</p>
            </div>
          ) : (
            /* Điều kiện render: Đã có kết quả - hiển thị chi tiết */
            <div className="space-y-4">
              {/* Hiển thị icon và thông báo dựa theo thành công/thất bại */}
              {result.success ? (
                /* Trường hợp THÀNH CÔNG */
                <div className="text-center py-6">
                  <CheckCircle
                    className={`w-16 h-16 mx-auto mb-4 ${
                      isCheckIn ? 'text-green-500' : 'text-purple-500'
                    }`}
                  />
                  <p
                    className={`text-xl font-semibold mb-2 ${
                      isCheckIn ? 'text-green-600' : 'text-purple-600'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              ) : (
                /* Trường hợp THẤT BẠI */
                <div className="text-center py-6">
                  <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                  <p className="text-xl font-semibold text-red-600 mb-2">
                    {result.message}
                  </p>
                </div>
              )}

              {/* Hiển thị thông tin chi tiết về vé/sự kiện (nếu có) */}
              {result.registration && (
                <div className="border-t pt-4 space-y-3">
                  {/* Hiển thị Ticket ID */}
                  {result.registration.ticketId && (
                    <div>
                      <p className="text-sm text-gray-600">Ticket ID:</p>
                      <p className="font-medium">{result.registration.ticketId}</p>
                    </div>
                  )}

                  {/* Hiển thị tên sự kiện */}
                  {result.registration.eventName && (
                    <div>
                      <p className="text-sm text-gray-600">Sự kiện:</p>
                      <p className="font-medium">{result.registration.eventName}</p>
                    </div>
                  )}

                  {/* Hiển thị thời gian check-in (nếu có) */}
                  {result.registration.checkedInAt && (
                    <div>
                      <p className="text-sm text-gray-600">Thời gian check-in:</p>
                      <p className="font-medium">
                        {/* Format ngày giờ theo định dạng VN: dd/MM/yyyy HH:mm:ss */}
                        {format(
                          new Date(result.registration.checkedInAt),
                          'dd/MM/yyyy HH:mm:ss',
                          { locale: vi },
                        )}
                      </p>
                    </div>
                  )}

                  {/* Hiển thị thời gian check-out (nếu có) */}
                  {result.registration.checkedOutAt && (
                    <div>
                      <p className="text-sm text-gray-600">Thời gian check-out:</p>
                      <p className="font-medium">
                        {format(
                          new Date(result.registration.checkedOutAt),
                          'dd/MM/yyyy HH:mm:ss',
                          { locale: vi },
                        )}
                      </p>
                    </div>
                  )}

                  {/* Hiển thị danh sách kết quả cho trường hợp nhiều vé (multi-ticket) */}
                  {result.registration.results && Array.isArray(result.registration.results) && (
                    <div>
                      <p className="text-sm text-gray-600">Danh sách vé:</p>
                      <div className="text-sm mt-2 space-y-1">
                        {/* Map qua từng vé và hiển thị trạng thái */}
                        {result.registration.results.map((r: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>#{r.ticketId}</span>
                            {/* Màu xanh nếu OK, màu đỏ nếu FAIL */}
                            <span className={r.success ? 'text-green-600' : 'text-red-600'}>
                              {r.success ? 'OK' : 'FAIL'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nút để tiếp tục check-in/check-out vé tiếp theo */}
              <button
                onClick={resetResult}
                className="w-full mt-4 text-white py-2 rounded-lg bg-gray-600 hover:bg-gray-700"
              >
                {actionLabel} tiếp theo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== PHẦN HƯỚNG DẪN SỬ DỤNG ===== */}
      {/* Hiển thị hướng dẫn khác nhau tùy theo tab đang chọn */}
      <div
        className={`mt-6 p-4 rounded-lg border ${
          isCheckIn ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
        }`}
      >
        <h3 className={`font-semibold mb-2 ${isCheckIn ? 'text-blue-800' : 'text-purple-800'}`}>
          Hướng dẫn {actionLabel}
        </h3>
        <ul className={`text-sm space-y-1 ${isCheckIn ? 'text-blue-700' : 'text-purple-700'}`}>
          {isCheckIn ? (
            /* Hướng dẫn cho Check-in */
            <>
              <li>• Quét mã QR trên vé của người tham dự để check-in</li>
              <li>• Hỗ trợ QR nhiều vé dạng: TICKETS:123,124</li>
              <li>• Hoặc nhập ID vé thủ công nếu không quét được</li>
              <li>• Mỗi vé chỉ có thể check-in một lần</li>
            </>
          ) : (
            /* Hướng dẫn cho Check-out */
            <>
              <li>• Quét mã QR trên vé để check-out khi người tham dự rời sự kiện</li>
              <li>• Hoặc nhập ID vé thủ công nếu không quét được</li>
              <li>• Chỉ có thể check-out sau khi đã check-in</li>
              <li>• Check-out chỉ khả dụng sau thời gian quy định (cấu hình hệ thống)</li>
            </>
          )}
        </ul>
      </div>
    </div>
  )
}
