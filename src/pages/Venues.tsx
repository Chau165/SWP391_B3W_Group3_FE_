import { useState } from 'react'
import { MapPin, PlusCircle, Building2, Search } from 'lucide-react'

type Venue = {
  id: string
  name: string
  address: string
  capacity: number
}

// TODO: Fetch venues from API
const venues: Venue[] = []

export default function Venues() {
  const [search, setSearch] = useState('')

  const filtered = venues.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Địa điểm</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các địa điểm tổ chức sự kiện.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Thêm địa điểm (mock)
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Tìm theo tên địa điểm..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 border-none outline-none text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-10 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Chưa có địa điểm nào</p>
          <p className="text-sm text-gray-400 mt-2">
            Khi bạn thêm địa điểm hoặc kết nối API, danh sách sẽ hiển thị tại
            đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(venue => (
            <div
              key={venue.id}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{venue.name}</p>
                  <p className="text-xs text-gray-500">
                    Sức chứa: {venue.capacity} người
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 flex-1">{venue.address}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


