import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState, useEffect } from 'react'
import type { EventDetail as EventDetailType } from '../types/event'
import { EventDetailModal } from '../components/events/EventDetailModal'

export default function EventDetail() {
  const { id } = useParams()
  const { user, token } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'

  // ========== LOAD EVENT DETAILS ==========
  useEffect(() => {
    const fetchEvent = async () => {
      if (!id || !token) return

      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`http://localhost:3000/api/events/detail?id=${id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch event details')
        }

        const data = await response.json()
        setEvent(data)
      } catch (err: any) {
        console.error('Error fetching event:', err)
        setError(err.message || 'Không thể tải thông tin sự kiện')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id, token])

  const handleEdit = () => {
    navigate(`/dashboard/events/${id}/edit`)
  }

  const handleModalClose = () => {
    navigate('/dashboard/events')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 p-4">
      <div className="max-w-5xl mx-auto">
        <EventDetailModal
          isOpen={true}
          onClose={handleModalClose}
          event={event}
          loading={loading}
          error={error}
          token={token}
          userRole={user?.role}
          onEdit={isOrganizer ? handleEdit : undefined}
        />
      </div>
    </div>
  )
}


