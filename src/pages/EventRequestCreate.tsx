// Import useState để quản lý state trong React
import { useState } from 'react'

// Import useNavigate để điều hướng trang bằng code
import { useNavigate } from 'react-router-dom'

// Import icon Send để hiển thị nút “Gửi yêu cầu” đẹp hơn
import { Send } from 'lucide-react'

// Import toast context để hiện thông báo (success / error)
import { useToast } from '../contexts/ToastContext'

/**
 * =============================================================================
 * EVENT REQUEST CREATE PAGE - Trang gửi yêu cầu tổ chức sự kiện
 * =============================================================================
 *
 * Trang này dùng cho (thường là Organizer/Staff):
 * - Nhập thông tin đề xuất sự kiện (title, description, reason, thời gian mong muốn, số lượng dự kiến)
 * - Validate dữ liệu (bắt buộc, và expectedParticipants phải là bội số của 10)
 * - Gọi API POST /api/event-requests để gửi yêu cầu về Backend
 * - Thành công -> toast success + điều hướng về trang danh sách yêu cầu
 *
 * Flow:
 * 1) User nhập form
 * 2) Validate realtime (onChange) và validate khi submit
 * 3) Submit -> gọi BE -> nếu ok thì về trang /dashboard/event-requests
 * =============================================================================
 */

