import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SAMPLE_TICKETS }                                     from '@/data/seeds/ticketsSeed'
import { TICKET_STATUS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS } from '@/domain/kitchen/ticketStatus'
import { MENU_ITEMS }                                          from '@/domain/kitchen/menu'
import { readJSON, writeJSON }                                 from '@/data/storage/localStorage'

export { TICKET_STATUS, TICKET_STATUS_LABELS, TICKET_STATUS_COLORS, MENU_ITEMS }

const KitchenContext = createContext(null)

export function KitchenProvider({ children }) {
  const [tickets,   setTickets]  = useState([])
  const [isLoading, setLoading]  = useState(true)

  useEffect(() => {
    const saved = readJSON('pardos_kitchen')
    setTickets(saved ?? SAMPLE_TICKETS)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) writeJSON('pardos_kitchen', tickets)
  }, [tickets, isLoading])

  const generateId = () => `TK${Date.now().toString().slice(-4)}`

  const addTicket = useCallback((data) => {
    const ticket = {
      ...data,
      id:        generateId(),
      status:    TICKET_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    }
    setTickets(prev => [ticket, ...prev])
    return ticket
  }, [])

  const updateTicketStatus = useCallback((id, newStatus) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === id ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
      )
    )
  }, [])

  const updateTicket = useCallback((id, updates) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const activeTickets   = tickets.filter(t => t.status !== TICKET_STATUS.SERVED)
  const pendingCount    = tickets.filter(t => t.status === TICKET_STATUS.PENDING).length
  const preparingCount  = tickets.filter(t => t.status === TICKET_STATUS.PREPARING).length
  const readyCount      = tickets.filter(t => t.status === TICKET_STATUS.READY).length

  const value = {
    tickets,
    activeTickets,
    isLoading,
    pendingCount,
    preparingCount,
    readyCount,
    addTicket,
    updateTicketStatus,
    updateTicket,
    menuItems: MENU_ITEMS,
  }

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>
}

export function useKitchen() {
  const ctx = useContext(KitchenContext)
  if (!ctx) throw new Error('useKitchen debe usarse dentro de <KitchenProvider>')
  return ctx
}
