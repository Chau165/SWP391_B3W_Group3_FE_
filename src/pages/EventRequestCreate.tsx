import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EventRequestCreate() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    preferredStart: '',
    preferredEnd: '',
    expectedParticipants: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submit – replace with API later
    alert('Gửi yêu cầu sự kiện thành công (mock).')
    navigate('/dashboard/my-event-requests')
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do / mục tiêu tổ chức *
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              required
              rows={3}
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
              Số lượng người tham gia dự kiến
            </label>
            <input
              type="number"
              name="expectedParticipants"
              value={formData.expectedParticipants}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


