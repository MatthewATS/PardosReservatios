/**
 * src/domain/hooks/useDashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Orquestador del Dashboard
 * Configura polling en tiempo real (RN-13) y aplica permisos de informes (RN-14).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/domain/context/AuthContext';
import { useReservations } from '@/domain/context/ReservationContext';
import { useClients } from '@/domain/context/ClientContext';
import { reportsUtils } from '@/domain/utils/reports.utils';

export function useDashboard() {
  const { user } = useAuth();
  const { todayReservations, reservations } = useReservations();
  const { clients } = useClients();

  // RN-13: Reflejar datos operativos en tiempo real simulado (Polling)
  const [lastTick, setLastTick] = useState(Date.now());

  useEffect(() => {
    // Simulamos que el dashboard hace "polling" de las mesas activas cada 30 segundos
    const interval = setInterval(() => {
      setLastTick(Date.now());
      // Aquí en un entorno real habría un fetch('/api/metrics')
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Recálculo dependiente del tick del polling y de variaciones en la base
  const metrics = useMemo(() => {
    return reportsUtils.generateMetrics(todayReservations, clients);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayReservations, clients, lastTick]);

  // RN-14: Aplicar Filtros para Informes
  // Solo accesibles para rol "Líder" o "Admin"
  const canApplyFilters = user?.role === 'Lider' || user?.role === 'Admin';
  
  const handleApplyFilters = (filters) => {
     if (!canApplyFilters) {
        toast.error('RN-14: Permisos insuficientes. Solo el líder puede procesar filtros de informes.');
        return [];
     }
     
     // Delegate purely to logic utility
     return reportsUtils.applyFilters(reservations, filters);
  };

  return {
    user,
    metrics,
    historicTotal: reservations.length,
    canApplyFilters,
    handleApplyFilters
  };
}
