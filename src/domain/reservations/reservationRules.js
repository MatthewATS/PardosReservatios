import { format } from 'date-fns'
import { RESERVATION_STATUS } from './reservationStatus'

export function generateReservationId() {
  return `R${Date.now().toString().slice(-6)}`
}

export function isHistorical(r) {
  return [
    RESERVATION_STATUS.COMPLETED,
    RESERVATION_STATUS.CANCELLED,
    RESERVATION_STATUS.NO_SHOW,
    RESERVATION_STATUS.REJECTED,
  ].includes(r.status)
}

export function isToday(r) {
  return r.date === format(new Date(), 'yyyy-MM-dd')
}