export default function EventRequestCreate() {
  // navigate: điều hướng route trong SPA bằng code
  const navigate = useNavigate()

  // showToast: hiển thị thông báo toast
  const { showToast } = useToast()

  /**
   * formData: lưu toàn bộ dữ liệu input của form
   * Lưu ý: reason hiện tại có trong formData nhưng requestBody gửi BE đang chưa gửi reason
   * (tức BE hiện chỉ nhận title, description, preferredStartTime, preferredEndTime, expectedCapacity)
   */
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    preferredStart: '',
    preferredEnd: '',
    expectedParticipants: '',
    bannerUrl: '',
  })

  // selectedImage: file ảnh banner user chọn (hiện chưa dùng để upload trong submit)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  // imagePreview: preview ảnh banner (hiện chưa render UI trong form)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // isSubmitting: trạng thái đang submit form -> disable nút
  const [isSubmitting, setIsSubmitting] = useState(false)

  // error: lỗi tổng (khi submit fail hoặc validate fail)
  const [error, setError] = useState<string | null>(null)

  // validationError: lỗi validate realtime (đang dùng cho expectedParticipants)
  const [validationError, setValidationError] = useState<string | null>(null)

  /**
   * fieldErrors: dùng để tô đỏ các field bắt buộc nếu trống
   * - title, description, reason: bắt buộc
   * - expectedParticipants: validate riêng theo bội số 10
   */
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    reason: false,
    expectedParticipants: false,
  })

  /**
   * handleChange:
   * - Chạy khi user gõ/đổi giá trị input hoặc textarea
   * - Update formData theo name của input
   * - Validate realtime:
   *   + Nếu field bắt buộc (title/description/reason) -> check rỗng để set fieldErrors
   *   + Nếu expectedParticipants -> check >=10 và bội số 10
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    // Update formData: giữ nguyên field cũ và cập nhật field đang thay đổi
    setFormData((prev) => ({ ...prev, [name]: value }))

    // ===== Validate rỗng cho các field bắt buộc =====
    if (['title', 'description', 'reason'].includes(name)) {
      setFieldErrors((prev) => ({ ...prev, [name]: value.trim() === '' }))
    }

    // ===== Validate realtime cho expectedParticipants =====
    if (name === 'expectedParticipants' && value) {
      const participants = parseInt(value)

      // Nếu không phải số hoặc < 10 -> lỗi
      if (isNaN(participants) || participants < 10) {
        setValidationError('Số lượng phải tối thiểu là 10')
        setFieldErrors((prev) => ({ ...prev, expectedParticipants: true }))

        // Nếu không chia hết cho 10 -> lỗi
      } else if (participants % 10 !== 0) {
        setValidationError('Số lượng phải là bội số của 10 (10, 20, 30, ...)')
        setFieldErrors((prev) => ({ ...prev, expectedParticipants: true }))

        // Hợp lệ -> clear lỗi
      } else {
        setValidationError(null)
        setFieldErrors((prev) => ({ ...prev, expectedParticipants: false }))
      }

      // Nếu user xóa trống expectedParticipants -> clear lỗi
    } else if (name === 'expectedParticipants' && !value) {
      setValidationError(null)
      setFieldErrors((prev) => ({ ...prev, expectedParticipants: false }))
    }
  }

  /**
   * handleBlur:
   * - Chạy khi user rời khỏi input/textarea
   * - Mục tiêu: nếu field bắt buộc bị bỏ trống -> show lỗi đỏ
   */
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target

    // Các field bắt buộc: check rỗng
    if (['title', 'description', 'reason'].includes(name)) {
      setFieldErrors((prev) => ({ ...prev, [name]: value.trim() === '' }))
    }
  }

  /**
   * handleSubmit:
   * - Chạy khi submit form
   * Flow:
   * 1) preventDefault để không reload trang
   * 2) validate expectedParticipants lần cuối
   * 3) setSubmitting true
   * 4) build requestBody theo format BE yêu cầu
   * 5) gọi API POST /api/event-requests
   * 6) ok -> toast success + navigate
   * 7) fail -> toast error + show error
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // ===== Validate expectedParticipants lần cuối trước khi gửi =====
    const participants = parseInt(formData.expectedParticipants)

    // Nếu có nhập expectedParticipants mà không hợp lệ -> báo lỗi và dừng
    if (
      formData.expectedParticipants &&
      (isNaN(participants) || participants < 10 || participants % 10 !== 0)
    ) {
      setError(
        'Số lượng người tham gia dự kiến phải là bội số của 10 (10, 20, 30, ...)',
      )
      return
    }

    // Bắt đầu submit
    setIsSubmitting(true)

    try {
      // Lấy token để gọi API có auth
      const token = localStorage.getItem('token')

      /**
       * formatDateTimeLocal:
       * - input datetime-local trả về dạng: "YYYY-MM-DDTHH:mm"
       * - BE thường muốn: "YYYY-MM-DDTHH:mm:ss"
       * -> nối thêm ":00"
       */
      const formatDateTimeLocal = (dateTimeStr: string) => {
        if (!dateTimeStr) return null
        return dateTimeStr + ':00'
      }

      /**
       * requestBody:
       * - map từ formData sang format BE cần
       * - preferredStartTime / preferredEndTime: convert format
       * - expectedCapacity: BE đang dùng key này
       *
       * Lưu ý:
       * - reason đang chưa gửi lên BE (tùy yêu cầu nghiệp vụ)
       */
      const requestBody = {
        title: formData.title,
        description: formData.description,
        preferredStartTime: formData.preferredStart
          ? formatDateTimeLocal(formData.preferredStart)
          : null,
        preferredEndTime: formData.preferredEnd
          ? formatDateTimeLocal(formData.preferredEnd)
          : null,
        expectedCapacity: parseInt(formData.expectedParticipants) || 0,
      }

      console.log('Submitting event request:', requestBody)

      // ===== Gọi API tạo event request =====
      const response = await fetch('http://localhost:3000/api/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      // ===== Nếu ok -> thông báo + chuyển trang =====
      if (response.ok) {
        showToast('success', 'Yêu cầu tổ chức sự kiện đã được gửi thành công!')
        navigate('/dashboard/event-requests')
      } else {
        // Nếu lỗi -> đọc message BE trả về để show
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit event request')
      }
    } catch (error) {
      // Handle lỗi network / lỗi BE
      console.error('Error submitting event request:', error)
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to submit event request'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      // Dù ok hay fail -> tắt submitting
      setIsSubmitting(false)
    }
  }

  // ======================= UI RENDER =======================
  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Gửi yêu cầu tổ chức sự kiện
        </h1>

        {/* Form submit gọi handleSubmit */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ===== Title ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề sự kiện đề xuất *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                fieldErrors.title
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {/* Nếu title lỗi (rỗng) -> show message */}
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">
                Vui lòng nhập tiêu đề sự kiện
              </p>
            )}
          </div>

          {/* ===== Description ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                fieldErrors.description
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">
                Vui lòng nhập mô tả chi tiết
              </p>
            )}
          </div>

          {/* ===== Reason ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do / mục tiêu tổ chức *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                fieldErrors.reason
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {fieldErrors.reason && (
              <p className="mt-1 text-sm text-red-600">
                Vui lòng nhập lý do / mục tiêu tổ chức
              </p>
            )}
          </div>

          {/* ===== Preferred time range (optional) ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* preferredStart */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian bắt đầu mong muốn
              </label>
              <input
                type="datetime-local"
                name="preferredStart"
                value={formData.preferredStart}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* preferredEnd */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian kết thúc mong muốn
              </label>
              <input
                type="datetime-local"
                name="preferredEnd"
                value={formData.preferredEnd}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* ===== Expected Participants ===== */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lượng người tham gia dự kiến (Bội số của 10: 10, 20, 30...)
            </label>
            <input
              type="number"
              name="expectedParticipants"
              value={formData.expectedParticipants}
              onChange={handleChange}
              min="10"
              step="10"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                validationError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
            />
            {/* validationError hiện realtime */}
            {validationError && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {/* ===== Error tổng khi submit fail / validate fail ===== */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ===== Buttons ===== */}
          <div className="pt-4 flex justify-end space-x-4">
            {/* Hủy: về trang danh sách yêu cầu (nhưng đang dùng route /dashboard/my-event-requests) */}
            <button
              type="button"
              onClick={() => navigate('/dashboard/my-event-requests')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Hủy
            </button>

            {/* Submit button */}
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
