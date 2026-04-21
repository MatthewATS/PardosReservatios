export const SAMPLE_TICKETS = [
  {
    id: 'TK001',
    tableId: 'T01',
    clientName: 'Roberto Silva',
    guests: 2,
    status: 'preparing',
    items: [
      { menuId: 'M01', name: 'Pollo a la Brasa 1/4',  qty: 2, price: 28.00, notes: '' },
      { menuId: 'M04', name: 'Papas fritas',           qty: 2, price:  9.00, notes: 'Extra crujiente' },
      { menuId: 'M07', name: 'Chicha morada jarra',    qty: 1, price: 12.00, notes: '' },
    ],
    priority: 'normal',
    notes: '',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: 'TK002',
    tableId: 'T03',
    clientName: 'María García',
    guests: 4,
    status: 'pending',
    items: [
      { menuId: 'M02', name: 'Pollo a la Brasa 1/2',  qty: 2, price: 48.00, notes: '' },
      { menuId: 'M04', name: 'Papas fritas',           qty: 4, price:  9.00, notes: '' },
      { menuId: 'M10', name: 'Anticuchos (6 unid.)',   qty: 1, price: 22.00, notes: '' },
      { menuId: 'M08', name: 'Gaseosa 1.5L',           qty: 2, price:  9.00, notes: '' },
      { menuId: 'M13', name: 'Torta de chocolate',     qty: 1, price: 18.00, notes: 'Con vela de cumpleaños' },
    ],
    priority: 'high',
    notes: 'Cliente cumpleañeros — mesa VIP',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
  },
]
