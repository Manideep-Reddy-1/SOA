import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ||
  (import.meta.env.DEV ? 'http://localhost:8080' : 'https://grandvista-hospitality-production.up.railway.app')

type RoomType = 'STANDARD' | 'DELUXE' | 'SUITE' | 'EXECUTIVE' | 'PRESIDENTIAL' | 'FAMILY'

type SessionUser = {
  id: number
  name: string
  email: string
  role: string
}

type Session = {
  token: string
  user: SessionUser
}

type Room = {
  id: number
  roomNumber: string
  roomType: RoomType
  description: string
  pricePerNight: number
  capacity: number
  floor: number
  amenities: string
  imageUrl: string
  status: string
}

type Booking = {
  id: number
  bookingReference: string
  userId: number
  roomId: number
  roomNumber?: string
  roomType?: string
  roomImageUrl?: string
  checkInDate: string
  checkOutDate: string
  numberOfGuests: number
  totalAmount: number
  bookingStatus: string
  paymentStatus: string
  paymentReference?: string
  message?: string
}

async function fetchJson<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!API_BASE_URL) {
    throw new Error('The backend API URL is not configured. Set VITE_API_BASE_URL to the deployed API gateway URL.')
  }

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  let payload: T | null = null

  if (text) {
    try {
      payload = JSON.parse(text) as T
    } catch {
      payload = text as unknown as T
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in (payload as Record<string, unknown>)
        ? String((payload as Record<string, unknown>).message)
        : 'Request failed'
    throw new Error(message)
  }

  return payload as T
}

function handleMoney(value: number | string | undefined): string {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function readSession(): Session | null {
  const raw = localStorage.getItem('grandvista-session')
  if (!raw) return null

  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    if (session) {
      localStorage.setItem('grandvista-session', JSON.stringify(session))
    } else {
      localStorage.removeItem('grandvista-session')
    }
  }, [session])

  const onLogout = () => setSession(null)

  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand-block">
            <Link to="/" className="brand">GrandVista Hospitality</Link>
          </div>
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/rooms">Rooms</Link>
            {session && (
              <>
                <Link to="/my-bookings">My Bookings</Link>
                <Link to="/my-payments">My Payments</Link>
              </>
            )}
            {session?.user.role === 'ADMIN' && (
              <>
                <Link to="/admin">Admin</Link>
                <Link to="/admin/rooms">Rooms</Link>
                <Link to="/admin/bookings">Bookings</Link>
                <Link to="/admin/payments">Payments</Link>
              </>
            )}
          </nav>
          <div className="session-actions">
            {session ? (
              <>
                <span className="user-pill">{session.user.name}</span>
                <button type="button" className="secondary-button" onClick={onLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="secondary-button">Login</Link>
                <Link to="/register" className="primary-button">Register</Link>
              </>
            )}
          </div>
        </header>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={<LoginPage session={session} setSession={setSession} />}
            />
            <Route
              path="/register"
              element={<RegisterPage session={session} setSession={setSession} />}
            />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/rooms/:id" element={<RoomDetailsPage />} />
            <Route
              path="/book/:roomId"
              element={<ProtectedRoute session={session} children={<BookingPage session={session} />} />}
            />
            <Route
              path="/payment/:bookingId"
              element={<ProtectedRoute session={session} children={<PaymentPage session={session} />} />}
            />
            <Route
              path="/booking-confirmation/:bookingId"
              element={<ProtectedRoute session={session} children={<ConfirmationPage session={session} />} />}
            />
            <Route
              path="/my-bookings"
              element={<ProtectedRoute session={session} children={<MyBookingsPage session={session} />} />}
            />
            <Route
              path="/my-payments"
              element={<ProtectedRoute session={session} children={<MyPaymentsPage session={session} />} />}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute session={session} adminOnly children={<AdminDashboardPage session={session} />} />}
            />
            <Route
              path="/admin/rooms"
              element={<ProtectedRoute session={session} adminOnly children={<AdminRoomsPage session={session} />} />}
            />
            <Route
              path="/admin/bookings"
              element={<ProtectedRoute session={session} adminOnly children={<AdminBookingsPage session={session} />} />}
            />
            <Route
              path="/admin/payments"
              element={<ProtectedRoute session={session} adminOnly children={<AdminPaymentsPage session={session} />} />}
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function ProtectedRoute({
  session,
  adminOnly = false,
  children,
}: {
  session: Session | null
  adminOnly?: boolean
  children: ReactNode
}) {
  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && session.user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}

