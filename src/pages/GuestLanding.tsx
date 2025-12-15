import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, Ticket, Users, ShieldCheck, Sparkles, TrendingUp, Award, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import fptLogo from '../assets/fpt-logo.png'
import fptLogoLoading from '../assets/fpt-logo-loading.png'

const stats = [
  { label: 'Sự kiện đã tổ chức', value: '250+', icon: CalendarDays },
  { label: 'Sinh viên tham gia', value: '1.000+', icon: Users },
  { label: 'Đơn vị tổ chức', value: '35+', icon: Award },
]

const benefits = [
  {
    icon: CalendarDays,
    title: 'Quản lý lịch trình',
    description:
      'Một bảng điều khiển hiện đại giúp tổ chức theo dõi từng hoạt động trong suốt vòng đời sự kiện.',
  },
  {
    icon: Ticket,
    title: 'Vé thông minh',
    description:
      'Tự động tạo vé, mã QR và quản lý check-in chỉ với một cú nhấp chuột.',
  },
  {
    icon: Users,
    title: 'Theo dõi người tham dự',
    description:
      'Nắm rõ số lượng đăng ký, tình trạng ghế ngồi và phản hồi của khách tham dự.',
  },
  {
    icon: ShieldCheck,
    title: 'Phân quyền an toàn',
    description:
      'Phù hợp cho Ban tổ chức, Bộ phận kiểm soát và Tình nguyện viên với các quyền hạn riêng biệt.',
  },
]

