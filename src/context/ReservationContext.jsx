import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { reservationService }                      from '@/data/services/reservation.service'
import { SAMPLE_RESERVATIONS, INITIAL_TABLES }     from '@/data/seeds/reservationsSeed'
import { RESERVATION_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/domain/reservations/reservationStatus'
import { generateReservationId }                   from '@/domain/reservations/reservationRules'

export { RESERVATION_STATUS, STATUS_LABELS, STATUS_COLORS }

const ReservationContext = createContext(null)

export function ReservationProvider({ children }) {
  const [reservations, setReservations] = useState([])
  const [tables, setTables] = useState(INITIAL_TABLES)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await reservationService.getReservations()
      setReservations(data ?? SAMPLE_RESERVATIONS)
      setIsLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isLoading) reservationService.saveReservations(reservations)
  }, [reservations, isLoading])

  const addReservation = useCallback((data) => {
    const newReservation = {
      ...data,
      id: generateReservationId(),
      status: RESERVATION_STATUS.PENDING,
      items: data.items || [],
      kitchenStatus: data.items && data.items.length > 0 ? 'pending' : 'idle',
      createdAt: new Date().toISOString(),
    }
    setReservations(prev => [newReservation, ...prev])
    return newReservation
  }, [])

  const updateReservationItems = useCallback((id, newItems) => {
    setReservations(prev =>
      prev.map(r => {
        if (r.id !== id) return r
        const merged = [...(r.items || []), ...newItems]
        return { ...r, items: merged, kitchenStatus: merged.length > 0 ? 'pending' : r.kitchenStatus, updatedAt: new Date().toISOString() }
      })
    )
  }, [])

  const updateReservation = useCallback((id, updates) => {
    setReservations(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
    )
  }, [])

  const cancelReservation = useCallback((id, reason = '') => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: RESERVATION_STATUS.CANCELLED, cancelReason: reason, updatedAt: new Date().toISOString() }
          : r
      )
    )
  }, [])

  const deleteReservation = useCallback((id) => {
    setReservations(prev => prev.filter(r => r.id !== id))
  }, [])

  const deleteAllReservations = useCallback(() => {
    setReservations([])
  }, [])

  const completeReservation = useCallback((id) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: RESERVATION_STATUS.COMPLETED, updatedAt: new Date().toISOString() }
          : r
      )
    )
  }, [])

  const seatReservation = useCallback((id) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: RESERVATION_STATUS.SEATED, seatedAt: new Date().toISOString() }
          : r
      )
    )
  }, [])

  const requestReservation = useCallback((data) => {
    const newReservation = {
      ...data,
      id:        generateReservationId(),
      status:    RESERVATION_STATUS.REQUESTED,
      createdAt: new Date().toISOString(),
      source:    'public',
    }
    setReservations(prev => [newReservation, ...prev])
    return newReservation
  }, [])

  const approveReservation = useCallback((id, tableId, approvedBy) => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: RESERVATION_STATUS.PENDING, tableId, approvedBy, approvedAt: new Date().toISOString() }
          : r
      )
    )
  }, [])

  const rejectReservation = useCallback((id, reason = '') => {
    setReservations(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: RESERVATION_STATUS.REJECTED, rejectReason: reason, updatedAt: new Date().toISOString() }
          : r
      )
    )
  }, [])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayReservations = reservations.filter(
    r => r.date === todayStr &&
    r.status !== RESERVATION_STATUS.CANCELLED &&
    r.status !== RESERVATION_STATUS.REJECTED
  )
  const pendingRequests = reservations.filter(r => r.status === RESERVATION_STATUS.REQUESTED)
  const historicalReservations = reservations.filter(
    r => [RESERVATION_STATUS.COMPLETED, RESERVATION_STATUS.CANCELLED,
          RESERVATION_STATUS.NO_SHOW, RESERVATION_STATUS.REJECTED].includes(r.status)
  )

  const value = {
    reservations,
    todayReservations,
    historicalReservations,
    pendingRequests,
    tables,
    isLoading,
    addReservation,
    updateReservation,
    updateReservationItems,
    cancelReservation,
    deleteReservation,
    deleteAllReservations,
    completeReservation,
    seatReservation,
    requestReservation,
    approveReservation,
    rejectReservation,
  }

  return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>
}

export function useReservations() {
  const ctx = useContext(ReservationContext)
  if (!ctx) throw new Error('useReservations debe usarse dentro de <ReservationProvider>')
  return ctx
}
