import { useState, useEffect } from 'react'
import { PlusCircle, Building2, Search } from 'lucide-react'
import { Venue, Area, venueService, areaService } from '../services/venueService'
import VenueList from '../components/venues/VenueList'
import VenueFormModal from '../components/venues/VenueFormModal'
import AreaListSection from '../components/venues/AreaListSection'
import AreaFormModal from '../components/venues/AreaFormModal'
import { useToast } from '../contexts/ToastContext'
import ConfirmModal from '../components/common/ConfirmModal'

export default function Venues() {
  const [search, setSearch] = useState('')
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null)

  const fetchVenues = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.error('No authentication token found')
        setVenues([])
        return
      }

      const venues = await venueService.getAll()
      
      // Fetch areas for each venue
      const venuesWithAreas = await Promise.all(
        venues.map(async (venue) => {
          const areas = await areaService.getByVenueId(venue.venueId)
          return { ...venue, areas }
        })
      )
      
      setVenues(venuesWithAreas)
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

  // Venue handlers
  const handleOpenVenueModal = (venue?: Venue) => {
    setEditingVenue(venue || null)
    setIsVenueModalOpen(true)
  }

  const handleSelectVenue = async (venue: Venue) => {
    const freshAreas = await areaService.getByVenueId(venue.venueId)
    setSelectedVenue({ ...venue, areas: freshAreas })
  }

  const handleSubmitVenue = async (data: { venueId: number; venueName: string; address: string }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('error', 'Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      if (editingVenue) {
        await venueService.update(data)
      } else {
        await venueService.create(data)
      }
      
      await fetchVenues()
    } catch (error) {
      console.error('Error saving venue:', error)
      showToast('error', 'Có lỗi xảy ra khi lưu địa điểm')
      throw error
    }
  }

  const performDeleteVenue = async (venueId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('error', 'Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      await venueService.delete(venueId)
      await fetchVenues()
      showToast('success', 'Xóa địa điểm thành công!')
    } catch (error) {
      console.error('Error deleting venue:', error)
      showToast('error', 'Có lỗi xảy ra khi xóa địa điểm')
    } finally {
      setConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  const handleDeleteVenue = (venueId: number) => {
    setConfirmMessage('Bạn có chắc chắn muốn xóa địa điểm này?')
    setConfirmAction(() => () => performDeleteVenue(venueId))
    setConfirmOpen(true)
  }

  // Area handlers
  const handleOpenAreaModal = (area?: Area) => {
    setEditingArea(area || null)
    setIsAreaModalOpen(true)
  }

  const handleSubmitArea = async (data: {
    areaId: number
    venueId: number
    areaName: string
    floor: number
    capacity: number
    status: string
  }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('error', 'Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      if (editingArea) {
        await areaService.update(data)
        showToast('success', 'Cập nhật phòng thành công!')
      } else {
        await areaService.create(data)
        showToast('success', 'Thêm phòng thành công!')
      }
      
      fetchVenues()
      
      if (selectedVenue) {
        const freshAreas = await areaService.getByVenueId(selectedVenue.venueId)
        setSelectedVenue({ ...selectedVenue, areas: freshAreas })
      }
    } catch (error) {
      console.error('Error saving area:', error)
      showToast('error', `Có lỗi xảy ra khi ${editingArea ? 'cập nhật' : 'thêm'} phòng`)
      throw error
    }
  }

  const performDeleteArea = async (areaId: number) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        showToast('error', 'Bạn cần đăng nhập để thực hiện thao tác này')
        return
      }

      await areaService.delete(areaId)
      showToast('success', 'Xóa phòng thành công!')

      fetchVenues()

      if (selectedVenue) {
        const freshAreas = await areaService.getByVenueId(selectedVenue.venueId)
        setSelectedVenue({ ...selectedVenue, areas: freshAreas })
      }
    } catch (error) {
      console.error('Error deleting area:', error)
      showToast('error', 'Có lỗi xảy ra khi xóa phòng')
    } finally {
      setConfirmOpen(false)
      setConfirmAction(null)
    }
  }

  const handleDeleteArea = (areaId: number) => {
    setConfirmMessage('Bạn có chắc chắn muốn xóa phòng này?')
    setConfirmAction(() => () => performDeleteArea(areaId))
    setConfirmOpen(true)
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
          onClick={() => handleOpenVenueModal()}
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
        <VenueList
          venues={filtered}
          selectedVenueId={selectedVenue?.venueId || null}
          onSelect={handleSelectVenue}
          onEdit={handleOpenVenueModal}
          onDelete={handleDeleteVenue}
        />
      )}

      {selectedVenue && (
        <AreaListSection
          venueName={selectedVenue.venueName}
          venueAddress={selectedVenue.address}
          areas={selectedVenue.areas || []}
          onClose={() => setSelectedVenue(null)}
          onAdd={() => handleOpenAreaModal()}
          onEdit={handleOpenAreaModal}
          onDelete={handleDeleteArea}
        />
      )}

      <VenueFormModal
        isOpen={isVenueModalOpen}
        venue={editingVenue}
        onClose={() => setIsVenueModalOpen(false)}
        onSubmit={handleSubmitVenue}
      />

      <AreaFormModal
        isOpen={isAreaModalOpen}
        area={editingArea}
        venueId={selectedVenue?.venueId || 0}
        onClose={() => setIsAreaModalOpen(false)}
        onSubmit={handleSubmitArea}
      />
      <ConfirmModal
        isOpen={confirmOpen}
        message={confirmMessage}
        onConfirm={() => confirmAction && confirmAction()}
        onClose={() => { setConfirmOpen(false); setConfirmAction(null) }}
      />
    </div>
  )
}


