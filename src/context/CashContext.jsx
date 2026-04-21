import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { SAMPLE_PAYMENTS }                  from '@/data/seeds/paymentsSeed'
import { PAYMENT_METHODS }                  from '@/domain/cash/paymentMethods'
import { calculateTotalByMethod }           from '@/domain/cash/cashCalculations'
import { readJSON, writeJSON, remove }      from '@/data/storage/localStorage'

export { PAYMENT_METHODS }

const CashContext = createContext(null)

export function CashProvider({ children }) {
  const [payments,  setPayments]  = useState([])
  const [shift,     setShift]     = useState(null)
  const [isLoading, setLoading]   = useState(true)

  useEffect(() => {
    const savedPay   = readJSON('pardos_payments')
    const savedShift = readJSON('pardos_shift')
    setPayments(savedPay   ?? SAMPLE_PAYMENTS)
    setShift(savedShift    ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) writeJSON('pardos_payments', payments)
  }, [payments, isLoading])

  useEffect(() => {
    if (!isLoading) {
      if (shift) writeJSON('pardos_shift', shift)
      else remove('pardos_shift')
    }
  }, [shift, isLoading])

  const generateId = () => `P${Date.now().toString().slice(-6)}`

  const openShift = useCallback((cashier, initialCash = 0) => {
    const newShift = {
      id: `T${Date.now().toString().slice(-6)}`,
      cashierId:   cashier.id,
      cashierName: cashier.name,
      openedAt:    new Date().toISOString(),
      closedAt:    null,
      initialCash,
      status:      'open',
    }
    setShift(newShift)
    return newShift
  }, [])

  const closeShift = useCallback(() => {
    if (!shift) return null
    const today = format(new Date(), 'yyyy-MM-dd')
    const shiftPayments = payments.filter(
      p => p.cashierId === shift.cashierId && p.date === today
    )
    const summary = {
      ...shift,
      closedAt:    new Date().toISOString(),
      status:      'closed',
      totalAmount: shiftPayments.reduce((s, p) => s + p.amount, 0),
      totalTx:     shiftPayments.length,
      byMethod:    calculateTotalByMethod(shiftPayments),
    }
    setShift(null)
    return summary
  }, [shift, payments])

  const addPayment = useCallback((data) => {
    const newPayment = {
      ...data,
      id:     generateId(),
      date:   format(new Date(), 'yyyy-MM-dd'),
      time:   format(new Date(), 'HH:mm'),
      status: 'paid',
    }
    setPayments(prev => [newPayment, ...prev])
    return newPayment
  }, [])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayPayments = payments.filter(p => p.date === todayStr)
  const todayTotal    = todayPayments.reduce((s, p) => s + p.amount, 0)
  const todayByMethod = calculateTotalByMethod(todayPayments)

  const value = {
    payments,
    todayPayments,
    todayTotal,
    todayByMethod,
    shift,
    isLoading,
    openShift,
    closeShift,
    addPayment,
  }

  return <CashContext.Provider value={value}>{children}</CashContext.Provider>
}

export function useCash() {
  const ctx = useContext(CashContext)
  if (!ctx) throw new Error('useCash debe usarse dentro de <CashProvider>')
  return ctx
}
