import { IGV_RATE, PAYMENT_METHODS } from './paymentMethods'

export function calculateTotalByMethod(payments) {
  return PAYMENT_METHODS.reduce((acc, m) => {
    acc[m.id] = payments
      .filter(p => p.method === m.id)
      .reduce((s, p) => s + p.amount, 0)
    return acc
  }, {})
}

export function calculateIGV(amount) {
  const subtotal = amount / (1 + IGV_RATE)
  const igv = amount - subtotal
  return {
    subtotal: Number(subtotal.toFixed(2)),
    igv: Number(igv.toFixed(2)),
    total: Number(amount.toFixed(2)),
  }
}

export function summarizeShift(shift, payments) {
  const shiftPayments = payments.filter(
    p => p.cashierId === shift.cashierId && p.date === shift.date
  )
  return {
    ...shift,
    closedAt: new Date().toISOString(),
    status: 'closed',
    totalAmount: shiftPayments.reduce((s, p) => s + p.amount, 0),
    totalTx: shiftPayments.length,
    byMethod: calculateTotalByMethod(shiftPayments),
  }
}
