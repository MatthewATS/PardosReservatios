/**
 * src/features/reservations/ReservationsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de gestión de reservas en tiempo real.
 * Permite:
 *   - Ver solicitudes pendientes de aprobación (estado REQUESTED) con banner
 *   - Aprobar o rechazar solicitudes con asignación de mesa
 *   - Ver todas las reservas del día con filtros por estado
 *   - Crear una nueva reserva (abre modal con formulario)
 *   - Cambiar el estado de una reserva (sentar, completar, cancelar)
 *   - Buscar reservas por nombre de cliente
 *
 * Acceso: Todos los roles (con restricciones según permisos)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { Plus, Search, CalendarCheck, Bell, CheckCircle2, XCircle, Clock, Users, Phone, Trash2 } from 'lucide-react'
import { RESERVATION_STATUS, STATUS_LABELS, STATUS_COLORS } from  '@/domain/context/ReservationContext'
import { useAuth } from  '@/domain/context/AuthContext'
import { useManageReservations } from '@/domain/hooks/useManageReservations'
import { Button } from  '@/presentation/components/ui/Button'
import { Input, Select } from  '@/presentation/components/ui/Input'
import { Card } from  '@/presentation/components/ui/Card'
import { Modal } from  '@/presentation/components/ui/Modal'
import ReservationForm from './ReservationForm'
import ReservationCard from './ReservationCard'
import styles from './ReservationsPage.module.css'

const STATUS_FILTERS = [
  { value: 'all',                              label: 'Todas' },
  { value: RESERVATION_STATUS.PENDING,         label: 'Pendientes' },
  { value: RESERVATION_STATUS.SEATED,          label: 'En mesa' },
  { value: RESERVATION_STATUS.COMPLETED,       label: 'Completadas' },
  { value: RESERVATION_STATUS.CANCELLED,       label: 'Canceladas' },
]

// Mesas disponibles para asignar al aprobar
const TABLES = Array.from({ length: 20 }, (_, i) => ({
  id: `T${String(i + 1).padStart(2, '0')}`,
  label: `Mesa ${i + 1}`,
}))

// ── Panel de aprobación de solicitudes ────────────────────────────────────────
function RequestsPanel({ requests, onApprove, onReject }) {
  const [selected, setSelected]   = useState(null)  // request being reviewed
  const [tableId,  setTableId]    = useState('T01')
  const [reason,   setReason]     = useState('')
  const [action,   setAction]     = useState(null)  // 'approve' | 'reject'

  if (requests.length === 0) return null

  const handleConfirm = () => {
    if (action === 'approve') {
      onApprove(selected.id, tableId)
    } else if (action === 'reject') {
      onReject(selected.id, reason)
    }
    setSelected(null)
    setAction(null)
    setReason('')
    setTableId('T01')
  }

  const occ = {
    'Cumpleaños': '🎂', 'Aniversario': '💑', 'Reunión': '💼',
    'Graduación': '🎓', 'Familiar': '👨‍👩‍👧', 'Otro': '✨',
  }

  return (
    <>
      <div className={styles.requestsBanner}>
        <div className={styles.requestsBannerInner}>
          <Bell size={18} className={styles.requestsBell} />
          <div>
            <span className={styles.requestsLabel}>Solicitudes de clientes pendientes</span>
            <span className={styles.requestsCount}>{requests.length} solicitud{requests.length !== 1 ? 'es' : ''} en espera de aprobación</span>
          </div>
        </div>

        <div className={styles.requestsList}>
          {requests.map(r => (
            <div key={r.id} className={styles.requestCard}>
              <div className={styles.requestInfo}>
                <div className={styles.requestHeader}>
                  <span className={styles.requestId}>#{r.id}</span>
                  {r.occasion && <span className={styles.requestOcc}>{occ[r.occasion] || '✨'} {r.occasion}</span>}
                  {r.source === 'public' && <span className={styles.requestSource}>🌐 Web</span>}
                </div>
                <h4 className={styles.requestName}>{r.clientName}</h4>
                <div className={styles.requestMeta}>
                  <span><Phone size={11} /> {r.clientPhone}</span>
                  <span><CalendarCheck size={11} /> {r.date} · {r.time}</span>
                  <span><Users size={11} /> {r.guests} personas</span>
                </div>
                {r.notes && <p className={styles.requestNote}>📝 {r.notes}</p>}
              </div>
              <div className={styles.requestActions}>
                <button className={styles.approveBtn}
                  onClick={() => { setSelected(r); setAction('approve') }}>
                  <CheckCircle2 size={14} /> Aprobar
                </button>
                <button className={styles.rejectBtn}
                  onClick={() => { setSelected(r); setAction('reject') }}>
                  <XCircle size={14} /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de confirmación */}
      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setAction(null) }}
        title={action === 'approve' ? '✅ Aprobar solicitud' : '❌ Rechazar solicitud'}
        size="sm">
        {selected && (
          <div className={styles.approveModal}>
            <div className={styles.approveInfo}>
              <p><strong>{selected.clientName}</strong> · {selected.date} {selected.time} · {selected.guests} pers.</p>
              {selected.occasion && <p>Ocasión: {selected.occasion}</p>}
            </div>

            {action === 'approve' ? (
              <>
                <label className={styles.approveLabel}>Asignar mesa:</label>
                <select className={styles.approveSelect}
                  value={tableId} onChange={e => setTableId(e.target.value)}>
                  {TABLES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <div className={styles.approveActions}>
                  <Button variant="ghost" onClick={() => { setSelected(null); setAction(null) }}>Cancelar</Button>
                  <Button variant="success" icon={<CheckCircle2 size={15} />} onClick={handleConfirm}>
                    Confirmar aprobación
                  </Button>
                </div>
              </>
            ) : (
              <>
                <label className={styles.approveLabel}>Motivo de rechazo (opcional):</label>
                <textarea className={styles.rejectTextarea}
                  placeholder="Ej: No hay disponibilidad en esa fecha..."
                  value={reason} onChange={e => setReason(e.target.value)} rows={3} />
                <div className={styles.approveActions}>
                  <Button variant="ghost" onClick={() => { setSelected(null); setAction(null) }}>Cancelar</Button>
                  <Button variant="danger" icon={<XCircle size={15} />} onClick={handleConfirm}>
                    Confirmar rechazo
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const {
    reservations, todayReservations, pendingRequests,
    userRole,
    handleEdit: orchestratorEdit,
    handleDelete,
    handleSendToCashier,
    handleSeat,
    handleComplete,
    handleCancel,
    handleDeleteAll,
    addReservation,
    updateReservation,
    approveReservation,
    rejectReservation
  } = useManageReservations()
  const { user, hasPermission } = useAuth()

  const [search,          setSearch]     = useState('')
  const [statusFilter,    setStatus]     = useState('all')
  const [dateFilter,      setDate]       = useState('today')
  const [isModalOpen,     setModalOpen]  = useState(false)
  const [editReservation, setEdit]       = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const baseList = dateFilter === 'today' ? todayReservations : reservations.filter(
    r => r.status !== RESERVATION_STATUS.REQUESTED
  )

  const filtered = baseList.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchSearch = !search ||
      r.clientName.toLowerCase().includes(search.toLowerCase()) ||
      r.clientPhone?.includes(search) || r.id.includes(search)
    return matchStatus && matchSearch
  })

  const handleCreate = (data) => {
    addReservation({ ...data, createdBy: user.id })
    setModalOpen(false)
  }

  const handleEdit = (reservation) => {
    setEdit(reservation)
    setModalOpen(true)
  }

  const handleUpdate = (data) => {
    if (editReservation) updateReservation(editReservation.id, data)
    setModalOpen(false)
    setEdit(null)
  }

  const handleApprove = (id, tableId) => {
    approveReservation(id, tableId, user.name)
  }

  const handleReject = (id, reason) => {
    rejectReservation(id, reason)
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reservas</h1>
          <p className={styles.subtitle}>
            {filtered.length} reserva{filtered.length !== 1 ? 's' : ''} · {pendingRequests.length > 0 && (
              <span className={styles.badgeIndicator}>{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {hasPermission('canDeleteAnyReservation') && reservations.length > 0 && (
            confirmDeleteAll ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-error-light, #fff0f0)', border: '1px solid var(--color-error)', borderRadius: 10, padding: '6px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-error)' }}>¿Eliminar todas ({reservations.length})?</span>
                <Button variant="danger" size="sm" onClick={() => { deleteAllReservations(); setConfirmDeleteAll(false) }}>Sí, borrar todo</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteAll(false)}>No</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={<Trash2 size={15} />}
                onClick={() => setConfirmDeleteAll(true)}
                style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                id="btn-borrar-todas-reservas">
                Borrar todas
              </Button>
            )
          )}
          {hasPermission('canManageReservations') && (
            <Button variant="primary" icon={<Plus size={16} />}
              onClick={() => { setEdit(null); setModalOpen(true) }}
              id="btn-nueva-reserva">
              Nueva Reserva
            </Button>
          )}
        </div>
      </div>

      {/* ── Solicitudes pendientes de aprobación ── */}
      {hasPermission('canManageReservations') && (
        <RequestsPanel
          requests={pendingRequests}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* Filtros */}
      <Card noPadding>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input type="search" placeholder="Buscar por cliente, teléfono o ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              className={styles.searchInput} id="buscar-reserva" />
          </div>
          <div className={styles.dateToggle}>
            <button className={`${styles.toggleBtn} ${dateFilter === 'today' ? styles.toggleActive : ''}`}
              onClick={() => setDate('today')}>Hoy</button>
            <button className={`${styles.toggleBtn} ${dateFilter === 'all' ? styles.toggleActive : ''}`}
              onClick={() => setDate('all')}>Todas</button>
          </div>
          <div className={styles.statusFilters}>
            {STATUS_FILTERS.map(f => (
              <button key={f.value}
                className={`${styles.statusBtn} ${statusFilter === f.value ? styles.statusActive : ''}`}
                onClick={() => setStatus(f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <CalendarCheck size={56} />
          <h3>No hay reservas</h3>
          <p>No se encontraron reservas con los filtros aplicados.</p>
          {hasPermission('canManageReservations') && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setModalOpen(true)}>
              Crear primera reserva
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.reservationGrid}>
          {filtered.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onEdit={() => orchestratorEdit(r, setEdit)}
              onSeat={() => handleSeat(r.id)}
              onComplete={() => handleComplete(r.id)}
              onCancel={(reason) => handleCancel(r.id, reason)}
              canCancel={userRole === 'Lider' || userRole === 'Admin'}
              onDelete={() => handleDelete(r.id)}
              canDelete={userRole === 'Lider' || userRole === 'Admin'}
              onSendToCashier={() => handleSendToCashier(r)}
            />
          ))}
        </div>
      )}

      {/* Modal formulario */}
      <Modal isOpen={isModalOpen} onClose={() => { setModalOpen(false); setEdit(null) }}
        title={editReservation ? 'Editar Reserva' : 'Nueva Reserva'} size="lg">
        <ReservationForm
          initialData={editReservation}
          onSubmit={editReservation ? handleUpdate : handleCreate}
          onCancel={() => { setModalOpen(false); setEdit(null) }}
        />
      </Modal>
    </div>
  )
}
