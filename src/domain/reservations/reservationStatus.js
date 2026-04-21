export const RESERVATION_STATUS = {
  REQUESTED: 'requested',
  PENDING:   'pending',
  SEATED:    'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED:  'rejected',
  NO_SHOW:   'no_show',
}

export const STATUS_LABELS = {
  requested: 'Solicitud',
  pending:   'Pendiente',
  seated:    'En Mesa',
  completed: 'Completada',
  cancelled: 'Cancelada',
  rejected:  'Rechazada',
  no_show:   'No se presentó',
}

export const STATUS_COLORS = {
  requested: 'purple',
  pending:   'warning',
  seated:    'info',
  completed: 'success',
  cancelled: 'error',
  rejected:  'error',
  no_show:   'neutral',
}
