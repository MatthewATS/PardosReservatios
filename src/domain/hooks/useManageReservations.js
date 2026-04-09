/**
 * src/domain/hooks/useManageReservations.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Orquestador
 * Hook para la gestión de la lista de reservas. Consume el contexto de
 * estados globales, el de Auth (para los roles), y delega las decisiones
 * a las validaciones puras (reservation.rules.js).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useReservations } from '@/domain/context/ReservationContext';
import { useAuth } from '@/domain/context/AuthContext';
import { reservationRules } from '@/domain/utils/reservation.rules';
import { reservationService } from '@/data/services/reservation.service';

export function useManageReservations() {
  const { 
    reservations, 
    todayReservations, 
    pendingRequests,
    completeReservation,
    seatReservation,
    cancelReservation,
    deleteReservation,
    deleteAllReservations,
    updateReservation,
    addReservation,
    approveReservation,
    rejectReservation,
    requestReservation
  } = useReservations();

  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // RN-04: Editar requiere validación de roles y de estado de la reserva
  const handleEdit = (reservation, onEditClick) => {
    try {
        reservationRules.canModifyReservation(reservation, user?.role || 'Anfitriona');
        onEditClick(reservation); // Lanza el modal en UI
    } catch (err) {
        toast.error(err.message);
    }
  };

  // RN-06: Eliminar reserva
  const handleDelete = async (reservationId) => {
    try {
        reservationRules.canDeleteReservation(null, user?.role || 'Anfitriona');
        // Si pasa la regla, ejecutamos
        deleteReservation(reservationId);
        toast.success("Reserva eliminada exitosamente");
    } catch (err) {
        toast.error(err.message);
    }
  };

  // RN-05: Enviar a Cajera solo si está confirmada ('seated')
  const handleSendToCashier = async (reservation) => {
    try {
       reservationRules.canSendToCashier(reservation);
       
       setIsProcessing(true);
       // Simulamos que el reservationService lo envia a la cajera (actualiza el estado remoto y local)
       // Pudiéramos simplemente poner el flag sentToCashier en true localmente
       updateReservation(reservation.id, { sentToCashier: true });
       toast.success(`Reserva ${reservation.id} enviada a cajera.`);
    } catch (err) {
       toast.error(err.message);
    } finally {
       setIsProcessing(false);
    }
  };

  return {
    reservations,
    todayReservations,
    pendingRequests,
    isProcessing,
    userRole: user?.role,
    
    // Wrappers puros listos para la UI
    handleEdit,
    handleDelete,
    handleSendToCashier,
    handleSeat: seatReservation,
    handleComplete: completeReservation,
    handleDeleteAll: deleteAllReservations,
    handleCancel: cancelReservation,
    addReservation,
    approveReservation,
    rejectReservation,
    requestReservation,
    updateReservation
  };
}
