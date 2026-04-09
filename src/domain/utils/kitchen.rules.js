/**
 * src/domain/utils/kitchen.rules.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Cocina
 * Reglas puras que validan el comportamiento operativo.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const kitchenRules = {
  /**
   * RN-07: Validar que una comanda tenga todos los datos requeridos.
   */
  validateNewOrder: (orderData) => {
    if (!orderData.clientId && !orderData.clientName) {
       throw new Error('RN-07: La comanda debe estar asociada a un cliente o nombre de cliente.');
    }
    if (!orderData.tableId) {
       throw new Error('RN-07: No se puede enviar una comanda sin asignar número de mesa.');
    }
    if (!orderData.items || orderData.items.length === 0) {
       throw new Error('RN-07: La comanda no puede estar vacía. Agrega al menos un plato/bebida.');
    }
    return true;
  },

  /**
   * RN-08: Rechazar modificaciones de pedido si la reserva asociada ya fue pagada.
   */
  canModifyOrder: (reservationStatus) => {
    if (reservationStatus === 'pagada' || reservationStatus === 'completed') {
      throw new Error('RN-08: No se puede modificar ni avanzar tickets de un pedido que ya ha sido facturado/pagado.');
    }
    if (reservationStatus === 'cancelled') {
        throw new Error('La reserva a la que pertenece este ticket fue cancelada.');
    }
    return true;
  }
};
