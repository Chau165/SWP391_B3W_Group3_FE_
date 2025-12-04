import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function EventEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  // Temporary - replace with API call later
  const event: any = null

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organizer: '',
    organizerType: 'Club' as 'Club' | 'Department',
    eventType: 'Workshop' as 'Workshop' | 'Talkshow' | 'Other',
    startDate: '',
    endDate: '',
    location: '',
    maxParticipants: '',
    hasSeating: false,
    totalSeats: '',
    imageUrl: ''
  })

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        organizer: event.organizer,
        organizerType: event.organizerType,
        eventType: event.eventType,
        startDate: event.startDate.slice(0, 16),
        endDate: event.endDate.slice(0, 16),
        location: event.location,
        maxParticipants: event.maxParticipants.toString(),
        hasSeating: event.hasSeating,
        totalSeats: event.totalSeats?.toString() || '',
        imageUrl: event.imageUrl || ''
      })
    }
  }, [event])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Cập nhật sự kiện thành công!')
    navigate(`/events/${id}`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy sự kiện</p>
        <Link to="/events" className="text-blue-600 mt-4 inline-block">
          Quay lại danh sách
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to={`/events/${id}`}
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Chỉnh sửa sự kiện</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên sự kiện *
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
              Mô tả *
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
                Người tổ chức *
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại tổ chức *
              </label>
              <select
                name="organizerType"
                value={formData.organizerType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Club">CLB</option>
                <option value="Department">Phòng ban</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại sự kiện *
            </label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Workshop">Workshop</option>
              <option value="Talkshow">Talkshow</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian bắt đầu *
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời gian kết thúc *
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa điểm *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng người tham gia tối đa *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL hình ảnh
              </label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="hasSeating"
              id="hasSeating"
              checked={formData.hasSeating}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="hasSeating" className="ml-2 text-sm font-medium text-gray-700">
              Có quản lý ghế ngồi
            </label>
          </div>

          {formData.hasSeating && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tổng số ghế
              </label>
              <input
                type="number"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cập nhật
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


