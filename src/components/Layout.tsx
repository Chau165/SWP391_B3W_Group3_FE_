import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'STAFF'
  const isStaff = user?.role === 'STAFF'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-blue-600">
                FPT Events
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/events"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sự kiện
              </Link>
              {isOrganizer && (
                <Link
                  to="/dashboard/events/create"
                  className="px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  Tạo sự kiện
                </Link>
              )}
              {(user?.role === 'ORGANIZER' || isStaff) && (
                <Link
                  to="/dashboard/event-requests"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {isStaff ? 'Quản lý yêu cầu' : 'Yêu cầu của tôi'}
                </Link>
              )}
              {user?.role === 'ORGANIZER' && (
                <>
                  <Link
                    to="/dashboard/speakers"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Diễn giả
                  </Link>
                  <Link
                    to="/dashboard/venues"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Địa điểm
                  </Link>
                </>
              )}
              {!isOrganizer && (
                <>
                  <Link
                    to="/dashboard/my-tickets"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Vé của tôi
                  </Link>
                  <Link
                    to="/dashboard/bills"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Hóa đơn
                  </Link>
                </>
              )}
              {isStaff && (
                <>
                  <Link
                    to="/dashboard/venues"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Địa điểm
                  </Link>
                  <Link
                    to="/dashboard/check-in"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Check-in
                  </Link>
                  <Link
                    to="/dashboard/reports"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Báo cáo
                  </Link>
                </>
              )}
            </nav>

            {/* User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="px-4 py-2 space-y-1">
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/events"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sự kiện
              </Link>
              {isOrganizer && (
                <Link
                  to="/dashboard/events/create"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tạo sự kiện
                </Link>
              )}
              {(user?.role === 'ORGANIZER' || isStaff) && (
                <Link
                  to="/dashboard/event-requests"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {isStaff ? 'Quản lý yêu cầu' : 'Yêu cầu của tôi'}
                </Link>
              )}
              {user?.role === 'ORGANIZER' && (
                <>
                  <Link
                    to="/dashboard/speakers"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Diễn giả
                  </Link>
                  <Link
                    to="/dashboard/venues"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Địa điểm
                  </Link>
                </>
              )}
              {!isOrganizer && (
                <>
                  <Link
                    to="/dashboard/my-tickets"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vé của tôi
                  </Link>
                  <Link
                    to="/dashboard/bills"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Hóa đơn
                  </Link>
                </>
              )}
              {isStaff && (
                <>
                  <Link
                    to="/dashboard/venues"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Địa điểm
                  </Link>
                  <Link
                    to="/dashboard/check-in"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Check-in
                  </Link>
                  <Link
                    to="/dashboard/reports"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Báo cáo
                  </Link>
                </>
              )}
              <div className="px-3 py-2 border-t mt-2">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
                <button
                  onClick={handleLogout}
                  className="mt-2 w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}



