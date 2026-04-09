/**
 * src/presentation/features/reservations/ReservationForm.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Presentación (UI) - PURA 
 * 
 * Este componente es completamente tonto. 
 * NO tiene reglas de disponibilidad de mesas.
 * NO llama a la API de RENIEC directamente.
 * NO valida límites de capacidad ni de tiempo. 
 * TODO esto viene del orquestador (Custom Hook: useReservationForm).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Search, UserPlus } from 'lucide-react'
import { useClients } from '@/domain/context/ClientContext'
import { useReservations } from '@/domain/context/ReservationContext'
import { useReservationForm, getLocalToday } from '@/domain/hooks/useReservationForm'
import { Input, Select, Textarea } from '@/presentation/components/ui/Input'
import { Button } from '@/presentation/components/ui/Button'
import { MenuSelector } from '@/presentation/components/ui/MenuSelector'
import styles from './ReservationForm.module.css'

const OCCASIONS = ['', 'Cumpleaños', 'Aniversario', 'Reunión de negocios', 'Cena romántica', 'Familiar', 'Otro']
const TIME_SLOTS = [
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00'
]

const getAvailableTimeSlots = (selectedDate) => {
  if (selectedDate !== getLocalToday()) return TIME_SLOTS
  const now = new Date()
  const currentMins = now.getHours() * 60 + now.getMinutes()
  return TIME_SLOTS.filter(slot => {
    const [h, m] = slot.split(':').map(Number)
    return (h * 60 + m) > currentMins
  })
}

export default function ReservationForm({ initialData, onSubmit, onCancel }) {
  // Solo inyectamos dependencias compartidas al Hook Orquestador
  const { findByDni, addClient } = useClients()
  const { tables, reservations } = useReservations()

  // Delegamos toda la lógica y el estado a la Capa de Dominio a través del Hook Orquestador
  const {
    form,
    setForm,
    errors,
    handleChange,
    submitForm,
    isSubmitting,
    isSearchingDni,
    clientFound
  } = useReservationForm({
    initialData,
    onSubmit,
    tables,
    reservations,
    findClientByDni: findByDni,
    addClient,
  })

  // Funciones UI puras
  const availableTimeSlots = getAvailableTimeSlots(form.date)
  const availableTables = tables.filter(t => t.capacity >= form.guests)

  return (
    <form onSubmit={submitForm} className={styles.form} noValidate>
      {/* Datos del cliente */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Datos del cliente</h3>

        <div className={styles.phoneSearch}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Input
              label="DNI del cliente (Búsqueda inicial automatizada)"
              id="res-dni"
              name="clientDni"
              type="text"
              maxLength={8}
              placeholder="Ej: 12345678"
              value={form.clientDni}
              onChange={handleChange}
              icon={<Search size={15} />}
              hint="Ingresa el DNI para autocompletar mágicamente..."
              required
              error={errors.clientDni}
            />
            {isSearchingDni && (
              <span className={styles.dniLoading} style={{ position:'absolute', right:'12px', top:'36px', fontSize:'11px', fontWeight:600, color:'var(--color-primary)' }}>Buscando RENIEC...</span>
            )}
          </div>
          {clientFound && (
            <span className={styles.clientFoundBadge}>✓ Cliente validado</span>
          )}
          {form.clientDni.length === 8 && !clientFound && !isSearchingDni && (
            <span className={styles.newClientBadge}>
              <UserPlus size={12} /> Cliente nuevo
            </span>
          )}
        </div>

        <div className={styles.row2}>
          <Input
            label="Nombre completo"
            id="res-name"
            name="clientName"
            placeholder="Nombre del cliente"
            value={form.clientName}
            onChange={handleChange}
            error={errors.clientName}
            required
            disabled={clientFound}
          />
          <Input
            label="Teléfono"
            id="res-phone"
            name="clientPhone"
            type="tel"
            placeholder="987654321"
            value={form.clientPhone}
            onChange={handleChange}
            error={errors.clientPhone}
            required
            disabled={clientFound}
          />
        </div>
        <div className={styles.row2}>
          <Input
            label="Correo (opcional)"
            id="res-email"
            name="clientEmail"
            type="email"
            placeholder="email@ejemplo.com"
            value={form.clientEmail}
            onChange={handleChange}
            disabled={clientFound}
          />
        </div>
      </div>

      {/* Datos de la reserva */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Datos de la reserva</h3>

        <div className={styles.row3}>
          <Input
            label="Fecha"
            id="res-date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            error={errors.date}
            required
            min={getLocalToday()}
          />
          <Select
            label="Hora"
            id="res-time"
            name="time"
            value={form.time}
            onChange={handleChange}
            error={errors.time}
            required
          >
            {availableTimeSlots.length === 0 ? (
              <option value="">— No hay horarios disponibles —</option>
            ) : (
              availableTimeSlots.map(t => (
                <option key={t} value={t}>{t}</option>
              ))
            )}
          </Select>
          <Input
            label="N° personas"
            id="res-guests"
            name="guests"
            type="number"
            min={1}
            max={20}
            value={form.guests}
            onChange={handleChange}
            error={errors.guests}
            required
          />
        </div>

        <div className={styles.row2}>
          <Select
            label="Mesa"
            id="res-table"
            name="tableId"
            value={form.tableId}
            onChange={handleChange}
            error={errors.tableId}
            required
          >
            <option value="">Seleccionar mesa...</option>
            {availableTables.map(t => (
              <option key={t.id} value={t.id}>
                Mesa {t.number} — {t.zone} (cap. {t.capacity})
              </option>
            ))}
          </Select>
          <Select
            label="Ocasión"
            id="res-occasion"
            name="occasion"
            value={form.occasion}
            onChange={handleChange}
          >
            {OCCASIONS.map(o => (
              <option key={o} value={o}>{o || '— Sin ocasión —'}</option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Notas"
          id="res-notes"
          name="notes"
          placeholder="Alergias o solicitudes especiales..."
          value={form.notes}
          onChange={handleChange}
        />
      </div>

      {/* Selector de Platos */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Platos (Adelantar Pedido)</h3>
        <MenuSelector 
           selectedItems={form.items} 
           onChange={items => setForm(f => ({ ...f, items }))} 
        />
      </div>

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {initialData ? 'Guardar Cambios' : 'Ingresar Reserva'}
        </Button>
      </div>
    </form>
  )
}
