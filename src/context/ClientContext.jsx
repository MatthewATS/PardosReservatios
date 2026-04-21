import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { SAMPLE_CLIENTS }                    from '@/data/seeds/clientsSeed'
import { readJSON, writeJSON }               from '@/data/storage/localStorage'

const ClientContext = createContext(null)

export function ClientProvider({ children }) {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = readJSON('pardos_clients')
    setClients(saved ?? SAMPLE_CLIENTS)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) writeJSON('pardos_clients', clients)
  }, [clients, isLoading])

  const generateId = () => `C${Date.now().toString().slice(-6)}`

  const addClient = useCallback((data) => {
    if (data.dni && data.dni.trim() !== '') {
      const exists = clients.find(c => c.dni === data.dni.trim())
      if (exists) throw new Error('Ya existe un cliente con este DNI.')
    }
    const newClient = {
      ...data,
      id: generateId(),
      totalVisits: 0,
      totalReservations: 0,
      lastVisit: null,
      registeredAt: new Date().toISOString(),
      vip: false,
    }
    setClients(prev => [newClient, ...prev])
    return newClient
  }, [clients])

  const updateClient = useCallback((id, updates) => {
    if (updates.dni && updates.dni.trim() !== '') {
      const exists = clients.find(c => c.dni === updates.dni.trim() && c.id !== id)
      if (exists) throw new Error('El DNI ingresado ya pertenece a otro cliente.')
    }
    setClients(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)
    )
  }, [clients])

  const deleteClient = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id))
  }, [])

  const deleteAllClients = useCallback(() => {
    setClients([])
  }, [])

  const searchClients = useCallback((query) => {
    if (!query || query.length < 2) return clients
    const q = query.toLowerCase()
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.dni?.includes(q)
    )
  }, [clients])

  const getClientById = useCallback((id) => {
    return clients.find(c => c.id === id) || null
  }, [clients])

  const incrementVisits = useCallback((id) => {
    setClients(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, totalVisits: (c.totalVisits || 0) + 1, lastVisit: new Date().toISOString().split('T')[0] }
          : c
      )
    )
  }, [])

  const findByPhone = useCallback((phone) => {
    return clients.find(c => c.phone === phone.trim()) || null
  }, [clients])

  const findByDni = useCallback((dni) => {
    return clients.find(c => c.dni === dni.trim()) || null
  }, [clients])

  const value = {
    clients,
    isLoading,
    totalClients: clients.length,
    vipClients: clients.filter(c => c.vip),
    addClient,
    updateClient,
    deleteClient,
    deleteAllClients,
    searchClients,
    getClientById,
    incrementVisits,
    findByPhone,
    findByDni,
  }

  return <ClientContext.Provider value={value}>{children}</ClientContext.Provider>
}

export function useClients() {
  const ctx = useContext(ClientContext)
  if (!ctx) throw new Error('useClients debe usarse dentro de <ClientProvider>')
  return ctx
}
