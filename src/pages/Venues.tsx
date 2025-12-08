import { useState, useEffect } from 'react'
import { MapPin, PlusCircle, Building2, Search, X } from 'lucide-react'
import axios from 'axios'

const API_URL = '/api'

type Area = {
  areaId: number
  venueId: number
  areaName: string
  floor: number
  capacity: number
  status: string
}

type Venue = {
  venueId: number
  venueName: string
  address: string
  status: string
  areas: Area[]
}

export default function Venues() {
  const [search, setSearch] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [formData, setFormData] = useState({
    venueId: 0,
    venueName: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No authentication token found')
        setVenues([])
        return
      }

      const response = await axios.get(`${API_URL}/venues`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const activeVenues = response.data.filter((venue: Venue) => venue.status === 'AVAILABLE')
      setVenues(activeVenues)
    } catch (error) {
      console.error('Error fetching venues:', error)
      setVenues([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenues()
  }, [])

  const handleOpenModal = (venue?: Venue) => {
    if (venue) {
      setEditingVenue(venue)
      setFormData({
        venueId: venue.venueId,
        venueName: venue.venueName,
        address: venue.address,
      })
    } else {
      setEditingVenue(null)
      setFormData({
        venueId: 0,
        venueName: '',
        address: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingVenue(null)
    setFormData({
      venueId: 0,
      venueName: '',
      address: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      if (editingVenue) {
        await axios.put(`${API_URL}/venues`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      } else {
        await axios.post(`${API_URL}/venues`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
      
      await fetchVenues()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving venue:', error)
      alert('Có lỗi xảy ra khi lưu địa điểm')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (venueId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        alert('Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      await axios.delete(`${API_URL}/venues?venueId=${venueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      setVenues(venues.filter(v => v.venueId !== venueId))
      await fetchVenues()
    } catch (error) {
      console.error('Error deleting venue:', error)
      alert('Có lỗi xảy ra khi xóa địa điểm')
    }
  }

  const filtered = venues.filter(v =>
    v?.venueName?.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
          <p className="text-sm text-gray-600 mt-1">Quản lý các địa điểm tổ chức sự kiện</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-5 h-5" />
          Thêm địa điểm
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có địa điểm nào</p>
          <p className="text-sm text-gray-400 mt-1">Hãy thêm địa điểm đầu tiên để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((venue) => (
            <div key={venue.venueId} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">{venue.venueName}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(venue)}
                  className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 font-medium transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleDelete(venue.venueId)}
                  className="flex-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 font-medium transition-colors"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingVenue ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm mới'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên địa điểm *
                </label>
                <input
                  type="text"
                  required
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên địa điểm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  {submitting ? 'Đang lưu...' : (editingVenue ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


