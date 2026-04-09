/**
 * src/domain/utils/reservation.rules.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2)
 * Puras funciones de reglas de negocio que garantizan el correcto funcionamiento
 * sin acoplarse al estado de React o la UI. Lanzan errores si la regla se rompe.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const reservationRules = {
  /**
   * RN-02: Validar campos obligatorios del cliente y formulario.
   */
  validateReservationData: (form) => {
    const errors = {};
    if (!form.clientName?.trim()) errors.clientName = 'Nombre del cliente requerido';
    if (!form.clientPhone?.trim()) errors.clientPhone = 'Teléfono requerido';
    if (!form.date) errors.date = 'Fecha requerida';
    if (!form.time) errors.time = 'Hora requerida';
    
    if (!form.guests || form.guests < 1) {
      errors.guests = 'Mínimo 1 persona';
    }
    if (!form.tableId) {
      errors.tableId = 'Selecciona una mesa';
    }

    if (Object.keys(errors).length > 0) {
      const err = new Error('RN-02: Faltan campos obligatorios');
      err.validationErrors = errors;
      throw err;
    }
  },

  /**
   * Valida restricciones de tiempo (ej. no reservar en el pasado si es hoy).
   */
  validateTimeSlot: (date, time, todayStr) => {
    if (date === todayStr) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const [fh, fm] = time.split(':').map(Number);
      if ((fh * 60 + fm) <= currentMins) {
        throw new Error('El horario seleccionado ya pasó. Elige una hora futura.');
      }
    }
  },

  /**
   * RN-01: Validar disponibilidad de mesas antes de aceptar reserva y su capacidad.
   */
  checkTableAvailability: (reservations, tables, form, editingId = null) => {
    const selectedTable = tables.find(t => t.id === form.tableId);
    if (!selectedTable) throw new Error('Mesa inválida');

    if (selectedTable.capacity < form.guests) {
      throw new Error(`RN-02: La mesa ${selectedTable.number} tiene capacidad máxima para ${selectedTable.capacity} personas.`);
    }

    // Comprobar conflictos
    const conflictingRev = reservations.find(r => {
      if (editingId && r.id === editingId) return false;
      if (r.tableId !== form.tableId) return false;
      if (r.date !== form.date) return false;
      if (r.status === 'cancelled' || r.status === 'completed') return false;

      // Si la mesa está físicamente SENTADA, no se puede hacer otra reserva
      if (r.status === 'seated') return true;
      // Choca exactamente en la misma hora
      if (r.time === form.time) return true;

      return false;
    });

    if (conflictingRev) {
      throw new Error(`RN-01 Ocupada: Esa mesa está en uso (sin pagar) o ya tiene una reserva exacta a las ${conflictingRev.time}.`);
    }
  },

  /**
   * RN-04: Modificación permitida solo si no ha sido enviada a cajera o no registrada como pago.
   * Y solo los roles Anfitriona o Líder pueden modificar reservas validas.
   */
  canModifyReservation: (reservation, userRole) => {
    if (userRole !== 'Lider' && userRole !== 'Anfitriona' && userRole !== 'Admin') {
      throw new Error('RN-04: Solo los roles Anfitriona o Líder pueden modificar reservas.');
    }
    if (reservation.status === 'completed' || reservation.status === 'pagada') {
      throw new Error('RN-04: No se puede modificar una reserva que ya ha sido completada o pagada.');
    }
    if (reservation.sentToCashier) {
      throw new Error('RN-04: No se puede modificar una reserva que ya fue enviada a la cajera.');
    }
    if (reservation.status === 'cancelled') {
        throw new Error('No se puede modificar una reserva cancelada.');
    }
    return true;
  },

  /**
   * RN-05: Solo enviar a cajera si la mesa ha sido confirmada ('seated').
   */
  canSendToCashier: (reservation) => {
    if (reservation.status !== 'seated') {
       throw new Error('RN-05: Solo se puede enviar a la cajera si la mesa ha sido confirmada (estado: En Mesa).');
    }
  },

  /**
   * RN-06: Solo perfil "Líder" (o Admin) puede eliminar reservas.
   */
  canDeleteReservation: (reservation, userRole) => {
    if (userRole !== 'Lider' && userRole !== 'Admin') {
      throw new Error('RN-06: Permisos insuficientes. Solo el rol Líder puede eliminar reservas.');
    }
  }
};
