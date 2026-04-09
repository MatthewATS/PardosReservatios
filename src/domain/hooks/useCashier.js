/**
 * src/domain/hooks/useCashier.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Orquestador Caja
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/domain/context/AuthContext';
import { useCash } from '@/domain/context/CashContext';
import { useReservations } from '@/domain/context/ReservationContext';
import { cashUtils } from '@/domain/utils/cash.utils';
import { cashService } from '@/data/services/cash.service';

export function useCashier() {
  const { user } = useAuth();
  const { 
    payments, todayPayments, todayTotal, todayByMethod, 
    shift, openShift, closeShift, addPayment 
  } = useCash();
  const { reservations, completeReservation } = useReservations();

  // Estados de interfaz controlados por el orquestador
  const [chargeRes, setChargeRes] = useState(null);
  const [payMethod, setPayMethod] = useState('efectivo');
  const [payNotes, setPayNotes] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [boletaPayment, setBoletaPayment] = useState(null);

  const [dateMode, setDateMode] = useState('seated');
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Lógica matemática (RN-10 indirecta)
  const chargeItems = chargeRes?.items || [];
  const calculatedTotal = chargeItems.length > 0 
    ? chargeItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
    : parseFloat(manualTotal) || 0;

  // Filtrado lógico
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const weekStart = useMemo(() => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const billableReservations = useMemo(() => {
    let list = reservations.filter(r => ['pending', 'seated'].includes(r.status));

    if (dateMode === 'seated') {
      list = list.filter(r => r.status === 'seated');
    } else if (dateMode === 'today') {
      list = list.filter(r => r.date === today);
    } else if (dateMode === 'week') {
      list = list.filter(r => r.date >= weekStart && r.date <= today);
    }

    if (search.trim().length >= 2) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.clientName?.toLowerCase().includes(q) ||
        r.clientPhone?.includes(q) ||
        r.tableId?.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.status === 'seated' && b.status !== 'seated') return -1;
      if (a.status !== 'seated' && b.status === 'seated') return 1;
      return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
    });
  }, [reservations, dateMode, search, today, weekStart]);

  const counts = useMemo(() => ({
    seated: reservations.filter(r => r.status === 'seated').length,
    today:  reservations.filter(r => ['pending','seated'].includes(r.status) && r.date === today).length,
    week:   reservations.filter(r => ['pending','seated'].includes(r.status) && r.date >= weekStart && r.date <= today).length,
    all:    reservations.filter(r => ['pending','seated'].includes(r.status)).length,
  }), [reservations, today, weekStart]);

  const openCharge = (reservation) => {
    if (!shift) {
      toast.error('Primero abre un turno de caja');
      return;
    }
    setChargeRes(reservation);
    setPayMethod('efectivo');
    setPayNotes('');
    setManualTotal('');
  };

  /**
   * RN-10, RN-11, RN-12 orquestados
   */
  const handleConfirmCharge = async () => {
     if (!chargeRes) return;
     
     setIsProcessing(true);
     try {
         // RN-10: Cálculos puros y validación
         const { total } = cashUtils.calculateTotal(chargeItems, chargeRes.guests, manualTotal);
         
         const paymentPayload = {
            reservationId: chargeRes.id,
            clientName:    chargeRes.clientName,
            guests:        chargeRes.guests,
            method:        payMethod,
            notes:         payNotes,
            amount:        total,
            items:         chargeItems,
            cashierId:     user.id,
            cashierName:   user.name,
            date:          today,
            time:          `${new Date().getHours()}:${new Date().getMinutes()}`
         };

         // Simular la llamada a pasarela
         const transacted = await cashService.processPayment(paymentPayload);
         
         // RN-12: Generar comprobante
         const receiptData = await cashService.generateReceipt(transacted);

         // RN-11: Acoplar estado (Completar reserva inmediatamente)
         completeReservation(chargeRes.id);

         // Actualizar base local
         const newPayment = addPayment(receiptData);
         
         toast.success(`✅ Cobro registrado: S/ ${total.toFixed(2)}`);
         setBoletaPayment(newPayment);
         setChargeRes(null);
     } catch (err) {
         toast.error(err.message);
     } finally {
         setIsProcessing(false);
     }
  };

  return {
    user,
    shift,
    openShift,
    closeShift,
    todayPayments,
    todayTotal,
    todayByMethod,
    
    // UI states
    search, setSearch,
    dateMode, setDateMode,
    billableReservations, counts,
    
    // Modal states
    chargeRes, setChargeRes,
    boletaPayment, setBoletaPayment,
    payMethod, setPayMethod,
    payNotes, setPayNotes,
    manualTotal, setManualTotal,
    calculatedTotal,
    chargeItems,
    isProcessing,
    
    // Handlers
    openCharge,
    handleConfirmCharge
  };
}
