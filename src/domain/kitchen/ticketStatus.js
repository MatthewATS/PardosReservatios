export const TICKET_STATUS = {
  PENDING:   'pending',
  PREPARING: 'preparing',
  READY:     'ready',
  SERVED:    'served',
}

export const TICKET_STATUS_LABELS = {
  pending:   'Pendiente',
  preparing: 'En Preparación',
  ready:     'Listo ✓',
  served:    'Servido',
}

export const TICKET_STATUS_COLORS = {
  pending:   '#e67e22',
  preparing: '#2980b9',
  ready:     '#27ae60',
  served:    '#95a5a6',
}

export const STATUS_FLOW = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'served',
}
