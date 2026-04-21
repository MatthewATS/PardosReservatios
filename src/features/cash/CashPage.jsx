/**
 * src/features/cash/CashPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Módulo de Caja — rediseñado para flujo natural de cobro.
 * La cajera ve directamente las reservas pendientes de cobro,
 * hace clic en una y solo elige el método de pago.
 * Los ítems ya vienen de la reserva — no hace falta re-ingresarlos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react'
import {
  CreditCard, DollarSign, Clock, CheckCircle, X, Printer,
  Receipt, ChevronDown, ChevronUp, Search, Users, MapPin,
  CalendarDays, Utensils, Filter,
} from 'lucide-react'
import { useCashier } from '@/domain/hooks/useCashier'
import styles from './CashPage.module.css'
import { IGV_RATE } from '@/domain/utils/cash.utils'

import { PAYMENT_METHODS } from '@/context/CashContext'
import { Button } from '@/components/ui/Button'
import { Card, StatCard } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import toast from 'react-hot-toast'

// ── Boleta imprimible ─────────────────────────────────────────────────────────
function Boleta({ payment, onClose }) {
  if (!payment) return null
  const method   = PAYMENT_METHODS.find(m => m.id === payment.method)
  const subtotal = payment.amount / (1 + IGV_RATE)
  const igv      = payment.amount - subtotal
  const hasItems = payment.items && payment.items.length > 0

  return (
    <div className={styles.boleta}>
      <div className={styles.boletaHeader}>
        <div className={styles.boletaLogo}>🍗</div>
        <h2 className={styles.boletaTitle}>Pardos Chicken</h2>
        <p className={styles.boletaSub}>Sistema de Reservas — Miraflores</p>
        <p className={styles.boletaInfo}>RUC: 20123456789</p>
        <div className={styles.boletaDivider} />
        <p className={styles.boletaType}>BOLETA DE VENTA ELECTRÓNICA</p>
        <p className={styles.boletaNum}>N° {payment.id}</p>
      </div>

      <div className={styles.boletaSection}>
        <div className={styles.boletaRow2}><span>Fecha:</span><strong>{payment.date} {payment.time}</strong></div>
        <div className={styles.boletaRow2}><span>Cliente:</span><strong>{payment.clientName}</strong></div>
        <div className={styles.boletaRow2}><span>Personas:</span><strong>{payment.guests}</strong></div>
        <div className={styles.boletaRow2}><span>Cajero:</span><strong>{payment.cashierName}</strong></div>
      </div>

      <div className={styles.boletaDivider} />

      {hasItems ? (
        <div className={styles.boletaItems}>
          <div className={styles.boletaItemHeader}>
            <span>Descripción</span><span>Cant.</span><span>P.Unit</span><span>Total</span>
          </div>
          {payment.items.map((item, i) => (
            <div key={i} className={styles.boletaItem}>
              <span className={styles.boletaItemName}>{item.name}</span>
              <span className={styles.boletaItemQty}>{item.qty}</span>
              <span>S/ {(item.price || 0).toFixed(2)}</span>
              <span className={styles.boletaItemTotal}>S/ {((item.price || 0) * item.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.boletaNoItems}><p>Consumo general</p></div>
      )}

      <div className={styles.boletaDivider} />

      <div className={styles.boletaTotals}>
        <div className={styles.boletaRow2}><span>Subtotal (sin IGV):</span><span>S/ {subtotal.toFixed(2)}</span></div>
        <div className={styles.boletaRow2}><span>IGV (18%):</span><span>S/ {igv.toFixed(2)}</span></div>
        <div className={`${styles.boletaRow2} ${styles.boletaTotal}`}>
          <span>TOTAL:</span><strong>S/ {payment.amount.toFixed(2)}</strong>
        </div>
        <div className={styles.boletaRow2}><span>Método de pago:</span><span>{method?.icon} {method?.label}</span></div>
      </div>

      {payment.notes && (
        <>
          <div className={styles.boletaDivider} />
          <p className={styles.boletaNotes}>Nota: {payment.notes}</p>
        </>
      )}

      <div className={styles.boletaDivider} />
      <p className={styles.boletaFoot}>¡Gracias por su preferencia!</p>
      <p className={styles.boletaFoot}>www.pardoschicken.pe</p>

      <div className={styles.boletaActions}>
        <Button variant="primary" icon={<Printer size={15} />} onClick={() => window.print()} fullWidth id="btn-imprimir-boleta">
          Imprimir boleta
        </Button>
        <Button variant="ghost" onClick={onClose} fullWidth>Cerrar</Button>
      </div>
    </div>
  )
}

// ── Fila de pago en historial ─────────────────────────────────────────────────
function PaymentRow({ p, onViewBoleta }) {
  const [expanded, setExpanded] = useState(false)
  const method   = PAYMENT_METHODS.find(m => m.id === p.method)
  const hasItems = p.items && p.items.length > 0

  return (
    <div className={styles.paymentEntry}>
      <div className={styles.paymentItem} onClick={() => hasItems && setExpanded(v => !v)}>
        <span className={styles.payIcon}>{method?.icon || '💰'}</span>
        <div className={styles.payInfo}>
          <span className={styles.payClient}>{p.clientName}</span>
          <span className={styles.payMeta}>{p.time} · {method?.label} · {p.guests} pers.</span>
        </div>
        <span className={styles.payAmount}>S/ {p.amount.toFixed(2)}</span>
        <div className={styles.payActions}>
          <button className={styles.iconBtn} title="Ver boleta" onClick={e => { e.stopPropagation(); onViewBoleta(p) }}>
            <Receipt size={14} />
          </button>
          {hasItems && (
            <button className={styles.iconBtn} onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {expanded && hasItems && (
        <div className={styles.payItemList}>
          {p.items.map((item, i) => (
            <div key={i} className={styles.payItemRow}>
              <span className={styles.payItemName}>{item.qty}× {item.name}</span>
              <span className={styles.payItemPrice}>S/ {((item.price || 0) * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <div className={styles.payItemTotal}><span>Total</span><strong>S/ {p.amount.toFixed(2)}</strong></div>
        </div>
      )}
    </div>
  )
}

// ── Tarjeta de reserva para cobrar ────────────────────────────────────────────
function ReservationBillCard({ reservation, onCharge }) {
  const isSeated  = reservation.status === 'seated'
  const items     = reservation.items || []
  const total     = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
  const hasItems  = items.length > 0
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`${styles.billCard} ${isSeated ? styles.billCardSeated : ''}`}>
      {/* Badge de estado */}
      <div className={styles.billCardHeader}>
        <span className={`${styles.billStatus} ${isSeated ? styles.billStatusSeated : styles.billStatusPending}`}>
          {isSeated ? '🟢 En mesa' : '🕐 Reserva'}
        </span>
        <span className={styles.billCardId}>{reservation.id}</span>
      </div>

      {/* Datos principales */}
      <div className={styles.billCardBody}>
        <p className={styles.billClientName}>{reservation.clientName}</p>
        <div className={styles.billMeta}>
          <span><Clock size={12} /> {reservation.time}</span>
          <span><CalendarDays size={12} /> {reservation.date}</span>
          <span><MapPin size={12} /> Mesa {reservation.tableId || '—'}</span>
          <span><Users size={12} /> {reservation.guests} pers.</span>
        </div>
      </div>

      {/* Ítems del pedido */}
      {hasItems && (
        <button className={styles.billItemsToggle} onClick={() => setExpanded(v => !v)}>
          <Utensils size={12} />
          {items.length} plato{items.length > 1 ? 's' : ''} pedidos
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {expanded && hasItems && (
        <div className={styles.billItemsList}>
          {items.map((item, i) => (
            <div key={i} className={styles.billItemRow}>
              <span>{item.qty || 1}× {item.name}</span>
              <span>S/ {((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total y botón cobrar */}
      <div className={styles.billCardFooter}>
        <div className={styles.billTotal}>
          {hasItems ? (
            <>
              <span className={styles.billTotalLabel}>Total pedido</span>
              <strong className={styles.billTotalAmount}>S/ {total.toFixed(2)}</strong>
            </>
          ) : (
            <span className={styles.billNoItems}>Sin platos registrados</span>
          )}
        </div>
        <Button
          variant={isSeated ? 'primary' : 'secondary'}
          icon={<Receipt size={14} />}
          onClick={() => onCharge(reservation)}
          id={`btn-cobrar-${reservation.id}`}
        >
          Cobrar
        </Button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function CashPage() {
  const {
      user, shift, openShift, closeShift,
      todayPayments, todayTotal, todayByMethod,
      search, setSearch, dateMode, setDateMode,
      billableReservations, counts,
      chargeRes, setChargeRes, boletaPayment, setBoletaPayment,
      payMethod, setPayMethod, payNotes, setPayNotes,
      manualTotal, setManualTotal, calculatedTotal, chargeItems,
      isProcessing, openCharge, handleConfirmCharge
  } = useCashier()

  // Modal states for Shift
  const [shiftModal,     setShiftModal]    = useState(false)
  const [isShiftOpen,    setShiftOpen]     = useState(false)
  const [closePreview,   setClosePreview]  = useState(null)
  const [initialCash,    setInitialCash]   = useState('')

  const handleOpenShift = () => {
    openShift({ id: user.id, name: user.name }, Number(initialCash) || 0)
    toast.success('Turno de caja abierto')
    setShiftOpen(false)
    setInitialCash('')
  }

  const handleCloseShift = () => {
    const summary = closeShift()
    setClosePreview(summary)
    setShiftModal(true)
    toast.success('Turno cerrado correctamente')
  }

  const shiftDuration = shift
    ? Math.round((Date.now() - new Date(shift.openedAt).getTime()) / 60000)
    : 0

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Caja</h1>
          <p className={styles.subtitle}>Cobros, boletas y gestión de turno</p>
        </div>
        <div className={styles.headerActions}>
          {shift ? (
            <Button variant="danger" icon={<X size={16} />} onClick={handleCloseShift} id="btn-cerrar-turno">
              Cerrar turno
            </Button>
          ) : (
            <Button variant="primary" icon={<CreditCard size={16} />} onClick={() => setShiftOpen(true)} id="btn-abrir-turno">
              Abrir turno
            </Button>
          )}
        </div>
      </div>

      {/* Banner turno */}
      {shift ? (
        <div className={styles.shiftBanner}>
          <div className={styles.shiftIndicator} />
          <div>
            <span className={styles.shiftLabel}>Turno activo</span>
            <span className={styles.shiftInfo}>
              Cajero: <strong>{shift.cashierName}</strong> · Abierto hace {shiftDuration} min
            </span>
          </div>
          <div className={styles.shiftCash}>
            <span>Apertura:</span>
            <strong>S/ {shift.initialCash?.toFixed(2) || '0.00'}</strong>
          </div>
        </div>
      ) : (
        <div className={styles.noShiftBanner}>
          <CreditCard size={20} /> No hay turno de caja activo. Abre un turno para comenzar a cobrar.
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard label="Total hoy"  value={`S/ ${todayTotal.toFixed(2)}`}  icon={<DollarSign size={22} />} color="success" />
        <StatCard label="Cobros"     value={todayPayments.length}            icon={<CreditCard size={22} />} color="info" />
        <StatCard label="Promedio"   value={`S/ ${todayPayments.length > 0 ? (todayTotal / todayPayments.length).toFixed(2) : '0.00'}`} icon={<CheckCircle size={22} />} color="primary" />
        <StatCard label="IGV (18%)"  value={`S/ ${(todayTotal * IGV_RATE / (1 + IGV_RATE)).toFixed(2)}`} icon={<Receipt size={22} />} color="warning" />
      </div>

      {/* ── Sección principal: reservas a cobrar ── */}
      <div className={styles.billingSection}>
        {/* Panel izquierdo: lista de reservas */}
        <div className={styles.billPanel}>
          <div className={styles.billPanelHeader}>
            <div>
              <h2 className={styles.billPanelTitle}>Reservas a cobrar</h2>
              <p className={styles.billPanelSub}>{billableReservations.length} pendiente{billableReservations.length !== 1 ? 's' : ''}</p>
            </div>
          {/* Filtros en forma de tabs */}
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${dateMode === 'seated' ? styles.filterTabActive : ''} ${styles.filterTabSeated}`}
                onClick={() => setDateMode('seated')}
              >
                🟢 En mesa
                {counts.seated > 0 && <span className={styles.filterBadge}>{counts.seated}</span>}
              </button>
              <button
                className={`${styles.filterTab} ${dateMode === 'today' ? styles.filterTabActive : ''}`}
                onClick={() => setDateMode('today')}
              >
                Hoy
                {counts.today > 0 && <span className={styles.filterBadge}>{counts.today}</span>}
              </button>
              <button
                className={`${styles.filterTab} ${dateMode === 'week' ? styles.filterTabActive : ''}`}
                onClick={() => setDateMode('week')}
              >
                Esta semana
                {counts.week > 0 && <span className={styles.filterBadge}>{counts.week}</span>}
              </button>
              <button
                className={`${styles.filterTab} ${dateMode === 'all' ? styles.filterTabActive : ''}`}
                onClick={() => setDateMode('all')}
              >
                Todas
                {counts.all > 0 && <span className={styles.filterBadge}>{counts.all}</span>}
              </button>
            </div>
          </div>

          {/* Búsqueda */}
          <div className={styles.billSearch}>
            <Search size={14} className={styles.billSearchIcon} />
            <input
              type="search"
              placeholder="Buscar por cliente, mesa o ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.billSearchInput}
              id="buscar-reserva-caja"
            />
          </div>

          {/* Lista de reservas */}
          {billableReservations.length === 0 ? (
            <div className={styles.billEmpty}>
              <Receipt size={40} />
              <p>
                {dateMode === 'seated' ? 'No hay mesas ocupadas en este momento' :
                 dateMode === 'today'  ? 'No hay reservas pendientes de cobro hoy' :
                 dateMode === 'week'   ? 'No hay reservas esta semana' :
                 'No hay reservas pendientes de cobro'}
              </p>
              {dateMode === 'seated' && (
                <button className={styles.billShowAll} onClick={() => setDateMode('today')}>
                  Ver todas las de hoy
                </button>
              )}
              {dateMode === 'today' && (
                <button className={styles.billShowAll} onClick={() => setDateMode('all')}>
                  Ver todas las fechas
                </button>
              )}
            </div>
          ) : (
            <div className={styles.billList}>
              {billableReservations.map(r => (
                <ReservationBillCard
                  key={r.id}
                  reservation={r}
                  onCharge={shift ? openCharge : () => toast.error('Primero abre un turno de caja')}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho: métodos + historial */}
        <div className={styles.billSide}>
          {/* Cobros por método */}
          <Card title="Cobros por método" subtitle="Resumen del día">
            <div className={styles.methodList}>
              {PAYMENT_METHODS.map(m => {
                const amount = todayByMethod[m.id] || 0
                const pct    = todayTotal > 0 ? (amount / todayTotal) * 100 : 0
                return (
                  <div key={m.id} className={styles.methodItem}>
                    <span className={styles.methodIcon}>{m.icon}</span>
                    <div className={styles.methodInfo}>
                      <div className={styles.methodHeader}>
                        <span className={styles.methodLabel}>{m.label}</span>
                        <span className={styles.methodAmount}>S/ {amount.toFixed(2)}</span>
                      </div>
                      <div className={styles.methodBar}>
                        <div className={styles.methodFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.methodPct}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Historial del día */}
          <Card title="Cobros del día" subtitle={`${todayPayments.length} transacciones · S/ ${todayTotal.toFixed(2)}`} noPadding>
            {todayPayments.length === 0 ? (
              <div className={styles.empty}>
                <CreditCard size={36} />
                <p>No hay cobros registrados hoy</p>
              </div>
            ) : (
              <div className={styles.paymentList}>
                {todayPayments.map(p => (
                  <PaymentRow key={p.id} p={p} onViewBoleta={setBoletaPayment} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Modal: Cobrar reserva ───────────────── */}
      <Modal
        isOpen={!!chargeRes}
        onClose={() => setChargeRes(null)}
        title={chargeRes ? `Cobrar — ${chargeRes.clientName}` : ''}
        size="md"
      >
        {chargeRes && (() => {
          const subtotal = calculatedTotal / (1 + IGV_RATE)
          const igv      = calculatedTotal - subtotal
          return (
            <div className={styles.chargeModalGrid}>

              {/* ── Columna izquierda: consumo ── */}
              <div className={styles.chargeLeft}>
                {/* Info de la reserva */}
                <div className={styles.chargeClientCard}>
                  <div className={styles.chargeClientAvatar}>
                    {chargeRes.clientName?.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.chargeClientInfo}>
                    <span className={styles.chargeClientName}>{chargeRes.clientName}</span>
                    <span className={styles.chargeClientMeta}>
                      <CalendarDays size={11} /> {chargeRes.date} &nbsp;·&nbsp;
                      <Clock size={11} /> {chargeRes.time} &nbsp;·&nbsp;
                      <MapPin size={11} /> Mesa {chargeRes.tableId || '—'} &nbsp;·&nbsp;
                      <Users size={11} /> {chargeRes.guests} pers.
                    </span>
                  </div>
                  <span className={chargeRes.status === 'seated' ? styles.chargeBadgeSeated : styles.chargeBadgePending}>
                    {chargeRes.status === 'seated' ? '🟢 En mesa' : '🕐 Confirmada'}
                  </span>
                </div>

                {/* Lista de ítems */}
                <div className={styles.chargeItemsSection}>
                  <div className={styles.chargeItemsHeader}>
                    <Utensils size={13} />
                    <span>Consumo registrado</span>
                    {chargeItems.length > 0 && (
                      <span className={styles.chargeItemsCount}>{chargeItems.length} plato{chargeItems.length > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {chargeItems.length > 0 ? (
                    <div className={styles.chargeItemsScroll}>
                      {chargeItems.map((item, i) => (
                        <div key={i} className={styles.chargeItemRowNew}>
                          <span className={styles.chargeItemQty}>{item.qty || 1}×</span>
                          <span className={styles.chargeItemNameNew}>{item.name}</span>
                          <span className={styles.chargeItemPriceNew}>S/ {((item.price || 0) * (item.qty || 1)).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.chargeNoItemsNew}>
                      <Receipt size={28} />
                      <p>Sin platos registrados</p>
                      <Input
                        label="Monto a cobrar (S/)"
                        id="charge-manual-total"
                        type="number"
                        min={0}
                        step={0.5}
                        placeholder="0.00"
                        value={manualTotal}
                        onChange={e => setManualTotal(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Totales */}
                {chargeItems.length > 0 && (
                  <div className={styles.chargeTotalsBox}>
                    <div className={styles.chargeTotalRow}>
                      <span>Subtotal (sin IGV)</span>
                      <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.chargeTotalRow}>
                      <span>IGV (18%)</span>
                      <span>S/ {igv.toFixed(2)}</span>
                    </div>
                    <div className={styles.chargeTotalRowBig}>
                      <strong>TOTAL A COBRAR</strong>
                      <strong>S/ {calculatedTotal.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Columna derecha: método de pago ── */}
              <div className={styles.chargeRight}>
                <div className={styles.chargePaySection}>
                  <p className={styles.chargePayTitle}>Método de pago</p>
                  <div className={styles.chargeMethodGrid}>
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m.id}
                        className={`${styles.chargeMethodBtn} ${payMethod === m.id ? styles.chargeMethodBtnActive : ''}`}
                        onClick={() => setPayMethod(m.id)}
                      >
                        <span className={styles.chargeMethodIcon}>{m.icon}</span>
                        <span className={styles.chargeMethodLabel}>{m.label}</span>
                      </button>
                    ))}
                  </div>

                  <Textarea
                    label="Notas (opcional)"
                    id="charge-notes"
                    placeholder="Observaciones del cobro..."
                    value={payNotes}
                    onChange={e => setPayNotes(e.target.value)}
                  />
                </div>

                {/* Botón principal */}
                <div className={styles.chargeActionBox}>
                  <div className={styles.chargeTotalPreview}>
                    <span>Total</span>
                    <strong>S/ {calculatedTotal.toFixed(2)}</strong>
                  </div>
                  <Button
                    variant="primary"
                    icon={<Receipt size={16} />}
                    onClick={handleConfirmCharge}
                    isLoading={isProcessing}
                    fullWidth
                    id="btn-generar-boleta"
                  >
                    Generar boleta · S/ {calculatedTotal.toFixed(2)}
                  </Button>
                  <Button variant="ghost" onClick={() => setChargeRes(null)} fullWidth>
                    Cancelar
                  </Button>
                </div>
              </div>

            </div>
          )
        })()}
      </Modal>

      {/* ── Modal: Boleta ───────────────────────── */}
      <Modal isOpen={!!boletaPayment} onClose={() => setBoletaPayment(null)} title="Boleta de Venta" size="sm">
        <Boleta payment={boletaPayment} onClose={() => setBoletaPayment(null)} />
      </Modal>

      {/* ── Modal: Abrir turno ──────────────────── */}
      <Modal isOpen={isShiftOpen} onClose={() => setShiftOpen(false)} title="Abrir Turno de Caja" size="sm">
        <div className={styles.shiftForm}>
          <p className={styles.shiftDesc}>Ingresa el monto de apertura en efectivo para iniciar el turno.</p>
          <Input label="Efectivo de apertura (S/)" id="shift-cash" type="number"
            min={0} step={10} placeholder="0.00"
            value={initialCash} onChange={e => setInitialCash(e.target.value)} />
          <div className={styles.formActions}>
            <Button variant="ghost" onClick={() => setShiftOpen(false)}>Cancelar</Button>
            <Button variant="success" onClick={handleOpenShift} icon={<Clock size={15} />}>
              Abrir turno
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal: Resumen de cierre ─────────────── */}
      <Modal isOpen={shiftModal} onClose={() => setShiftModal(false)} title="Turno Cerrado — Resumen" size="md">
        {closePreview && (
          <div className={styles.shiftSummary}>
            <div className={styles.summaryTotal}>
              <span>Total cobrado</span>
              <strong>S/ {closePreview.totalAmount?.toFixed(2) || '0.00'}</strong>
            </div>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}><span>Transacciones</span><strong>{closePreview.totalTx}</strong></div>
              <div className={styles.summaryRow}><span>Cajero</span><strong>{closePreview.cashierName}</strong></div>
              <div className={styles.summaryRow}><span>Efectivo apertura</span><strong>S/ {closePreview.initialCash?.toFixed(2) || '0.00'}</strong></div>
            </div>
            {PAYMENT_METHODS.map(m => (
              <div key={m.id} className={styles.summaryRow}>
                <span>{m.icon} {m.label}</span>
                <strong>S/ {(closePreview.byMethod?.[m.id] || 0).toFixed(2)}</strong>
              </div>
            ))}
            <Button fullWidth variant="ghost" icon={<Printer size={15} />} onClick={() => window.print()}>
              Imprimir resumen
            </Button>
          </div>
        )}
      </Modal>
    </div>
  )
}
