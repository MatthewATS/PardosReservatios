/**
 * src/data/services/kitchen.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Datos (Capa 3) - Cocina
 * Maneja la comunicación (simulada) de los pedidos hacia una API o base de datos.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const kitchenService = {
  /**
   * Simula el envío de una nueva orden a la base de datos de tickets.
   */
  createTicket: async (ticketData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...ticketData,
          kitchenStatus: 'pending',
          id: `KT-${Date.now()}`
        });
      }, 300);
    });
  },

  /**
   * Simula la actualización persistente del estado de un ticket.
   */
  updateTicketState: async (reservationId, newState) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, reservationId, newState });
      }, 200);
    });
  }
};
