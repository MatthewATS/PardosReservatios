/**
 * src/data/services/reservation.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Datos (Capa 3)
 * Este servicio abstrae el acceso a la base de datos (actualmente localStorage).
 * La capa de Dominio (Context/Hooks) usará esto sin preocuparse de si
 * se guarda en localStorage, Firebase o una API REST.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'pardos_reservations';

export const reservationService = {
  /** Obtiene las reservas de la base de datos local */
  getReservations: async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return null;
    } catch (e) {
      console.error('Error al obtener datos', e);
      return null;
    }
  },

  /** Guarda toda la lista de reservas */
  saveReservations: async (reservations) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
    } catch (e) {
      console.error('Error al guardar datos', e);
    }
  }
};
