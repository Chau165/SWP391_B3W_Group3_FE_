import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Menu, X, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import fptLogo from '../assets/fpt-logo.png'
import fptLogoLoading from '../assets/fpt-logo-loading.png'
import { getMyNotifications, type NotificationItem } from '../services/notificationService'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLoading, setShowLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  // Show loading overlay when location changes
  useEffect(() => {
    setShowLoading(true)
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [location.pathname])

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return
      
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        
        setLoadingNotifications(true)
        const data = await getMyNotifications(token)
        
        // Get read notifications from localStorage
        const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}')
        
        // Merge with localStorage read status
        const mergedData = data.map(notification => ({
          ...notification,
          read: readNotifications[notification.id] === true || notification.read
        }))
        
        setNotifications(mergedData)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    fetchNotifications()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark as read immediately in frontend state
    setNotifications(prev => 
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    )
    
    // Save to localStorage
    const readNotifications = JSON.parse(localStorage.getItem('readNotifications') || '{}')
    readNotifications[notification.id] = true
    localStorage.setItem('readNotifications', JSON.stringify(readNotifications))
    
    // TODO: Call backend API to mark notification as read permanently
    // try {
    //   const token = localStorage.getItem('token')
    //   await fetch(`/api/notifications/${notification.id}/read`, {
    //     method: 'PUT',
    //     headers: {
    //       'Authorization': `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //   })
    // } catch (error) {
    //   console.error('Failed to mark notification as read:', error)
    // }
    
    let targetUrl = notification.linkUrl
    
    // Map /events to /dashboard/event-requests for organizers
    if (user?.role === 'ORGANIZER' && targetUrl?.startsWith('/events')) {
      targetUrl = '/dashboard/event-requests'
    } else if (targetUrl?.startsWith('/events')) {
      targetUrl = `/dashboard${targetUrl}`
    } else if (targetUrl && !targetUrl.startsWith('/dashboard')) {
      targetUrl = `/dashboard${targetUrl}`
    }
    
    if (targetUrl) {
      navigate(targetUrl)
      setShowNotifications(false)
    }
  }

  const isOrganizer = user?.role === 'ORGANIZER'
  const isStaff = user?.role === 'STAFF'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img src={fptLogo} alt="FPT Education" className="h-12 w-auto" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/events"
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
              >
                Sự kiện
              </Link>
              {isOrganizer && (
                <Link
                  to="/dashboard/events/create"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/50 transition-all"
                >
                  Tạo sự kiện
                </Link>
              )}
              {(user?.role === 'ORGANIZER' || isStaff) && (
                <Link
                  to="/dashboard/event-requests"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                >
                  {isStaff ? 'Quản lý yêu cầu' : 'Yêu cầu của tôi'}
                </Link>
              )}
              {user?.role === 'ORGANIZER' && (
                <>
                  <Link
                    to="/dashboard/check-in"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    Check-in
                  </Link>
                </>
              )}
              {!isOrganizer && !isStaff && (
                <>
                  <Link
                    to="/dashboard/my-tickets"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    Vé của tôi
                  </Link>
                  <Link
                    to="/dashboard/bills"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    Hóa đơn
                  </Link>
                </>
              )}
              {isStaff && (
                <>
                  <Link
                    to="/dashboard/venues"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    Địa điểm
                  </Link>
                  <Link
                    to="/dashboard/reports"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-all"
                  >
                    Báo cáo
                  </Link>
                </>
              )}
            </nav>

            {/* User Info */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all relative"
                  title="Thông báo"
                >
                  <Bell size={20} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs font-medium text-orange-600">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all"
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
                    to="/dashboard/check-in"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Check-in
                  </Link>
                </>
              )}
              {!isOrganizer && !isStaff && (
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

      {/* Notification Dropdown */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
          
          {/* Dropdown Panel */}
          <div className="fixed top-16 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Thông báo</h2>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {loadingNotifications ? (
                <div className="p-8 text-center text-gray-500">
                  Đang tải thông báo...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Chưa có thông báo nào.
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`h-2.5 w-2.5 rounded-full ${
                            !notification.read ? 'bg-blue-500' : 'bg-transparent'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm mb-1 ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-800'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            {notification.content}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            {format(new Date(notification.createdAt), 'PPp', { locale: vi })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Loading Overlay */}
      {showLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
          <div className="flex flex-col items-center gap-6">
            <img 
              src={fptLogoLoading} 
              alt="FPT Education" 
              className="h-24 w-auto animate-pulse"
            />
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-orange-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="h-3 w-3 rounded-full bg-orange-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="h-3 w-3 rounded-full bg-orange-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