function NotFoundPage() {
  return (
    <div className="panel info-panel">
      <h2>Page not found</h2>
      <p>The page you requested is not available.</p>
      <Link to="/" className="primary-button">Back home</Link>
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([])
  const [form, setForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
    roomType: 'STANDARD',
  })

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const rooms = await fetchJson<Room[]>('/rooms')
        setFeaturedRooms(rooms.slice(0, 4))
      } catch {
        setFeaturedRooms([])
      }
    }

    void loadRooms()
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const params = new URLSearchParams()
    if (form.checkIn) params.set('checkIn', form.checkIn)
    if (form.checkOut) params.set('checkOut', form.checkOut)
    if (form.guests) params.set('guests', form.guests)
    if (form.roomType) params.set('roomType', form.roomType)

    navigate(`/rooms?${params.toString()}`)
  }

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Luxury stays, made simple</span>
          <h1>Find your perfect stay at GrandVista Hospitality</h1>
          <p>
            Manage reservations, room inventory, and dynamic pricing in one polished hotel booking experience.
          </p>
          <form className="search-box" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label>
                Check-in
                <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange} min={new Date().toISOString().slice(0, 10)} required />
              </label>
              <label>
                Check-out
                <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange} min={form.checkIn || new Date().toISOString().slice(0, 10)} required />
              </label>
              <label>
                Guests
                <input name="guests" type="number" min="1" max="8" value={form.guests} onChange={handleChange} required />
              </label>
              <label>
                Room type
                <select name="roomType" value={form.roomType} onChange={handleChange}>
                  <option value="STANDARD">Standard</option>
                  <option value="DELUXE">Deluxe</option>
                  <option value="SUITE">Suite</option>
                  <option value="EXECUTIVE">Executive</option>
                </select>
              </label>
            </div>
            <button type="submit" className="primary-button large-button">Search Rooms</button>
          </form>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <h2>Featured rooms</h2>
        </div>
        <div className="room-grid">
          {featuredRooms.map((room) => (
            <div key={room.id} className="room-card">
              <img src={room.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={room.roomNumber} />
              <div className="room-card-body">
                <span className="tag">{room.roomType}</span>
                <h3>Room {room.roomNumber}</h3>
                <p>{room.description}</p>
                <div className="meta-row">
                  <span>{room.capacity} guests</span>
                  <span>{room.status}</span>
                </div>
                <div className="meta-row price-row">
                  <strong>{handleMoney(room.pricePerNight)}</strong>
                  <Link to={`/rooms/${room.id}`} className="secondary-button tiny-button">View details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function LoginPage({ session, setSession }: { session: Session | null; setSession: (session: Session | null) => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: 'admin@grandvista.com', password: 'Admin@123' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/')
    }
  }, [navigate, session])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      const response = await fetchJson<{ token: string; id: number; name: string; email: string; role: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      setSession({
        token: response.token,
        user: {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
        },
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <div className="auth-panel panel">
      <h2>Welcome back</h2>
      <p>Use the development admin account to access admin features.</p>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>
        {error && <div className="message error">{error}</div>}
        <button type="submit" className="primary-button">Login</button>
      </form>
      <p className="inline-link">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  )
}

function RegisterPage({ session, setSession }: { session: Session | null; setSession: (session: Session | null) => void }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) {
      navigate('/')
    }
  }, [navigate, session])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    try {
      const response = await fetchJson<{ token: string; id: number; name: string; email: string; role: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      setSession({
        token: response.token,
        user: {
          id: response.id,
          name: response.name,
          email: response.email,
          role: response.role,
        },
      })
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="auth-panel panel">
      <h2>Create your account</h2>
      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Full name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={handleChange} minLength={6} required />
        </label>
        {error && <div className="message error">{error}</div>}
        <button type="submit" className="primary-button">Register</button>
      </form>
    </div>
  )
}

function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const params = new URLSearchParams(window.location.search)
        const queryString = params.toString()
        const path = queryString ? `/rooms/search?${queryString}` : '/rooms'
        const roomsData = await fetchJson<Room[]>(path)
        setRooms(roomsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load rooms')
      }
    }

    void loadRooms()
  }, [])

  if (error) {
    return <div className="panel error-panel">{error}</div>
  }

  return (
    <div>
      <div className="section-heading">
        <h2>Available rooms</h2>
      </div>
      <div className="room-grid">
        {rooms.map((room) => (
          <div key={room.id} className="room-card">
            <img src={room.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={room.roomNumber} />
            <div className="room-card-body">
              <span className="tag">{room.roomType}</span>
              <h3>Room {room.roomNumber}</h3>
              <p>{room.description}</p>
              <div className="meta-row">
                <span>{room.capacity} guests</span>
                <span>{room.status}</span>
              </div>
              <div className="meta-row price-row">
                <strong>{handleMoney(room.pricePerNight)}</strong>
                <Link to={`/rooms/${room.id}`} className="secondary-button tiny-button">Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RoomDetailsPage() {
  const { id } = useParams()
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomData = await fetchJson<Room>(`/rooms/${id}`)
        setRoom(roomData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load room details')
      }
    }

    void loadRoom()
  }, [id])

  if (error) return <div className="panel error-panel">{error}</div>
  if (!room) return <div className="panel">Loading room...</div>

  return (
    <div className="detail-layout panel">
      <img className="detail-image" src={room.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={room.roomNumber} />
      <div>
        <span className="tag">{room.roomType}</span>
        <h2>Room {room.roomNumber}</h2>
        <p>{room.description}</p>
        <ul className="detail-list">
          <li>Capacity: {room.capacity} guests</li>
          <li>Status: {room.status}</li>
          <li>Amenities: {room.amenities}</li>
          <li>Price: {handleMoney(room.pricePerNight)} / night</li>
        </ul>
        <Link to={`/book/${room.id}`} className="primary-button">Book now</Link>
      </div>
    </div>
  )
}

function BookingPage({ session }: { session: Session | null }) {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [room, setRoom] = useState<Room | null>(null)
  const [pricing, setPricing] = useState<{
    totalAmount: number
    basePricePerNight: number
    dynamicPricePerNight: number
    demandLevel: string
    surgePercentage: number
    numberOfNights: number
  } | null>(null)
  const [form, setForm] = useState({
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    numberOfGuests: '2',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const roomData = await fetchJson<Room>(`/rooms/${roomId}`)
        setRoom(roomData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load room')
      }
    }

    void loadRoom()
  }, [roomId])

  useEffect(() => {
    if (!room || !form.checkIn || !form.checkOut) return

    const loadPricing = async () => {
      try {
        const pricingData = await fetchJson<{
          totalAmount: number
          basePricePerNight: number
          dynamicPricePerNight: number
          demandLevel: string
          surgePercentage: number
          numberOfNights: number
        }>(`/rooms/${room.id}/pricing?checkIn=${form.checkIn}&checkOut=${form.checkOut}`)
        setPricing(pricingData)
      } catch {
        setPricing(null)
      }
    }

    void loadPricing()
  }, [form.checkIn, form.checkOut, room])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session || !room) return

    try {
      const booking = await fetchJson<Booking>('/bookings', {
        method: 'POST',
        headers: { 'X-User-Id': String(session.user.id) },
        body: JSON.stringify({
          userId: session.user.id,
          roomId: room.id,
          checkInDate: form.checkIn,
          checkOutDate: form.checkOut,
          numberOfGuests: Number(form.numberOfGuests),
        }),
      }, session.token)

      navigate(`/payment/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create booking')
    }
  }

  if (error) return <div className="panel error-panel">{error}</div>
  if (!room) return <div className="panel">Loading booking details...</div>

  return (
    <div className="booking-layout panel">
      <div>
        <h2>Book {room.roomType} room</h2>
        <p>
          Room {room.roomNumber} · {handleMoney(room.pricePerNight)} / night
        </p>
        <img className="detail-image" src={room.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945'} alt={room.roomNumber} />
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <label>
          Check-in
          <input name="checkIn" type="date" value={form.checkIn} onChange={handleChange} required />
        </label>
        <label>
          Check-out
          <input name="checkOut" type="date" value={form.checkOut} onChange={handleChange} required />
        </label>
        <label>
          Guests
          <input name="numberOfGuests" type="number" min="1" max={room.capacity} value={form.numberOfGuests} onChange={handleChange} required />
        </label>
        <div className="pricing-summary">
          <h3>Price breakdown</h3>
          {pricing ? (
            <>
              <div className="price-line"><span>Base</span><strong>{handleMoney(pricing.basePricePerNight)}</strong></div>
              <div className="price-line"><span>Dynamic</span><strong>{handleMoney(pricing.dynamicPricePerNight)}</strong></div>
              <div className="price-line"><span>Demand</span><strong>{pricing.demandLevel}</strong></div>
              <div className="price-line total"><span>Total</span><strong>{handleMoney(pricing.totalAmount)}</strong></div>
            </>
          ) : (
            <div className="price-line"><span>Standard rate</span><strong>{handleMoney(room.pricePerNight)}</strong></div>
          )}
        </div>

        <button type="submit" className="primary-button">Reserve room and continue to payment</button>
      </form>
    </div>
  )
}

function PaymentPage({ session }: { session: Session | null }) {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId || !session) return
      try {
        const data = await fetchJson<Booking>(`/bookings/${bookingId}`, {}, session.token)
        setBooking(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load booking')
      }
    }

    void loadBooking()
  }, [bookingId, session])

  const submitPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!booking || !session) return
    setError('')
    setSubmitting(true)
    try {
      await fetchJson<Booking>(`/bookings/${booking.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      }, session.token)
      navigate(`/booking-confirmation/${booking.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment could not be completed')
      try {
        const updatedBooking = await fetchJson<Booking>(`/bookings/${booking.id}`, {}, session.token)
        setBooking(updatedBooking)
      } catch {
        // Keep the original payment error visible.
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (!booking) {
    return error ? <div className="panel error-panel">{error}</div> : <div className="panel">Loading payment details...</div>
  }

  return (
    <div className="panel payment-panel">
      <h2>Payment status</h2>
      {error && <p className="error-panel">{error}</p>}
      <div className="payment-card">
        <p>
          <strong>Booking:</strong> {booking.bookingReference}
        </p>
        <p>
          <strong>Room:</strong> {booking.roomNumber ?? 'Room'}
        </p>
        <p>
          <strong>Dates:</strong> {booking.checkInDate} to {booking.checkOutDate}
        </p>
        <p>
          <strong>Total:</strong> {handleMoney(booking.totalAmount)}
        </p>
        <p>
          <strong>Status:</strong> {booking.paymentStatus}
        </p>
      </div>

      {booking.paymentStatus === 'PENDING' ? (
        <form className="form-stack" onSubmit={submitPayment}>
          <label>
            Payment method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option value="CREDIT_CARD">Credit card</option>
              <option value="DEBIT_CARD">Debit card</option>
              <option value="UPI">UPI</option>
              <option value="NET_BANKING">Net banking</option>
            </select>
          </label>
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Processing payment...' : `Pay ${handleMoney(booking.totalAmount)}`}
          </button>
        </form>
      ) : booking.paymentStatus === 'SUCCESS' ? (
        <Link to={`/booking-confirmation/${booking.id}`} className="primary-button">View booking confirmation</Link>
      ) : (
        <Link to="/rooms" className="primary-button">Choose another room</Link>
      )}
    </div>
  )
}

function ConfirmationPage({ session }: { session: Session | null }) {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState<Booking | null>(null)

  useEffect(() => {
    const loadBooking = async () => {
      if (!bookingId || !session) return
      try {
        const data = await fetchJson<Booking>(`/bookings/${bookingId}`, {}, session.token)
        setBooking(data)
      } catch {
        setBooking(null)
      }
    }

    void loadBooking()
  }, [bookingId, session])

  if (!booking) return <div className="panel">Loading confirmation...</div>

  return (
    <div className="panel success-panel">
      <h2>{booking.paymentStatus === 'SUCCESS' ? 'Booking confirmed' : 'Booking awaiting payment'}</h2>
      <p className="success-text">
        {booking.paymentStatus === 'SUCCESS'
          ? 'Your reservation has been secured successfully.'
          : 'Complete payment to confirm your reservation.'}
      </p>
      <div className="confirmation-grid">
        <div><span>Reference</span><strong>{booking.bookingReference}</strong></div>
        <div><span>Room</span><strong>{booking.roomNumber ?? 'Room'}</strong></div>
        <div><span>Check-in</span><strong>{booking.checkInDate}</strong></div>
        <div><span>Check-out</span><strong>{booking.checkOutDate}</strong></div>
        <div><span>Guests</span><strong>{booking.numberOfGuests}</strong></div>
        <div><span>Total</span><strong>{handleMoney(booking.totalAmount)}</strong></div>
        <div><span>Payment status</span><strong>{booking.paymentStatus}</strong></div>
      </div>
      <div className="button-row">
        {booking.paymentStatus === 'PENDING' && <Link to={`/payment/${booking.id}`} className="primary-button">Pay now</Link>}
        <Link to="/my-bookings" className="secondary-button">View my bookings</Link>
      </div>
    </div>
  )
}

function MyBookingsPage({ session }: { session: Session | null }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')

  const loadBookings = async () => {
    if (!session) return
    try {
      const data = await fetchJson<Booking[]>(`/bookings/my-bookings?userId=${session.user.id}`, {}, session.token)
      setBookings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load bookings')
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [session])

  const cancelBooking = async (bookingId: number) => {
    if (!session) return
    try {
      await fetchJson<Booking>(`/bookings/${bookingId}/cancel`, { method: 'PUT' }, session.token)
      await loadBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel booking')
    }
  }

  if (error) return <div className="panel error-panel">{error}</div>

  return (
    <div className="panel">
      <div className="section-heading">
        <h2>My bookings</h2>
        <Link to="/rooms" className="primary-button">Choose a room</Link>
      </div>
      <div className="list-grid">
        {bookings.length === 0 ? <p>No bookings yet. Choose a room to get started.</p> : bookings.map((booking) => (
          <div key={booking.id} className="booking-row customer-booking-row">
            <div>
              <strong>{booking.bookingReference}</strong>
              <p>
                {booking.roomNumber ?? 'Room'} · {booking.checkInDate} to {booking.checkOutDate}
              </p>
            </div>
            <div className="booking-status">
              <span>{booking.bookingStatus}</span>
              <span>{booking.paymentStatus}</span>
            </div>
            <strong className="booking-amount">{handleMoney(booking.totalAmount)}</strong>
            <div className="booking-actions">
              {booking.paymentStatus === 'PENDING' && <Link to={`/payment/${booking.id}`} className="primary-button">Pay now</Link>}
              <Link to={`/payment/${booking.id}`} className="secondary-button">Payment details</Link>
              {booking.bookingStatus !== 'CANCELLED' && <button type="button" className="secondary-button" onClick={() => void cancelBooking(booking.id)}>Cancel</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MyPaymentsPage({ session }: { session: Session | null }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPayments = async () => {
      if (!session) return
      try {
        const data = await fetchJson<Booking[]>(`/bookings/my-bookings?userId=${session.user.id}`, {}, session.token)
        setBookings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load payments')
      }
    }

    void loadPayments()
  }, [session])

  return (
    <div className="panel">
      <div className="section-heading">
        <h2>My payments</h2>
        <Link to="/rooms" className="primary-button">Choose a room</Link>
      </div>
      {error ? <p className="error-panel">{error}</p> : (
        <div className="list-grid">
          {bookings.length === 0 ? <p>No booking payments yet.</p> : bookings.map((booking) => (
            <div key={booking.id} className="booking-row">
              <div>
                <strong>{booking.bookingReference}</strong>
                <p>{booking.roomNumber ?? 'Room'} · {booking.checkInDate} to {booking.checkOutDate}</p>
              </div>
              <span>{booking.paymentStatus}</span>
              <strong>{handleMoney(booking.totalAmount)}</strong>
              <Link to={`/payment/${booking.id}`} className={booking.paymentStatus === 'PENDING' ? 'primary-button' : 'secondary-button'}>
                {booking.paymentStatus === 'PENDING' ? 'Pay now' : 'View payment'}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminDashboardPage({ session }: { session: Session | null }) {
  const [stats, setStats] = useState({ rooms: 0, bookings: 0, payments: 0 })

  useEffect(() => {
    const loadStats = async () => {
      if (!session) return
      try {
        const [rooms, bookings, payments] = await Promise.all([
          fetchJson<Room[]>('/rooms', {}, session.token),
          fetchJson<Booking[]>('/bookings', {}, session.token),
          fetchJson<{ length: number }[]>('/payments', {}, session.token),
        ])

        setStats({
          rooms: rooms.length,
          bookings: bookings.length,
          payments: payments.length,
        })
      } catch {
        setStats({ rooms: 0, bookings: 0, payments: 0 })
      }
    }

    void loadStats()
  }, [session])

  return (
    <div className="panel">
      <h2>Admin dashboard</h2>
      <div className="stats-grid">
        <div className="stat-box"><span>Total rooms</span><strong>{stats.rooms}</strong></div>
        <div className="stat-box"><span>Total bookings</span><strong>{stats.bookings}</strong></div>
        <div className="stat-box"><span>Total payments</span><strong>{stats.payments}</strong></div>
      </div>
    </div>
  )
}

function AdminRoomsPage({ session }: { session: Session | null }) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    roomNumber: '',
    roomType: 'STANDARD',
    description: '',
    pricePerNight: '120',
    capacity: '2',
    floor: '1',
    amenities: 'Wi-Fi, Air Conditioning',
    imageUrl: '',
    status: 'AVAILABLE',
  })

  const loadRooms = async () => {
    if (!session) return
    try {
      const roomData = await fetchJson<Room[]>('/rooms', {}, session.token)
      setRooms(roomData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rooms')
    }
  }

  useEffect(() => {
    void loadRooms()
  }, [session])

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session) return
    setError('')

    try {
      await fetchJson('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          pricePerNight: Number(form.pricePerNight),
          capacity: Number(form.capacity),
          floor: Number(form.floor),
        }),
      }, session.token)

      setForm({
        roomNumber: '',
        roomType: 'STANDARD',
        description: '',
        pricePerNight: '120',
        capacity: '2',
        floor: '1',
        amenities: 'Wi-Fi, Air Conditioning',
        imageUrl: '',
        status: 'AVAILABLE',
      })
      await loadRooms()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add room')
    }
  }

  const deleteRoom = async (roomId: number) => {
    if (!session) return
    setError('')
    try {
      await fetchJson(`/rooms/${roomId}`, { method: 'DELETE' }, session.token)
      await loadRooms()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete room')
    }
  }

  return (
    <div className="panel">
      <h2>Manage rooms</h2>
      {error && <p className="error-panel">{error}</p>}
      <form className="form-stack admin-form" onSubmit={submitRoom}>
        <div className="field-grid">
          <label>Room number<input name="roomNumber" value={form.roomNumber} onChange={handleChange} required /></label>
          <label>Room type<select name="roomType" value={form.roomType} onChange={handleChange}><option value="STANDARD">Standard</option><option value="DELUXE">Deluxe</option><option value="SUITE">Suite</option><option value="EXECUTIVE">Executive</option><option value="PRESIDENTIAL">Presidential</option><option value="FAMILY">Family</option></select></label>
          <label>Price<input name="pricePerNight" type="number" min="1" value={form.pricePerNight} onChange={handleChange} required /></label>
          <label>Capacity<input name="capacity" type="number" min="1" value={form.capacity} onChange={handleChange} required /></label>
          <label>Floor<input name="floor" type="number" min="0" value={form.floor} onChange={handleChange} required /></label>
        </div>
        <label>Description<textarea name="description" rows={3} value={form.description} onChange={handleChange} required /></label>
        <label>Amenities<input name="amenities" value={form.amenities} onChange={handleChange} /></label>
        <label>Image URL<input name="imageUrl" value={form.imageUrl} onChange={handleChange} /></label>
        <label>Status<select name="status" value={form.status} onChange={handleChange}><option value="AVAILABLE">AVAILABLE</option><option value="BOOKED">BOOKED</option><option value="MAINTENANCE">MAINTENANCE</option><option value="INACTIVE">INACTIVE</option></select></label>
        <button type="submit" className="primary-button">Add room</button>
      </form>

      <div className="list-grid">
        {rooms.map((room) => (
          <div key={room.id} className="booking-row">
            <div>
              <strong>{room.roomNumber}</strong>
              <p>{room.roomType} · Floor {room.floor} · {room.status}</p>
            </div>
            <strong>{handleMoney(room.pricePerNight)}</strong>
            <button type="button" className="secondary-button" onClick={() => void deleteRoom(room.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminBookingsPage({ session }: { session: Session | null }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadBookings = async () => {
      if (!session) return
      try {
        const data = await fetchJson<Booking[]>('/bookings', {}, session.token)
        setBookings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load bookings')
      }
    }

    void loadBookings()
  }, [session])

  return (
    <div className="panel">
      <h2>Booking management</h2>
      <div className="list-grid">
        {error ? <p className="error-panel">{error}</p> : bookings.length === 0 ? <p>No bookings yet.</p> : bookings.map((booking) => (
          <div key={booking.id} className="booking-row">
            <div>
              <strong>{booking.bookingReference}</strong>
              <p>{booking.checkInDate} to {booking.checkOutDate}</p>
            </div>
            <span>{booking.bookingStatus}</span>
            <span>{booking.paymentStatus}</span>
            <strong>{handleMoney(booking.totalAmount)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminPaymentsPage({ session }: { session: Session | null }) {
  const [payments, setPayments] = useState<{ id: number; bookingId: number; amount: number; status: string; paymentDate?: string }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const loadPayments = async () => {
      if (!session) return
      try {
        const data = await fetchJson<{ id: number; bookingId: number; amount: number; status: string; paymentDate?: string }[]>('/payments', {}, session.token)
        setPayments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load payments')
      }
    }

    void loadPayments()
  }, [session])

  return (
    <div className="panel">
      <h2>Payment management</h2>
      <div className="list-grid">
        {error ? <p className="error-panel">{error}</p> : payments.length === 0 ? <p>No payments yet.</p> : payments.map((payment) => (
          <div key={payment.id} className="booking-row">
            <div>
              <strong>Payment #{payment.id}</strong>
              <p>Booking {payment.bookingId}</p>
            </div>
            <span>{payment.status}</span>
            <strong>{handleMoney(payment.amount)}</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
