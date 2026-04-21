/**
 * src/features/kitchen/KitchenPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Panel de Cocina — exclusivo para el rol de Jefe de Cocina (y Admin).
 * Muestra en tiempo real los tickets de pedidos organizados por estado:
 *   - Pendiente    → Ingresaron pero no se empezó a preparar
 *   - En Preparación → Se está cocinando
 *   - Listo        → Listo para que el mozo lo lleve a la mesa
 *
 * Funcionalidades:
 *   - Vista en "tablero Kanban" por estado
 *   - Indicador de prioridad (alta = cumpleaños, evento especial)
 *   - Temporizador desde que se creó el ticket
 *   - Crear nuevos tickets manualmente
 *   - Avanzar y retroceder estado de un ticket
 *
 * Acceso: Jefe de Cocina, Administrador
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { ChefHat, Plus, Clock, AlertTriangle, CheckCircle2, Flame, Eye } from 'lucide-react'
import {
  useKitchen,
  TICKET_STATUS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
} from '@/context/KitchenContext'
import { useKitchenOrders } from '@/domain/hooks/useKitchenOrders'
import { Card, StatCard } from  '@/components/ui/Card'
import { Button } from  '@/components/ui/Button'
import { Modal } from  '@/components/ui/Modal'
import { Input, Select, Textarea } from  '@/components/ui/Input'
import toast from 'react-hot-toast'
import styles from './KitchenPage.module.css'

// ── Temporizador en tiempo real ───────────────────────────────────────────────
function ElapsedTimer({ createdAt }) {
  const [mins, setMins] = useState(
    () => Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
  )
  useEffect(() => {
    const interval = setInterval(() => {
      setMins(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    }, 30000)
    return () => clearInterval(interval)
  }, [createdAt])
  return (
    <span className={`${styles.timer} ${mins > 20 ? styles.timerAlert : ''}`}>
      <Clock size={12} /> {mins} min
    </span>
  )
}

// ── Estado siguiente / anterior ───────────────────────────────────────────────
const STATUS_FLOW = [TICKET_STATUS.PENDING, TICKET_STATUS.PREPARING, TICKET_STATUS.READY, TICKET_STATUS.SERVED]

const STATUS_ICON = {
  pending:   <Clock size={14} />,
  preparing: <Flame size={14} />,
  ready:     <CheckCircle2 size={14} />,
  served:    <CheckCircle2 size={14} />,
}

// ── Ticket card ───────────────────────────────────────────────────────────────
function TicketCard({ ticket, onAdvance, onBack, readOnly }) {
  const currentIdx = STATUS_FLOW.indexOf(ticket.status)
  const nextStatus = STATUS_FLOW[currentIdx + 1]
  const prevStatus = STATUS_FLOW[currentIdx - 1]
  const color = TICKET_STATUS_COLORS[ticket.status]
  const isReady = ticket.status === 'ready'

  return (
    <article className={`${styles.ticket} ${ticket.priority === 'high' ? styles.ticketHigh : ''} ${isReady && readOnly ? styles.ticketReadyAlert : ''}`}
      style={{ borderTopColor: color }}>
      {ticket.priority === 'high' && (
        <div className={styles.priorityBadge}>
          <AlertTriangle size={11} /> Alta prioridad
        </div>
      )}
      {/* Badge de estado solo lectura */}
      {readOnly && isReady && (
        <div className={styles.readyBadge}>
          🔔 Listo para servir — llevar a mesa {ticket.tableId}
        </div>
      )}
      <div className={styles.ticketHeader}>
        <div>
          <span className={styles.ticketTable}>Mesa {ticket.tableId}</span>
          <h3 className={styles.ticketClient}>{ticket.clientName}</h3>
        </div>
        <div className={styles.ticketMeta}>
          <ElapsedTimer createdAt={ticket.createdAt} />
          <span className={styles.ticketGuests}>👥 {ticket.guests}</span>
        </div>
      </div>

      {/* Items */}
      <ul className={styles.itemList}>
        {ticket.items && ticket.items.map((item, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.itemQty}>{item.qty}×</span>
            <span className={styles.itemName}>{item.name}</span>
            {item.notes && <span className={styles.itemNote}>({item.notes})</span>}
          </li>
        ))}
      </ul>

      {/* Notas especiales */}
      {ticket.notes && (
        <p className={styles.ticketNote}>
          <AlertTriangle size={12} /> {ticket.notes}
        </p>
      )}

      {/* Acciones: solo visible para jefe/admin */}
      {!readOnly && (
        <div className={styles.ticketActions}>
          {prevStatus && prevStatus !== TICKET_STATUS.SERVED && (
            <Button variant="ghost" size="sm" onClick={() => onBack(ticket, prevStatus)}>
              ← Atrás
            </Button>
          )}
          {nextStatus && (
            <Button
              variant={nextStatus === TICKET_STATUS.READY ? 'success' : 'primary'}
              size="sm"
              icon={STATUS_ICON[nextStatus]}
              onClick={() => onAdvance(ticket, nextStatus)}
            >
              {TICKET_STATUS_LABELS[nextStatus]}
            </Button>
          )}
        </div>
      )}

      {/* Modo lectura: solo muestra estado */}
      {readOnly && (
        <div className={styles.readOnlyStatus} style={{ color }}>
          {STATUS_ICON[ticket.status]} {TICKET_STATUS_LABELS[ticket.status]}
        </div>
      )}
    </article>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function KitchenPage() {
  const getLocalToday = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const [dateFilter, setDateFilter] = useState(getLocalToday())

  // Toda la lógica compleja delegada al orquestador (Capa 2)
  const {
      pending,
      preparing,
      ready,
      totalCount,
      canManage,
      handleAdvance,
      handleBack
  } = useKitchenOrders(dateFilter)

  // Cooks cannot create or edit tickets directly based on the new requirements

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Cocina</h1>
          <p className={styles.subtitle}>Gestión de pedidos del día</p>
        </div>

        {/* Filtro por fecha */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
            Ver fecha:
          </span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ 
              padding: '6px 12px', 
              borderRadius: 'var(--radius-sm)', 
              border: '1px solid var(--color-border)', 
              color: 'var(--color-text-primary)', 
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Banner solo lectura */}
      {!canManage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
          background: 'var(--color-info-soft, #ebf5fb)', border: '1.5px solid #85c1e9',
          borderRadius: 'var(--radius-lg)', fontSize: 13, color: '#1a5276',
        }}>
          <Eye size={16} />
          <span><strong>Vista de seguimiento</strong> — Puedes ver el estado de los platos en tiempo real. Solo el cocinero puede cambiar el estado.</span>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard label="Pendientes"      value={pending.length}   icon={<Clock size={20} />}         color="warning" />
        <StatCard label="En preparación"  value={preparing.length} icon={<Flame size={20} />}          color="info" />
        <StatCard label="Listos"          value={ready.length}     icon={<CheckCircle2 size={20} />}   color="success" />
        <StatCard label="Total del día"   value={totalCount} icon={<ChefHat size={20} />}        color="primary" />
      </div>

      {/* Tablero Kanban */}
      <div className={styles.kanban}>
        {/* Pendientes */}
        <div className={styles.column}>
          <div className={styles.colHeader} style={{ borderBottomColor: TICKET_STATUS_COLORS.pending }}>
            <Clock size={16} style={{ color: TICKET_STATUS_COLORS.pending }} />
            <span>Pendiente</span>
            <span className={styles.colCount}>{pending.length}</span>
          </div>
          <div className={styles.colBody}>
            {pending.length === 0 ? (
              <div className={styles.colEmpty}>Sin pedidos pendientes 🎉</div>
            ) : (
              pending.map(r => (
                <TicketCard key={r.id} ticket={{...r, priority: r.occasion ? 'high' : 'normal', status: r.kitchenStatus || 'pending'}}
                  onAdvance={handleAdvance} onBack={handleBack} readOnly={!canManage} />
              ))
            )}
          </div>
        </div>

        {/* En preparación */}
        <div className={styles.column}>
          <div className={styles.colHeader} style={{ borderBottomColor: TICKET_STATUS_COLORS.preparing }}>
            <Flame size={16} style={{ color: TICKET_STATUS_COLORS.preparing }} />
            <span>En Preparación</span>
            <span className={styles.colCount}>{preparing.length}</span>
          </div>
          <div className={styles.colBody}>
            {preparing.length === 0 ? (
              <div className={styles.colEmpty}>Nada en preparación</div>
            ) : (
              preparing.map(r => (
                <TicketCard key={r.id} ticket={{...r, priority: r.occasion ? 'high' : 'normal', status: r.kitchenStatus}}
                  onAdvance={handleAdvance} onBack={handleBack} readOnly={!canManage} />
              ))
            )}
          </div>
        </div>

        {/* Listos */}
        <div className={styles.column}>
          <div className={styles.colHeader} style={{ borderBottomColor: TICKET_STATUS_COLORS.ready }}>
            <CheckCircle2 size={16} style={{ color: TICKET_STATUS_COLORS.ready }} />
            <span>Listo para servir</span>
            <span className={styles.colCount}>{ready.length}</span>
          </div>
          <div className={styles.colBody}>
            {ready.length === 0 ? (
              <div className={styles.colEmpty}>Nada listo aún</div>
            ) : (
              ready.map(r => (
                <TicketCard key={r.id} ticket={{...r, priority: r.occasion ? 'high' : 'normal', status: r.kitchenStatus}}
                  onAdvance={handleAdvance} onBack={handleBack} readOnly={!canManage} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cocinero no puede modificar ni agregar platos */}
    </div>
  )
}
