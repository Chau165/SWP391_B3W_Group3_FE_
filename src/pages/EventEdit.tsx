import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { uploadEventBanner, validateImageFile } from '../utils/imageUpload'
import { useToast } from '../contexts/ToastContext'

type TicketType = 'VIP' | 'STANDARD'

type Ticket = {
  name: TicketType
  description: string
  price: number
  maxQuantity: number
  status: 'ACTIVE'
}

export default function EventEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [speaker, setSpeaker] = useState({
    fullName: '',
    bio: '',
    email: '',
    phone: '',
    avatarUrl: ''
  })

  const [tickets, setTickets] = useState<Ticket[]>([
    { name: 'VIP', description: '', price: 0, maxQuantity: 0, status: 'ACTIVE' },
    { name: 'STANDARD', description: '', price: 0, maxQuantity: 0, status: 'ACTIVE' }
  ])

  const [bannerUrl, setBannerUrl] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

   // Removed fetching event details to avoid viewing them on this page

  const fetchEventDetails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3000/api/events/detail?id=${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Event details:', data)
        
        // Pre-fill form if data exists
        if (data.bannerUrl) {
          setBannerUrl(data.bannerUrl)
          setImagePreview(data.bannerUrl)
        }
      } else {
        throw new Error('Failed to fetch event details')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      // Remove specific phrase; show a generic error or actual error message
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }
   // Removed: fetchEventDetails function to stop showing event details

  const handleSpeakerChange = (field: keyof typeof speaker, value: string) => {
    setSpeaker(prev => ({ ...prev, [field]: value }))
  }

  const handleTicketChange = (index: number, field: keyof Ticket, value: string | number) => {
    setTickets(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedImage(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setBannerUrl('')
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedImage(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate all maxQuantity values are multiples of 10
      for (const ticket of tickets) {
        if (ticket.maxQuantity % 10 !== 0) {
          setError(`Số lượng tối đa của vé ${ticket.name} phải là bội số của 10 (10, 20, 30, ...)`)
          setIsSubmitting(false)
          return
        }
      }

      // Upload image if selected
      let finalBannerUrl = bannerUrl
      if (selectedImage) {
        finalBannerUrl = await uploadEventBanner(selectedImage)
      }

      const token = localStorage.getItem('token')
      const requestBody = {
        eventId: parseInt(id!),
        speaker: {
          fullName: speaker.fullName,
          bio: speaker.bio,
          email: speaker.email,
          phone: speaker.phone,
          avatarUrl: speaker.avatarUrl
        },
        tickets: tickets.map(ticket => ({
          name: ticket.name,
          description: ticket.description,
          price: Number(ticket.price),
          maxQuantity: Number(ticket.maxQuantity),
          status: 'ACTIVE'
        })),
        bannerUrl: finalBannerUrl
      }

      console.log('Updating event with:', requestBody)

      const response = await fetch(`http://localhost:3000/api/events/update-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        showToast('success', 'Cập nhật sự kiện thành công!')
        navigate('/dashboard/events')
      } else {
        const errorData = await response.text()
        const errorMessage = errorData || 'Failed to update event'
        showToast('error', errorMessage)
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error updating event:', error)
      setError(error instanceof Error ? error.message : 'Không thể cập nhật sự kiện')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/dashboard/events"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Cập nhật thông tin sự kiện
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Speaker Information */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin diễn giả</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={speaker.fullName}
                  onChange={(e) => handleSpeakerChange('fullName', e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiểu sử *
                </label>
                <textarea
                  value={speaker.bio}
                  onChange={(e) => handleSpeakerChange('bio', e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={speaker.email}
                    onChange={(e) => handleSpeakerChange('email', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    value={speaker.phone}
                    onChange={(e) => handleSpeakerChange('phone', e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL ảnh đại diện (tùy chọn)
                </label>
                <input
                  type="url"
                  value={speaker.avatarUrl}
                  onChange={(e) => handleSpeakerChange('avatarUrl', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin vé</h2>
            
            {tickets.map((ticket, index) => (
              <div key={ticket.name} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">
                  Vé {ticket.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mô tả *
                    </label>
                    <textarea
                      value={ticket.description}
                      onChange={(e) => handleTicketChange(index, 'description', e.target.value)}
                      required
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Giá (VNĐ) *
                      </label>
                      <input
                        type="number"
                        value={ticket.price}
                        onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                        required
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng tối đa * (bội số của 10)
                      </label>
                      <input
                        type="number"
                        value={ticket.maxQuantity}
                        onChange={(e) => handleTicketChange(index, 'maxQuantity', e.target.value)}
                        required
                        min="10"
                        step="10"
                        placeholder="10, 20, 30, ..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Banner Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner sự kiện *
            </label>
            
            {!imagePreview ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  type="file"
                  id="banner-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <label htmlFor="banner-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Kéo thả ảnh hoặc click để chọn</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Link
              to="/dashboard/events"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


