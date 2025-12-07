import { X } from 'lucide-react'
import { useState, useEffect } from 'react'

type Area = {
  areaId: number
  areaName: string
  capacity: number
}

type ProcessRequestModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (areaId: number, organizerNote: string) => void
  action: 'APPROVE' | 'REJECT'
  request: {
    requestId: number
    title: string
    preferredStartTime?: string
    preferredEndTime?: string
  } | null
}

export function ProcessRequestModal({
  isOpen,
  onClose,
  onSubmit,
  action,
  request
}: ProcessRequestModalProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAreaId, setSelectedAreaId] = useState<number>(0)
  const [organizerNote, setOrganizerNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Modal state:', { isOpen, action, hasRequest: !!request, preferredStartTime: request?.preferredStartTime, preferredEndTime: request?.preferredEndTime })
    if (isOpen && action === 'APPROVE' && request?.preferredStartTime && request?.preferredEndTime) {
      console.log('Fetching available areas...')
      fetchAvailableAreas()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, action, request?.requestId, request?.preferredStartTime, request?.preferredEndTime])

  const fetchAvailableAreas = async () => {
    if (!request?.preferredStartTime || !request?.preferredEndTime) return

    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      
      // Format the datetime for the API - remove milliseconds and ensure ISO format
      const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr)
        // Format as: YYYY-MM-DDTHH:mm:ss
        return date.toISOString().slice(0, 19)
      }
      
      const startTime = formatDateTime(request.preferredStartTime)
      const endTime = formatDateTime(request.preferredEndTime)
      
      console.log('Original times:', { start: request.preferredStartTime, end: request.preferredEndTime })
      console.log('Formatted times:', { startTime, endTime })
      
      const url = `http://localhost:3000/api/areas/free?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`
      console.log('Fetching areas from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('Areas response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Available areas:', data)
        
        // Extract areas array from response object
        const areasArray = Array.isArray(data.areas) ? data.areas : []
        setAreas(areasArray)
        
        if (areasArray.length > 0) {
          setSelectedAreaId(areasArray[0].areaId)
        }
      } else {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        throw new Error('Failed to fetch available areas')
      }
    } catch (error) {
      console.error('Error fetching areas:', error)
      setError('Không thể tải danh sách khu vực. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (action === 'APPROVE' && selectedAreaId === 0) {
      alert('Vui lòng chọn khu vực cho sự kiện')
      return
    }

    onSubmit(selectedAreaId, organizerNote)
    handleClose()
  }

  const handleClose = () => {
    setSelectedAreaId(0)
    setOrganizerNote('')
    setError(null)
    onClose()
  }

  if (!isOpen || !request) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {action === 'APPROVE' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sự kiện
            </label>
            <p className="text-sm text-gray-600">{request.title}</p>
          </div>

          {action === 'APPROVE' && (
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Chọn khu vực <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-gray-500 mb-2">
                Debug: Loading={loading.toString()}, Areas count={areas.length}, Error={error || 'none'}
              </div>
              {loading ? (
                <p className="text-sm text-gray-500">Đang tải khu vực khả dụng...</p>
              ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
              ) : areas.length === 0 ? (
                <p className="text-sm text-red-500">
                  Không có khu vực nào khả dụng trong khung thời gian này
                </p>
              ) : (
                <select
                  id="area"
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {areas.map((area) => (
                    <option key={area.areaId} value={area.areaId}>
                      {area.areaName} (Sức chứa: {area.capacity})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú cho người tổ chức
            </label>
            <textarea
              id="note"
              value={organizerNote}
              onChange={(e) => setOrganizerNote(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Nhập ghi chú (không bắt buộc)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={action === 'APPROVE' && (loading || areas.length === 0)}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                action === 'APPROVE'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {action === 'APPROVE' ? 'Duyệt' : 'Từ chối'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
