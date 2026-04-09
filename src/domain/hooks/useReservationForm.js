/**
 * src/domain/hooks/useReservationForm.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Capa de Dominio (Capa 2) - Orquestador
 * Gestiona el estado de la UI (form, errores, fetching) estúpidamente, pero
 * al recibir el llamado de onSubmit orquesta las reglas de negocio, 
 * llama a servicios externos (RENIEC) y coordina la persistencia.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { externalService } from '@/data/services/external.service';
import { reservationRules } from '@/domain/utils/reservation.rules';

export const getLocalToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function useReservationForm({ initialData, onSubmit, tables, reservations, findClientByDni, addClient }) {
  const [form, setForm] = useState({
    clientId:    initialData?.clientId || '',
    clientDni:   initialData?.clientDni || '',
    clientName:  initialData?.clientName || '',
    clientPhone: initialData?.clientPhone || '',
    clientEmail: initialData?.clientEmail || '',
    date:        initialData?.date || getLocalToday(),
    time:        initialData?.time || '13:00',
    guests:      initialData?.guests || 2,
    tableId:     initialData?.tableId || '',
    occasion:    initialData?.occasion || '',
    notes:       initialData?.notes || '',
    items:       initialData?.items || [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingDni, setIsSearchingDni] = useState(false);
  const [clientFound, setClientFound] = useState(!!initialData?.clientId);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const val = name === 'guests' ? Number(value) : value;

    setForm(prev => {
      let updated = { ...prev, [name]: val };
      
      // Limpiar mesa si al cambiar guests, la tabla actual se desborda
      // Opcional: Puede ser RN pura o de UX
      if (name === 'guests' && prev.tableId) {
        const selectedTable = tables.find(t => t.id === prev.tableId);
        if (selectedTable && selectedTable.capacity < val) {
           updated.tableId = '';
           toast.error(`La mesa seleccionada ha sido deseleccionada porque no tiene capacidad para ${val} personas.`);
        }
      }
      return updated;
    });

    // Limpiar errores mientras el usuario teclea
    setErrors(e => ({ ...e, [name]: '' }));
  }, [tables]);

  /** 
   * Búsqueda Orquestada de DNI 
   */
  useEffect(() => {
    async function handleDniSearch() {
      if (form.clientDni.length === 8) {
        // 1. Buscar en BD local (Regla de negocio implícita o cache)
        const localClient = findClientByDni(form.clientDni);
        if (localClient) {
          setForm(f => ({
            ...f, clientId: localClient.id, clientName: localClient.name,
            clientPhone: localClient.phone, clientEmail: localClient.email || ''
          }));
          setClientFound(true);
          toast.success(`Cliente encontrado localmente: ${localClient.name}`);
          return;
        }

        // 2. Si no, invocar a RN/External Service puro
        setClientFound(false);
        setIsSearchingDni(true);
        const data = await externalService.getPersonaByDni(form.clientDni);
        setIsSearchingDni(false);

        if (data && data.nombres) {
          const fullName = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`;
          setForm(f => ({ ...f, clientId: '', clientName: fullName, clientPhone: '' }));
          toast.success('DNI consultado en RENIEC. Completa el teléfono.');
        } else {
          setForm(f => ({ ...f, clientId: '', clientName: '', clientPhone: '' }));
        }
      } else {
          setClientFound(false);
      }
    }
    
    // Evitar loop si la búsqueda se dispara y fue porque se inicializó
    handleDniSearch();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.clientDni, findClientByDni]); // Explicitly omitted form to avoid infinite loop typing

  /**
   * Ejecución y validación al someter
   */
  const submitForm = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      // RN-02: Validar campos forzosos
      reservationRules.validateReservationData(form);
      
      // Opcional RN: Tiempo Pasado
      reservationRules.validateTimeSlot(form.date, form.time, getLocalToday());

      // RN-01: Validar Mesa y Capacidad
      reservationRules.checkTableAvailability(reservations, tables, form, initialData?.id);

      // Si editar: RN-04, RN-05
      if (initialData) {
         reservationRules.canModifyReservation(initialData);
      }

    } catch (err) {
      if (err.validationErrors) {
         setErrors(err.validationErrors);
      } else {
         toast.error(err.message);
         // set error into tableId globally to show in UI
         if (err.message.includes("Ocupada") || err.message.includes("capacidad")) setErrors(prev => ({...prev, tableId: err.message}));
      }
      return; 
    }

    setIsSubmitting(true);

    try {
      let finalClientId = form.clientId;

      // RN-03: Crear cliente en BD automáticamente si no existe y pasa la validación
      if (!finalClientId) {
          if (!form.clientDni) throw new Error('Debe proveer DNI para clientes nuevos');
          const newClient = addClient({
              dni: form.clientDni,
              name: form.clientName,
              phone: form.clientPhone,
              email: form.clientEmail,
          });
          finalClientId = newClient.id;
      }

      // 4. Propagar hacia el servicio padre (ContextProvider)
      await onSubmit({ ...form, clientId: finalClientId });
      
    } catch (err) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    errors,
    handleChange,
    submitForm,
    isSubmitting,
    isSearchingDni,
    clientFound
  };
}
