import { Link } from 'react-router-dom'
import { CalendarDays, Ticket, Users, ShieldCheck } from 'lucide-react'

const stats = [
  { label: 'Sự kiện đã tổ chức', value: '250+' },
  { label: 'Sinh viên tham gia', value: '12.000+' },
  { label: 'Đơn vị tổ chức', value: '35+' },
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
  const highlightedEvents: any[] = []

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/90 shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-blue-600"
          >
            FPT Events
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <section className="space-y-8 text-center">
          <p className="inline-flex rounded-full border border-blue-400/40 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
            Nền tảng quản lý sự kiện FPT
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl text-gray-900">
            Trải nghiệm tổ chức sự kiện{' '}
            <span className="text-blue-600">thông minh</span> và{' '}
            <span className="text-blue-600">nhanh chóng</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-gray-600 sm:text-lg">
            Dành cho Ban tổ chức, Bộ phận truyền thông và Câu lạc bộ trong hệ
            thống FPT Education. Tất cả công việc được gom gọn trong một bảng
            điều khiển duy nhất.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700"
            >
              Đăng nhập để bắt đầu
            </Link>
            <a
              href="#events"
              className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Xem sự kiện nổi bật
            </a>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-lg sm:grid-cols-3">
          {stats.map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-blue-600">{stat.value}</p>
              <p className="text-sm uppercase tracking-widest text-gray-600">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <header className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-600">
              Tính năng
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Tất cả trong một
            </h2>
            <p className="text-gray-600">
              Thiết kế dành riêng cho nhu cầu vận hành sự kiện nội bộ FPT.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {benefits.map(benefit => (
              <div
                key={benefit.title}
                className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-md transition hover:border-blue-400 hover:shadow-lg"
              >
                <div className="inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
                  <benefit.icon size={24} />
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {benefit.title}
                </p>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="events" className="space-y-6">
          <header className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-blue-600">
              Sự kiện
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              Hoạt động nổi bật
            </h2>
            <p className="text-gray-600">
              Một số chương trình đang thu hút đông đảo sinh viên.
            </p>
          </header>

          {highlightedEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Chưa có sự kiện nào</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {highlightedEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm uppercase tracking-widest text-blue-600">
                        {event.eventType}
                      </p>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {event.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {event.description}
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>
                        {new Date(event.startDate).toLocaleString('vi-VN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      <p>{event.location}</p>
                    </div>
                    <p className="text-sm font-semibold text-blue-600">
                      {event.currentParticipants}/{event.maxParticipants} người
                      đăng ký
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center shadow-lg">
          <h2 className="text-3xl font-bold text-gray-900">
            Sẵn sàng nâng cấp trải nghiệm sự kiện?
          </h2>
          <p className="mt-3 text-gray-600">
            Đăng nhập bằng tài khoản nội bộ để truy cập bảng điều khiển dành
            cho Event Organizer, Staff và Volunteer.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 hover:-translate-y-0.5"
          >
            Đăng nhập hệ thống
          </Link>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} FPT Events Platform · Designed for SWP391
        B3W Group 3
      </footer>
    </div>
  )
}

