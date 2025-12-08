import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EventRequestCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferredStart: '',
    preferredEnd: '',
    expectedCapacity: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate expectedCapacity is a multiple of 10
      const capacity = parseInt(formData.expectedCapacity)
      if (capacity % 10 !== 0) {
        setError('Số lượng người tham gia dự kiến phải là bội số của 10 (10, 20, 30, ...)')
        setIsSubmitting(false)
        return
      }

      const token = localStorage.getItem('token')

      const requestBody = {
        title: formData.title,
        description: formData.description,
        preferredStartTime: formData.preferredStart ? new Date(formData.preferredStart).toISOString() : null,
        preferredEndTime: formData.preferredEnd ? new Date(formData.preferredEnd).toISOString() : null,
        expectedCapacity: capacity
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
        navigate('/dashboard/event-requests')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit event request')
      }
    } catch (error) {
      console.error('Error submitting event request:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit event request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <Link
        to="/dashboard/my-event-requests"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
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
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả chi tiết *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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
              Số lượng người tham gia dự kiến * (bội số của 10)
            </label>
            <input
              type="number"
              name="expectedCapacity"
              value={formData.expectedCapacity}
              onChange={handleChange}
              min="10"
              step="10"
              required
              placeholder="10, 20, 30, ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
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


