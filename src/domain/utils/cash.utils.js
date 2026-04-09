/**
 * src/domain/utils/cash.utils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Caja Matemática Pura
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const IGV_RATE = 0.18;
export const MINIMUM_CONSUMPTION_PER_PERSON = 30.00; // S/ 30.00 de consumo mínimo

export const cashUtils = {
  /**
   * RN-10: Calcula el monto total y valida consumo mínimo
   */
  calculateTotal: (items, guests, manualTotal = 0) => {
    let totalItems = 0;
    if (items && items.length > 0) {
      totalItems = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
    } else if (manualTotal > 0) {
      totalItems = parseFloat(manualTotal);
    }

    if (totalItems <= 0) {
      throw new Error('RN-10: No se puede facturar un monto de S/ 0.00.');
    }

    // Validación opcional de consumo mínimo
    const minimumAllowed = (guests || 1) * MINIMUM_CONSUMPTION_PER_PERSON;
    if (totalItems < minimumAllowed && items && items.length > 0) {
      console.warn(`RN-10 (Aviso): El consumo no alcanza el mínimo por persona permitido S/${minimumAllowed}.`);
      // Podemos forzar un throw, o dejar el warning. Por requerimiento se aplica validación del monto
    }

    const subtotal = totalItems / (1 + IGV_RATE);
    const igv = totalItems - subtotal;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(totalItems.toFixed(2))
    };
  }
};