export default function GuestLanding() {
  const navigate = useNavigate()
  const [showLoading, setShowLoading] = useState(false)
  const [highlightedEvents, setHighlightedEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [counters, setCounters] = useState({ events: 0, students: 0, organizers: 0 })
  const [hasAnimated, setHasAnimated] = useState(false)
  const statsRef = useRef<HTMLElement>(null)
  const eventsScrollRef = useRef<HTMLDivElement>(null)
  const eventsSectionRef = useRef<HTMLElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hoveredEventId, setHoveredEventId] = useState<number | null>(null)
  const [isMouseInEvents, setIsMouseInEvents] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true)
        const response = await fetch('/api/events')
        
        if (!response.ok) {
          throw new Error('Failed to fetch events')
        }
        
        const data = await response.json()
        
        // Lấy các sự kiện đang mở (openEvents) và giới hạn 6 sự kiện
        const events = data.openEvents || []
        setHighlightedEvents(events.slice(0, 6))
      } catch (error) {
        console.error('Error fetching events:', error)
        // Nếu không kết nối được API, hiển thị thông báo
        setHighlightedEvents([])
      } finally {
        setLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateCounters()
          }
        })
      },
      { threshold: 0.3 }
    )

    if (statsRef.current) {
      observer.observe(statsRef.current)
    }

    return () => observer.disconnect()
  }, [hasAnimated])

  const animateCounters = () => {
    const duration = 2000 // 2 seconds
    const targetValues = { events: 250, students: 1000, organizers: 35 }
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0

    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setCounters({
        events: Math.floor(targetValues.events * progress),
        students: Math.floor(targetValues.students * progress),
        organizers: Math.floor(targetValues.organizers * progress)
      })

      if (currentStep >= steps) {
        clearInterval(interval)
        setCounters(targetValues)
      }
    }, stepDuration)
  }

  const checkScrollButtons = () => {
    if (eventsScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = eventsScrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scrollEvents = (direction: 'left' | 'right') => {
    if (eventsScrollRef.current) {
      const scrollAmount = 400
      const newScrollLeft = direction === 'left' 
        ? eventsScrollRef.current.scrollLeft - scrollAmount
        : eventsScrollRef.current.scrollLeft + scrollAmount
      
      eventsScrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  const handleEventsWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (eventsScrollRef.current) {
      e.preventDefault()
      e.stopPropagation()
      
      const { scrollLeft, scrollWidth, clientWidth } = eventsScrollRef.current
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 10
      const isAtStart = scrollLeft === 0

      // Scroll ngang
      if (e.deltaY > 0 && !isAtEnd) {
        eventsScrollRef.current.scrollLeft += 100
      } else if (e.deltaY < 0 && !isAtStart) {
        eventsScrollRef.current.scrollLeft -= 100
      }
    }
  }

  const handleMouseEnterEvents = () => {
    setIsMouseInEvents(true)
    document.body.style.overflow = 'hidden'
  }

  const handleMouseLeaveEvents = () => {
    setIsMouseInEvents(false)
    document.body.style.overflow = 'auto'
  }

  useEffect(() => {
    checkScrollButtons()
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      document.body.style.overflow = 'auto'
    }
  }, [highlightedEvents])

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowLoading(true)
    setTimeout(() => {
      navigate('/login')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <img 
              src={fptLogo} 
              alt="FPT Education" 
              className="h-12 w-auto"
            />
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLoginClick}
              className="rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/50 transition-all duration-300 hover:-translate-y-0.5"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-24 px-6 py-16">
        {/* Hero Section */}
        <section className="space-y-10 text-center pt-8">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-400/40 bg-orange-50/80 backdrop-blur-sm px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-orange-600 shadow-sm">
            <TrendingUp className="w-4 h-4" />
            Nền tảng quản lý sự kiện FPT
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Tổ chức 
            </span>
            <br />
            <span className="text-gray-900"> Sự kiện FPT Education</span>
          </h1>
          
          <p className="mx-auto max-w-3xl text-lg text-gray-600 sm:text-xl leading-relaxed">
            Dành cho Ban tổ chức, Bộ phận truyền thông và Câu lạc bộ trong hệ
            thống FPT Education. Dễ dàng tham gia quản lý và tổ chức các sự kiện. 
          </p>

          <div className="flex flex-wrap justify-center gap-5 pt-4">
            <button
              onClick={handleLoginClick}
              className="group rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-orange-500/50 transition-all duration-300 hover:shadow-orange-500/70 hover:-translate-y-1"
            >
              <span className="flex items-center gap-2">
                Đăng nhập để bắt đầu
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </span>
            </button>
            <a
              href="#events"
              className="rounded-full border-2 border-orange-300 bg-white px-8 py-4 text-base font-bold text-gray-700 shadow-lg transition-all duration-300 hover:border-orange-500 hover:shadow-xl hover:-translate-y-1"
            >
              Xem sự kiện nổi bật
            </a>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="grid gap-6 sm:grid-cols-3">
          {/* Sự kiện đã tổ chức */}
          <div className="group relative overflow-hidden rounded-3xl border-2 border-white bg-white/80 backdrop-blur-sm p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-orange-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-3">
              <CalendarDays className="w-12 h-12 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {counters.events}+
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                Sự kiện đã tổ chức
              </p>
            </div>
          </div>

          {/* Sinh viên tham gia */}
          <div className="group relative overflow-hidden rounded-3xl border-2 border-white bg-white/80 backdrop-blur-sm p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-orange-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-3">
              <Users className="w-12 h-12 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {counters.students.toLocaleString('vi-VN')}+
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                Sinh viên tham gia
              </p>
            </div>
          </div>

          {/* Đơn vị tổ chức */}
          <div className="group relative overflow-hidden rounded-3xl border-2 border-white bg-white/80 backdrop-blur-sm p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-orange-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
            <div className="relative space-y-3">
              <Award className="w-12 h-12 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
              <p className="text-5xl font-extrabold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                {counters.organizers}+
              </p>
              <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                Đơn vị tổ chức
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="space-y-12">
          <header className="space-y-4 text-center">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-orange-600">
              <Sparkles className="w-4 h-4" />
              Tính năng
            </p>
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Tất cả trong một
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Thiết kế dành riêng cho nhu cầu vận hành sự kiện nội bộ FPT.
            </p>
          </header>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="group relative overflow-hidden rounded-2xl border-2 border-white bg-white/80 backdrop-blur-sm p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-orange-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="relative space-y-4">
                  <div className="inline-flex rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 p-4 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon size={28} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events Section */}
        <section id="events" ref={eventsSectionRef} className="space-y-12">
          <header className="space-y-4 text-center">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.3em] text-orange-600">
              <CalendarDays className="w-4 h-4" />
              Sự kiện
            </p>
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Hoạt động nổi bật
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Một số chương trình đang thu hút đông đảo sinh viên.
            </p>
          </header>

          {loadingEvents ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-6 animate-pulse">
                <CalendarDays className="w-12 h-12 text-orange-600" />
              </div>
              <p className="text-xl font-semibold text-gray-500">Đang tải sự kiện...</p>
            </div>
          ) : highlightedEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 mb-6">
                <CalendarDays className="w-12 h-12 text-orange-600" />
              </div>
              <p className="text-xl font-semibold text-gray-500">Chưa có sự kiện nào</p>
              <p className="text-gray-400 mt-2">Hãy quay lại sau để xem các sự kiện mới nhất</p>
            </div>
          ) : (
            <div 
              className="relative"
              onWheel={handleEventsWheel}
              onMouseEnter={handleMouseEnterEvents}
              onMouseLeave={handleMouseLeaveEvents}
            >
              {/* Navigation Buttons */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollEvents('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 group"
                >
                  <ChevronLeft className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </button>
              )}
              {canScrollRight && (
                <button
                  onClick={() => scrollEvents('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full hover:bg-orange-500 hover:text-white transition-all duration-300 group"
                >
                  <ChevronRight className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </button>
              )}

              {/* Scrollable Events Container */}
              <div 
                ref={eventsScrollRef}
                onScroll={checkScrollButtons}
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollBehavior: 'smooth' }}
              >
                {highlightedEvents.map((event: any) => (
                  <div
                    key={event.eventId}
                    onMouseEnter={() => setHoveredEventId(event.eventId)}
                    onMouseLeave={() => setHoveredEventId(null)}
                    onClick={handleLoginClick}
                    className="relative flex-shrink-0 w-[380px] overflow-hidden rounded-3xl border-2 border-white bg-white/80 backdrop-blur-sm transition-all duration-500 hover:border-orange-500 cursor-pointer"
                    style={{
                      transform: hoveredEventId === event.eventId ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    {event.bannerUrl && (
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={event.bannerUrl} 
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500"
                          style={{
                            transform: hoveredEventId === event.eventId ? 'scale(1.1)' : 'scale(1)',
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      </div>
                    )}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-full -mr-16 -mt-16 transition-transform duration-500"
                      style={{
                        transform: hoveredEventId === event.eventId ? 'scale(1.5)' : 'scale(1)',
                      }}
                    ></div>
                    <div className="relative p-6 space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-600">
                        <Sparkles className="w-3 h-3" />
                        {event.status}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 transition-colors duration-300"
                        style={{
                          color: hoveredEventId === event.eventId ? '#ea580c' : '',
                        }}
                      >
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                      <div className="space-y-2 text-sm text-gray-500">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(event.startTime).toLocaleString('vi-VN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                        {event.venueName && (
                          <p className="flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            {event.venueName}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.maxSeats} chỗ ngồi
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-12 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          <div className="relative space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            </div>
            <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
              Sẵn sàng nâng cấp trải nghiệm sự kiện?
            </h2>
            <p className="mt-4 text-xl text-blue-50 max-w-3xl mx-auto leading-relaxed">
              Đăng nhập bằng tài khoản nội bộ để truy cập bảng điều khiển dành
              cho Event Organizer, Staff và Volunteer.
            </p>
            <button
              onClick={handleLoginClick}
              className="group inline-flex items-center gap-3 mt-8 rounded-full bg-white px-10 py-5 text-lg font-bold text-blue-600 shadow-2xl transition-all duration-300 hover:shadow-white/30 hover:-translate-y-1 hover:scale-105"
            >
              Đăng nhập hệ thống
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-white/50 bg-white/60 backdrop-blur-sm py-8 mt-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={fptLogo} 
              alt="FPT Education" 
              className="h-10 w-auto"
            />
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} FPT Education Events Platform · Designed for SWP391 B3W Group 3
          </p>
        </div>
      </footer>

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

