/**
 * src/domain/utils/reports.utils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Motor de reportes basado en reglas puras
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const reportsUtils = {
  /**
   * RN-14: Aplica filtros combinados. Solo accesible si las reglas de orquestador lo permiten.
   */
  generateMetrics: (reservations, clients) => {
    // Calculadoras matemáticas puras de estado
    const pending = reservations.filter(r => r.status === 'pending');
    const seated = reservations.filter(r => r.status === 'seated');
    const completed = reservations.filter(r => r.status === 'completed');
    const cancelled = reservations.filter(r => r.status === 'cancelled');

    // Mapeo
    const upcoming = [...pending, ...seated]
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(0, 6);

    const vips = clients.filter(c => c.vip);

    return {
       pending,
       seated,
       completed,
       cancelled,
       upcoming,
       vips,
       totalReservations: reservations.length,
       totalClients: clients.length
    };
  },

  applyFilters: (reservations, { dateFilter, statusFilter }) => {
    // Regla de filtros avanzados (RN-14)
    return reservations.filter(r => {
      let match = true;
      if (dateFilter && dateFilter !== 'all') {
         match = match && (r.date === dateFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
         match = match && (r.status === statusFilter);
      }
      return match;
    });
  }
};
