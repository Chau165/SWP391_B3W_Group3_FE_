import { useParams, useNavigate, Link } from 'react-router-dom'
import { Upload, X, Plus, Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
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
  const [expectedCapacity, setExpectedCapacity] = useState<number>(0)
  const [isEventOpen, setIsEventOpen] = useState<boolean>(false)
  
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
  
  const [selectedAvatarImage, setSelectedAvatarImage] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false)
  
  // Track if we've already shown the capacity warning
  const hasShownWarningRef = useRef(false)

  // Fetch event request to get expectedCapacity
  useEffect(() => {
    const fetchEventRequest = async () => {
      try {
        const token = localStorage.getItem('token')
        
        // Fetch all event requests to find the one matching this event ID
        const response = await fetch('http://localhost:3000/api/event-requests/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Handle both array and object structure
          let allRequests = []
          if (Array.isArray(data)) {
            allRequests = data
          } else {
            allRequests = [
              ...(Array.isArray(data.pending) ? data.pending : []),
              ...(Array.isArray(data.approved) ? data.approved : []),
              ...(Array.isArray(data.rejected) ? data.rejected : [])
            ]
          }
          
          // Find the request that created this event
          const matchingRequest = allRequests.find(
            (req: any) => req.createdEventId === parseInt(id!)
          )
          
          if (matchingRequest && matchingRequest.expectedCapacity) {
            setExpectedCapacity(matchingRequest.expectedCapacity)
            console.log('Expected capacity from request:', matchingRequest.expectedCapacity)
          }
        }
      } catch (error) {
        console.error('Error fetching event request:', error)
      }
    }

    if (id) {
      fetchEventRequest()
    }
  }, [id])

  // Fetch event details on mount to pre-fill the form (speaker, tickets, banner)
  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchEventDetails()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

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

        // Determine status first
        const statusStr = data.status ? String(data.status).toUpperCase() : ''
        const isOpen = statusStr === 'OPEN'
        setIsEventOpen(isOpen)

        if (isOpen) {
          // Only pre-fill when event is OPEN: show existing speaker/tickets/banner and lock quantities
          if (data.bannerUrl) {
            setBannerUrl(data.bannerUrl)
            setImagePreview(data.bannerUrl)
          }

          // Speaker: tolerant to different API shapes (array, nested, or top-level variants)
          const speakerFromApi = (() => {
            if (Array.isArray(data.speakers) && data.speakers.length > 0) return data.speakers[0]
            if (data.speaker) return data.speaker
            return {
              fullName:
                data.speakerFullName || data.speakerName || data.speaker_full_name || data.speakerFullname || data.speaker || '',
              bio:
                data.speakerBio || data.speaker_bio || data.speakerDescription || data.speaker_description || '',
              email:
                data.speakerEmail || data.speaker_email || data.contactEmail || data.contact_email || data.email || '',
              phone:
                data.speakerPhone || data.speaker_phone || data.phone || data.phoneNumber || data.mobile || data.contactPhone || data.contact_phone || '',
              avatarUrl:
                data.speakerAvatarUrl || data.speaker_avatar_url || data.avatarUrl || data.speakerAvatar || data.speaker_avatar || ''
            }
          })()

          if (speakerFromApi) {
            setSpeaker(prev => ({
              ...prev,
              fullName: speakerFromApi.fullName || '',
              bio: speakerFromApi.bio || '',
              email: speakerFromApi.email || '',
              phone: speakerFromApi.phone || '',
              avatarUrl: speakerFromApi.avatarUrl || ''
            }))
            if (speakerFromApi.avatarUrl) setAvatarPreview(speakerFromApi.avatarUrl)
          }

          // Tickets: prefill price, description and maxQuantity
          if (Array.isArray(data.tickets) && data.tickets.length > 0) {
            const mapped = data.tickets.map((tk: any) => ({
              name: tk.name || 'STANDARD',
              description: tk.description || '',
              price: Number(tk.price) || 0,
              maxQuantity: Number(tk.maxQuantity) || 0,
              status: tk.status || 'ACTIVE'
            }))
            setTickets(mapped)
          }

        } else {
          // If event is CLOSED (or not OPEN), do NOT prefill speaker/tickets/banner
          // Keep defaults so organizer can enter new speaker/ticket info and edit quantities
          setBannerUrl('')
          setImagePreview(null)
          setSpeaker({ fullName: '', bio: '', email: '', phone: '', avatarUrl: '' })
          setAvatarPreview(null)
          // Reset tickets to defaults (allow editing quantities)
          setTickets([
            { name: 'VIP', description: '', price: 0, maxQuantity: 0, status: 'ACTIVE' },
            { name: 'STANDARD', description: '', price: 0, maxQuantity: 0, status: 'ACTIVE' }
          ])
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
      // Convert numeric fields to numbers to prevent string concatenation
      const convertedValue = (field === 'price' || field === 'maxQuantity') 
        ? (value === '' ? 0 : Number(value))
        : value
      updated[index] = { ...updated[index], [field]: convertedValue }
      
      // Validate total maxQuantity against expectedCapacity
      if (field === 'maxQuantity' && expectedCapacity > 0) {
        let numValue = typeof value === 'string' ? parseInt(value, 10) : value
        // Handle NaN or empty string
        if (isNaN(numValue) || numValue < 0) {
          numValue = 0
        }
        
        // Calculate total maxQuantity including the new value
        const totalMaxQuantity = updated.reduce((sum, ticket) => {
          return sum + (Number(ticket.maxQuantity) || 0)
        }, 0)
        
        if (totalMaxQuantity > expectedCapacity) {
          // Only show toast once per input session
          if (!hasShownWarningRef.current) {
            showToast('warning', `Tổng số lượng tối đa của tất cả vé (${totalMaxQuantity}) không được vượt quá ${expectedCapacity} (số lượng dự kiến từ yêu cầu)`)
            hasShownWarningRef.current = true
            // Reset after 2 seconds to allow showing again if needed
            setTimeout(() => {
              hasShownWarningRef.current = false
            }, 2000)
          }
          // Revert the change
          updated[index] = prev[index]
          return updated
        }
      }
      
      return updated
    })
  }

  const MAX_TICKETS = 2 // Maximum number of ticket types allowed

  const handleAddTicket = () => {
    if (isEventOpen) {
      showToast('warning', 'Không thể thêm loại vé khi sự kiện đang mở')
      return
    }
    if (tickets.length >= MAX_TICKETS) {
      showToast('warning', `Tối đa chỉ được thêm ${MAX_TICKETS} loại vé`)
      return
    }
    const newTicketName: TicketType = tickets.length % 2 === 0 ? 'VIP' : 'STANDARD'
    setTickets(prev => [...prev, {
      name: newTicketName,
      description: '',
      price: 0,
      maxQuantity: 0,
      status: 'ACTIVE'
    }])
  }

  const handleRemoveTicket = (index: number) => {
    if (isEventOpen) {
      showToast('warning', 'Không thể xóa loại vé khi sự kiện đang mở')
      return
    }
    if (tickets.length <= 1) {
      setError('Phải có ít nhất 1 loại vé')
      return
    }
    setTickets(prev => prev.filter((_, i) => i !== index))
  }

  const handleTicketTypeChange = (index: number, newType: TicketType) => {
    setTickets(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], name: newType }
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedAvatarImage(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = () => {
    setSelectedAvatarImage(null)
    setAvatarPreview(null)
    setSpeaker(prev => ({ ...prev, avatarUrl: '' }))
    setError(null)
  }

  const handleAvatarDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingAvatar(true)
  }

  const handleAvatarDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingAvatar(false)
  }

  const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingAvatar(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setSelectedAvatarImage(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
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
      
      // Validate total maxQuantity doesn't exceed expectedCapacity
      if (expectedCapacity > 0) {
        const totalMaxQuantity = tickets.reduce((sum, ticket) => sum + ticket.maxQuantity, 0)
        if (totalMaxQuantity > expectedCapacity) {
          setError(`Tổng số lượng tối đa của tất cả vé (${totalMaxQuantity}) không được vượt quá số lượng dự kiến (${expectedCapacity})`)
          setIsSubmitting(false)
          return
        }
      }

      // Upload banner image if selected
      let finalBannerUrl = bannerUrl
      if (selectedImage) {
        finalBannerUrl = await uploadEventBanner(selectedImage)
      }

      // Upload avatar image if selected
      let finalAvatarUrl = speaker.avatarUrl
      if (selectedAvatarImage) {
        finalAvatarUrl = await uploadEventBanner(selectedAvatarImage)
      }

      const token = localStorage.getItem('token')
      const requestBody = {
        eventId: parseInt(id!),
        speaker: {
          fullName: speaker.fullName,
          bio: speaker.bio,
          email: speaker.email,
          phone: speaker.phone,
          avatarUrl: finalAvatarUrl
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
    <div className="flex justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          Cập nhật thông tin sự kiện
        </h1>

        {/* Informational banner when event is CLOSED */}
        {!isEventOpen && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
            Sự kiện hiện đang không ở trạng thái mở (CLOSED). Form sẽ không tự động điền dữ liệu hiện tại — vui lòng nhập thông tin mới. Bạn vẫn có thể chỉnh sửa số lượng vé.
          </div>
        )}

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
                  Ảnh đại diện diễn giả (tùy chọn)
                </label>
                
                {!avatarPreview ? (
                  <div 
                    onDragOver={handleAvatarDragOver}
                    onDragLeave={handleAvatarDragLeave}
                    onDrop={handleAvatarDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDraggingAvatar 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 mb-1 text-sm">Kéo thả ảnh hoặc click để chọn</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar Preview"
                      className="w-32 h-32 object-cover rounded-full mx-auto border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute top-0 right-1/2 translate-x-16 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div className="border-b pb-6">
                <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Thông tin vé</h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddTicket}
                  disabled={tickets.length >= MAX_TICKETS || isEventOpen}
                  className={`inline-flex items-center px-4 py-2 text-white text-sm rounded-lg transition-colors ${
                    tickets.length >= MAX_TICKETS || isEventOpen
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm loại vé ({tickets.length}/{MAX_TICKETS})
                </button>
                {isEventOpen && (
                  <span className="text-sm text-red-600">Sự kiện đang mở — không thể thay đổi số lượng vé</span>
                )}
              </div>
            </div>
            
            {tickets.map((ticket, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại vé *
                    </label>
                    <select
                      value={ticket.name}
                      onChange={(e) => handleTicketTypeChange(index, e.target.value as TicketType)}
                      className="w-48 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="VIP">VIP</option>
                      <option value="STANDARD">STANDARD</option>
                    </select>
                  </div>
                  
                  {tickets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTicket(index)}
                      disabled={isEventOpen}
                      className={`p-2 rounded-lg transition-colors ${isEventOpen ? 'text-gray-400 hover:bg-transparent cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                      title={isEventOpen ? 'Không thể xóa khi sự kiện đang mở' : 'Xóa loại vé'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
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
                        // Make maxQuantity read-only when event is open
                        readOnly={isEventOpen}
                        onChange={(e) => handleTicketChange(index, 'maxQuantity', e.target.value)}
                        required
                        min="10"
                        step="10"
                        placeholder="10, 20, 30, ..."
                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg ${isEventOpen ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`}
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