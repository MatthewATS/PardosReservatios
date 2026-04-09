/**
 * src/domain/hooks/useKitchenOrders.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Orquestador Cocina
 * Maneja el flujo de tickets y ejecuta las notificaciones automáticas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useReservations } from '@/domain/context/ReservationContext';
import { useAuth } from '@/domain/context/AuthContext';
import { kitchenService } from '@/data/services/kitchen.service';
import { kitchenRules } from '@/domain/utils/kitchen.rules';
import { TICKET_STATUS_LABELS } from '@/domain/context/KitchenContext';

export function useKitchenOrders(dateFilter) {
  const { reservations, updateReservation } = useReservations();
  const { user, hasPermission } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canManage = hasPermission('canManageKitchenOrders');

  // Filtrado lógico estricto sacado directamente de la UI
  const getLocalToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const kitchenOrders = reservations.filter(r => {
    if (r.date !== dateFilter) return false;
    if (!r.items || r.items.length === 0) return false;
    if (r.status === 'completed' || r.status === 'cancelled') return false;
    if (r.kitchenStatus === 'served') return false;
    if (dateFilter === getLocalToday()) {
      return r.status === 'seated';
    }
    return true; 
  });

  const pending = kitchenOrders.filter(r => !r.kitchenStatus || r.kitchenStatus === 'pending' || r.kitchenStatus === 'idle');
  const preparing = kitchenOrders.filter(r => r.kitchenStatus === 'preparing');
  const ready = kitchenOrders.filter(r => r.kitchenStatus === 'ready');

  // RN-09: Simular notificación automática al mozo (WebSocket simulado)
  const notifyWaiter = (tableId, newState) => {
     if (newState === 'ready') {
        toast(`🔔 Notificación al Mozo: El pedido para la Mesa ${tableId} está listo.`, { duration: 4000, icon: '📲' });
     } else if (newState === 'preparing') {
        // En un caso real se emitiría un evento WebSocket: socket.emit('ticket_updated', { tableId, newState })
     }
  };

  const handleAdvance = async (reservation, newStatus) => {
    if (!canManage) return;
    try {
      // RN-08
      kitchenRules.canModifyOrder(reservation.status);

      setIsProcessing(true);
      // Simular llamada API
      await kitchenService.updateTicketState(reservation.id, newStatus);
      
      // Actualizar contexto
      updateReservation(reservation.id, { kitchenStatus: newStatus });
      toast.success(`Ticket avanzado a: ${TICKET_STATUS_LABELS[newStatus]}`);

      // RN-09: Gatillar notificación al avanzar de estado
      notifyWaiter(reservation.tableId, newStatus);
      
    } catch(err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBack = async (reservation, prevStatus) => {
    if (!canManage) return;
    try {
      // RN-08
      kitchenRules.canModifyOrder(reservation.status);
      
      setIsProcessing(true);
      await kitchenService.updateTicketState(reservation.id, prevStatus);
      updateReservation(reservation.id, { kitchenStatus: prevStatus });
      
    } catch(err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    pending,
    preparing,
    ready,
    totalCount: kitchenOrders.length,
    canManage,
    isProcessing,
    handleAdvance,
    handleBack
  };
}
