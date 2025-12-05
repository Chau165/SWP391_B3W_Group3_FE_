import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import ResetPassword from './pages/ResetPassword.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Events from './pages/Events.tsx'
import EventDetail from './pages/EventDetail.tsx'
import EventCreate from './pages/EventCreate.tsx'
import EventEdit from './pages/EventEdit.tsx'
import MyTickets from './pages/MyTickets.tsx'
import TicketDetail from './pages/TicketDetail.tsx'
import CheckIn from './pages/CheckIn.tsx'
import SeatManagement from './pages/SeatManagement.tsx'
import Reports from './pages/Reports.tsx'
import MyBills from './pages/MyBills.tsx'
import BillDetail from './pages/BillDetail.tsx'
import EventRequestCreate from './pages/EventRequestCreate.tsx'
import MyEventRequests from './pages/MyEventRequests.tsx'
import EventRequests from './pages/EventRequests.tsx'
import Payment from './pages/Payment.tsx'
import PaymentSuccess from './pages/PaymentSuccess.tsx'
import PaymentFailed from './pages/PaymentFailed.tsx'
import Speakers from './pages/Speakers.tsx'
import Venues from './pages/Venues.tsx'
import CategoryTickets from './pages/CategoryTickets.tsx'
import Organizers from './pages/Organizers.tsx'
import Layout from './components/Layout.tsx'
import GuestLanding from './pages/GuestLanding.tsx'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/guest" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/guest" element={<GuestLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/create" element={<EventCreate />} />
        <Route path="events/:id/edit" element={<EventEdit />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="bills" element={<MyBills />} />
        <Route path="bills/:id" element={<BillDetail />} />
        <Route path="my-event-requests" element={<MyEventRequests />} />
        <Route path="event-requests" element={<EventRequests />} />
        <Route path="event-requests/create" element={<EventRequestCreate />} />
        <Route path="check-in" element={<CheckIn />} />
        <Route path="seats/:eventId" element={<SeatManagement />} />
        <Route path="payment" element={<Payment />} />
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="payment/failed" element={<PaymentFailed />} />
        <Route path="speakers" element={<Speakers />} />
        <Route path="venues" element={<Venues />} />
        <Route path="category-tickets" element={<CategoryTickets />} />
        <Route path="organizers" element={<Organizers />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/" element={<GuestLanding />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

