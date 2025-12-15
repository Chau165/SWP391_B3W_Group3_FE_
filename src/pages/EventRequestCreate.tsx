import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send } from 'lucide-react'
import { useToast } from '../contexts/ToastContext'

export default function EventRequestCreate() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    preferredStart: '',
    preferredEnd: '',
    expectedParticipants: '',
    bannerUrl: ''
  })

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({
    title: false,
    description: false,
    reason: false,
    expectedParticipants: false
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Check for empty required fields
    if (['title', 'description', 'reason'].includes(name)) {
      setFieldErrors(prev => ({ ...prev, [name]: value.trim() === '' }))
    }

    // Real-time validation for expectedParticipants
    if (name === 'expectedParticipants' && value) {
      const participants = parseInt(value)
      if (isNaN(participants) || participants < 10) {
        setValidationError('Số lượng phải tối thiểu là 10')
        setFieldErrors(prev => ({ ...prev, expectedParticipants: true }))
      } else if (participants % 10 !== 0) {
        setValidationError('Số lượng phải là bội số của 10 (10, 20, 30, ...)')
        setFieldErrors(prev => ({ ...prev, expectedParticipants: true }))
      } else {
        setValidationError(null)
        setFieldErrors(prev => ({ ...prev, expectedParticipants: false }))
      }
    } else if (name === 'expectedParticipants' && !value) {
      setValidationError(null)
      setFieldErrors(prev => ({ ...prev, expectedParticipants: false }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (['title', 'description', 'reason'].includes(name)) {
      setFieldErrors(prev => ({ ...prev, [name]: value.trim() === '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate that expectedParticipants is a multiple of 10
    const participants = parseInt(formData.expectedParticipants)
    if (formData.expectedParticipants && (isNaN(participants) || participants < 10 || participants % 10 !== 0)) {
      setError('Số lượng người tham gia dự kiến phải là bội số của 10 (10, 20, 30, ...)')
      return
    }

    setIsSubmitting(true)

    try {
      // Send event request to backend
      const token = localStorage.getItem('token')

      // Convert local datetime to ISO 8601 format: YYYY-MM-DDTHH:mm:ss
      const formatDateTimeLocal = (dateTimeStr: string) => {
        if (!dateTimeStr) return null
        // datetime-local gives us YYYY-MM-DDTHH:mm format
        // Convert to ISO 8601: YYYY-MM-DDTHH:mm:ss
        return dateTimeStr + ':00'
      }

      const requestBody = {
        title: formData.title,
        description: formData.description,
        preferredStartTime: formData.preferredStart ? formatDateTimeLocal(formData.preferredStart) : null,
        preferredEndTime: formData.preferredEnd ? formatDateTimeLocal(formData.preferredEnd) : null,
        // BE expects `expectedCapacity`
        expectedCapacity: parseInt(formData.expectedParticipants) || 0,
      }

      console.log('Submitting event request:', requestBody)

      const response = await fetch('http://localhost:3000/api/event-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        showToast('success', 'Yêu cầu tổ chức sự kiện đã được gửi thành công!')
        navigate('/dashboard/event-requests')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit event request')
      }
    } catch (error) {
      console.error('Error submitting event request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit event request'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Gửi yêu cầu tổ chức sự kiện
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">Vui lòng nhập tiêu đề sự kiện</p>
            )}
          </div>

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
              <p className="mt-1 text-sm text-red-600">Vui lòng nhập mô tả chi tiết</p>
            )}
          </div>

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
              <p className="mt-1 text-sm text-red-600">Vui lòng nhập lý do / mục tiêu tổ chức</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            {validationError && (
              <p className="mt-1 text-sm text-red-600">{validationError}</p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/my-event-requests')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Hủy
            </button>
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


