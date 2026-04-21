/**
 * src/features/tables/TablesPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de mesas con modal mejorado:
 *  - Estado de cocina visible POR ÍTEM (Pendiente / Preparando / Listo / Servido)
 *  - Botón "Añadir platos" que despliega el selector del menú
 *  - Roles con permiso de añadir: mozo, admin, cajero
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { useReservations, RESERVATION_STATUS } from  '@/context/ReservationContext'
import { useAuth } from  '@/context/AuthContext'
import { Modal } from  '@/components/ui/Modal'
import { Button } from  '@/components/ui/Button'
import { MenuSelector } from  '@/components/ui/MenuSelector'
import { Utensils, Clock, Plus, ChevronDown, ChevronUp, CheckCircle2, Flame } from 'lucide-react'
import toast from 'react-hot-toast'
import styles from './TablesPage.module.css'

const ZONE_ORDER = ['Salón Principal', 'Terraza', 'VIP']

// ── Mapa de estado de cocina por ítem ──────────────────────────────────────
const KITCHEN_STATUS_LABELS = {
  pending:   'Pendiente',
  preparing: 'Preparando',
  ready:     'Listo ✓',
  served:    'Servido',
}

const KITCHEN_STATUS_COLORS = {
  pending:   '#e67e22',
  preparing: '#2980b9',
  ready:     '#27ae60',
  served:    '#95a5a6',
}

const KITCHEN_STATUS_ICONS = {
  pending:   '⏳',
  preparing: '🔥',
  ready:     '✅',
  served:    '🍽️',
}

// El estado de cocina de cada ítem se determina por kitchenStatus de la reserva
// (toda la comanda comparte estado) — futuro: por ítem individual
function getItemKitchenStatus(reservation) {
  return reservation.kitchenStatus || 'pending'
}

export default function TablesPage() {
  const { tables, todayReservations, updateReservationItems } = useReservations()
  const { hasPermission } = useAuth()

  // canAddItems: mozo, admin, cajero
  const canAddItems = hasPermission('canViewKitchen') || hasPermission('canManageCash') || hasPermission('canDeleteAnyReservation')

  const [activeReservation, setActiveReservation] = useState(null)
  const [newItems,          setNewItems]          = useState([])
  const [showMenu,          setShowMenu]          = useState(false)

  const openTable = (status, reservation) => {
    if (reservation && (status === 'occupied' || status === 'reserved')) {
      setActiveReservation(reservation)
      setNewItems([])
      setShowMenu(false)
    }
  }

  const handleAddItems = () => {
    if (newItems.length === 0) {
      toast.error('Selecciona al menos un plato')
      return
    }
    updateReservationItems(activeReservation.id, newItems)
    toast.success('Platos añadidos y enviados a cocina 🍳')
    setActiveReservation(null)
    setNewItems([])
    setShowMenu(false)
  }

  const handleClose = () => {
    setActiveReservation(null)
    setNewItems([])
    setShowMenu(false)
  }

  // Determinar estado de cada mesa
  const tableStatus = (tableId) => {
    const seated = todayReservations.find(
      r => r.tableId === tableId && r.status === RESERVATION_STATUS.SEATED
    )
    if (seated) return { status: 'occupied', reservation: seated }

    const reserved = todayReservations.find(
      r => r.tableId === tableId && r.status === RESERVATION_STATUS.PENDING
    )
    if (reserved) return { status: 'reserved', reservation: reserved }

    return { status: 'free', reservation: null }
  }

  const byZone = (zone) => tables.filter(t => t.zone === zone)

  const totalFree     = tables.filter(t => tableStatus(t.id).status === 'free').length
  const totalOccupied = tables.filter(t => tableStatus(t.id).status === 'occupied').length
  const totalReserved = tables.filter(t => tableStatus(t.id).status === 'reserved').length

  // Datos del modal
  const kitchenStatus = activeReservation ? getItemKitchenStatus(activeReservation) : 'pending'
  const ksColor       = KITCHEN_STATUS_COLORS[kitchenStatus] || '#ccc'
  const ksLabel       = KITCHEN_STATUS_LABELS[kitchenStatus] || kitchenStatus
  const ksIcon        = KITCHEN_STATUS_ICONS[kitchenStatus]  || '⏳'
  const items         = activeReservation?.items || []
  const tableNum      = activeReservation
    ? tables.find(t => t.id === activeReservation.tableId)?.number
    : ''

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mapa de Mesas</h1>
          <p className={styles.subtitle}>Vista en tiempo real — {tables.length} mesas en total</p>
        </div>
      </div>

      {/* Leyenda */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.dotFree}`} />
          <span>Libre ({totalFree})</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.dotReserved}`} />
          <span>Reservada ({totalReserved})</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.dot} ${styles.dotOccupied}`} />
          <span>Ocupada ({totalOccupied})</span>
        </div>
      </div>

      {/* Zonas */}
      {ZONE_ORDER.map(zone => (
        <div key={zone} className={styles.zone}>
          <h2 className={styles.zoneName}>{zone}</h2>
          <div className={styles.tablesGrid}>
            {byZone(zone).map(table => {
              const { status, reservation } = tableStatus(table.id)
              return (
                <div
                  key={table.id}
                  className={`${styles.tableCard} ${styles[`table--${status}`]}`}
                  title={reservation
                    ? `${reservation.clientName} · ${reservation.guests} personas · ${reservation.time}`
                    : `Mesa libre · Cap. ${table.capacity}`}
                  onClick={() => openTable(status, reservation)}
                  style={{ cursor: reservation ? 'pointer' : 'default' }}
                >
                  <div className={styles.tableNumber}>Mesa {table.number}</div>
                  <div className={styles.tableCap}>Cap. {table.capacity} 👥</div>
                  {reservation ? (
                    <div className={styles.tableClient}>
                      <div className={styles.tableClientName}>{reservation.clientName.split(' ')[0]}</div>
                      <div className={styles.tableTime}>{reservation.time}</div>
                    </div>
                  ) : (
                    <div className={styles.tableFreeLabel}>Libre</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* ── Modal de detalle de mesa ── */}
      <Modal
        isOpen={!!activeReservation}
        onClose={handleClose}
        title={activeReservation ? `Mesa ${tableNum} — ${activeReservation.clientName}` : ''}
        size="lg"
      >
        {activeReservation && (
          <div className={styles.modalBody}>

            {/* Info de la reserva */}
            <div className={styles.reservaInfo}>
              <span className={styles.reservaInfoItem}>
                <Clock size={13} /> {activeReservation.time}
              </span>
              <span className={styles.reservaInfoItem}>
                👥 {activeReservation.guests} personas
              </span>
              <span className={styles.reservaInfoItem} style={{ color: ksColor, fontWeight: 700 }}>
                {ksIcon} Cocina: {ksLabel}
              </span>
            </div>

            {/* Lista de platos con estado */}
            <div className={styles.itemsSection}>
              <div className={styles.itemsSectionHeader}>
                <Utensils size={14} />
                <span>Platos del pedido</span>
              </div>

              {items.length === 0 ? (
                <p className={styles.noItems}>El cliente aún no ha pedido nada.</p>
              ) : (
                <div className={styles.itemsList}>
                  {items.map((it, idx) => {
                    const ks = kitchenStatus
                    const color = KITCHEN_STATUS_COLORS[ks] || '#ccc'
                    return (
                      <div key={idx} className={styles.itemRow}>
                        <div className={styles.itemLeft}>
                          <span className={styles.itemQty}>{it.qty || 1}×</span>
                          <span className={styles.itemName}>{it.name}</span>
                        </div>
                        <div className={styles.itemRight}>
                          <span className={styles.itemPrice}>S/ {((it.price || 0) * (it.qty || 1)).toFixed(2)}</span>
                          <span className={styles.itemStatus} style={{ color, borderColor: color }}>
                            {KITCHEN_STATUS_ICONS[ks]} {KITCHEN_STATUS_LABELS[ks]}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {/* Total */}
                  <div className={styles.itemsTotal}>
                    <span>Total pedido</span>
                    <strong>S/ {items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0).toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Botón añadir platos — solo para roles con permiso */}
            {canAddItems && (
              <div className={styles.addSection}>
                <button
                  className={styles.addToggleBtn}
                  onClick={() => setShowMenu(v => !v)}
                >
                  <Plus size={15} />
                  Añadir más platos a la mesa
                  {showMenu ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showMenu && (
                  <div className={styles.menuContainer}>
                    <MenuSelector selectedItems={newItems} onChange={setNewItems} />
                    <div className={styles.menuActions}>
                      <Button variant="ghost" onClick={() => { setShowMenu(false); setNewItems([]) }}>
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        icon={<Flame size={14} />}
                        onClick={handleAddItems}
                        disabled={newItems.length === 0}
                      >
                        Enviar a cocina ({newItems.length} platos)
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Acciones del modal */}
            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
