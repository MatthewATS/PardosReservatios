/**
 * src/data/services/cash.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Datos (Capa 3) - Caja y Facturación
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const cashService = {
  /**
   * Simula el procesamiento de un pago pasándolo por una pasarela.
   */
  processPayment: async (paymentData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!paymentData.amount || paymentData.amount <= 0) {
           return reject(new Error('El monto a cobrar debe ser mayor a 0'));
        }
        resolve({
          ...paymentData,
          transactionId: `TX-${Date.now()}`,
          status: 'success'
        });
      }, 400);
    });
  },

  /**
   * Genera el recibo o comprobante (RN-12 obligatoriedad).
   */
  generateReceipt: async (transactionData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          receiptId: `BOL-${Math.floor(Math.random() * 100000)}`,
          url: `/receipts/${transactionData.transactionId}.pdf`,
          ...transactionData
        });
      }, 200);
    });
  }
};
