/**
 * src/features/clients/ClientsPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Página de gestión de clientes del restaurante.
 * Permite:
 *   - Listar y buscar todos los clientes registrados
 *   - Ver perfil con historial de visitas y preferencias
 *   - Registrar nuevo cliente manualmente
 *   - Editar datos de cliente existente
 *   - Marcar/desmarcar como VIP
 *
 * Clientes se recuerdan automáticamente en futuras reservas al buscar por teléfono.
 * Acceso: Administrador, Cajero, Hostess
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { Plus, Search, Users, Star, Phone, Mail, Edit2, Crown, Trash2 } from 'lucide-react'
import { useClients } from  '@/domain/context/ClientContext'
import { useAuth } from  '@/domain/context/AuthContext'
import { Button } from  '@/presentation/components/ui/Button'
import { Card } from  '@/presentation/components/ui/Card'
import { Modal } from  '@/presentation/components/ui/Modal'
import { Input, Textarea } from  '@/presentation/components/ui/Input'
import toast from 'react-hot-toast'
import styles from './ClientsPage.module.css'

// Formulario vacío
const EMPTY = {
  name: '', phone: '', email: '', dni: '',
  birthday: '', preferences: '', allergies: '', notes: '',
}

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, deleteAllClients, searchClients } = useClients()
  const { hasPermission } = useAuth()
  const canDelete = hasPermission('canDeleteAnyReservation')

  const [query,      setQuery]   = useState('')
  const [isOpen,     setOpen]    = useState(false)
  const [editClient, setEdit]    = useState(null)
  const [form,       setForm]    = useState(EMPTY)
  const [errors,     setErrors]  = useState({})
  const [vipOnly,    setVipOnly] = useState(false)
  const [isSearchingDni, setSearchingDni] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const displayed = (query.length >= 2 ? searchClients(query) : clients)
    .filter(c => !vipOnly || c.vip)
    .sort((a, b) => (b.totalVisits || 0) - (a.totalVisits || 0))

  const openCreate = () => {
    setEdit(null)
    setForm(EMPTY)
    setErrors({})
    setOpen(true)
  }

  const openEdit = (client) => {
    setEdit(client)
    setForm({
      name: client.name, phone: client.phone, email: client.email || '',
      dni: client.dni || '', birthday: client.birthday || '',
      preferences: client.preferences || '', allergies: client.allergies || '',
      notes: client.notes || '',
    })
    setErrors({})
    setOpen(true)
  }

  const buscarDNI = async (dniStr) => {
    if (dniStr.length !== 8) return;
    setSearchingDni(true)
    try {
      const res = await fetch(`https://api.apis.net.pe/v2/reniec/dni?numero=${dniStr}`, {
        headers: {
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1hdHRoZXd0YW5kYXlwYW4wMDdAZ21haWwuY29tIn0.N_GBdyXAljx7Qrl9h-8wX96smNwGu0Hcah-t4jKloH0',
          'Accept': 'application/json'
        }
      })
      if (!res.ok) throw new Error('DNI no encontrado o error de API')
      const data = await res.json()
      if (data && data.nombres) {
        const fullName = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno}`
        setForm(f => ({ ...f, name: fullName }))
        toast.success('Datos obtenidos de RENIEC')
        if (errors.name) setErrors(e => ({ ...e, name: '' }))
      }
    } catch (err) {
      toast.error('No se pudo consultar el DNI')
    } finally {
      setSearchingDni(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(e => ({ ...e, [name]: '' }))
    
    if (name === 'dni' && value.trim().length === 8) {
      buscarDNI(value.trim())
    }
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Nombre requerido'
    if (!form.phone.trim()) e.phone = 'Teléfono requerido'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      if (editClient) {
        updateClient(editClient.id, form)
        toast.success('Cliente actualizado correctamente')
      } else {
        addClient(form)
        toast.success('Cliente registrado exitosamente')
      }
      setOpen(false)
    } catch (err) {
      toast.error(err.message || 'Ocurrió un error al guardar')
      setErrors(e => ({ ...e, dni: err.message }))
    }
  }

  const toggleVip = (client) => {
    updateClient(client.id, { vip: !client.vip })
    toast.success(client.vip ? 'Cliente removido de VIP' : '⭐ Cliente marcado como VIP')
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>{clients.length} clientes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {canDelete && clients.length > 0 && (
            confirmDeleteAll ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#fff0f0', border: '1px solid var(--color-error)', borderRadius: 10, padding: '6px 12px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-error)' }}>¿Eliminar todos ({clients.length} clientes)?</span>
                <Button variant="danger" size="sm" onClick={() => { deleteAllClients(); setConfirmDeleteAll(false); toast.success('Todos los clientes eliminados') }}>Sí, borrar todo</Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteAll(false)}>No</Button>
              </div>
            ) : (
              <Button variant="ghost" icon={<Trash2 size={15} />}
                onClick={() => setConfirmDeleteAll(true)}
                style={{ color: 'var(--color-error)' }}>
                Borrar todos
              </Button>
            )
          )}
          {hasPermission('canManageClients') && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={openCreate} id="btn-nuevo-cliente">
              Nuevo Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card noPadding>
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="search"
              placeholder="Buscar por nombre, teléfono, email o DNI..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={styles.searchInput}
              id="buscar-cliente"
            />
          </div>
          <button
            className={`${styles.vipBtn} ${vipOnly ? styles.vipActive : ''}`}
            onClick={() => setVipOnly(v => !v)}
          >
            <Crown size={14} />
            Solo VIP
          </button>
        </div>
      </Card>

      {/* Grid de clientes */}
      {displayed.length === 0 ? (
        <div className={styles.empty}>
          <Users size={48} />
          <h3>No hay clientes</h3>
          <p>No se encontraron clientes con esa búsqueda.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayed.map(client => (
            <div key={client.id} className={`${styles.clientCard} ${client.vip ? styles.vipCard : ''}`}>
              {/* Avatar */}
              <div className={styles.cardTop}>
                <div className={styles.avatar}>
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className={styles.clientMeta}>
                  <h3 className={styles.clientName}>
                    {client.name}
                    {client.vip && <Crown size={14} className={styles.vipIcon} />}
                  </h3>
                  <span className={styles.visits}>
                    {client.totalVisits || 0} visita{client.totalVisits !== 1 ? 's' : ''}
                  </span>
                </div>
                {hasPermission('canManageClients') && (
                  <button
                    className={`${styles.starBtn} ${client.vip ? styles.starActive : ''}`}
                    onClick={() => toggleVip(client)}
                    title={client.vip ? 'Quitar VIP' : 'Marcar VIP'}
                  >
                    <Star size={16} />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className={styles.clientInfo}>
                {client.phone && (
                  <div className={styles.infoRow}>
                    <Phone size={13} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className={styles.infoRow}>
                    <Mail size={13} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.preferences && (
                  <p className={styles.pref}>{client.preferences}</p>
                )}
                {client.allergies && client.allergies !== 'Ninguna' && (
                  <p className={styles.allergy}>⚠️ Alergia: {client.allergies}</p>
                )}
              </div>

              {/* Footer */}
              <div className={styles.cardFooter}>
                <span className={styles.lastVisit}>
                  Última visita: {client.lastVisit || 'Sin visitas'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {hasPermission('canManageClients') && (
                    <button className={styles.editBtn} onClick={() => openEdit(client)} title="Editar cliente">
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    confirmDeleteId === client.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button style={{ background: 'var(--color-error)', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          onClick={() => { deleteClient(client.id); setConfirmDeleteId(null); toast.success('Cliente eliminado') }}>Sí</button>
                        <button style={{ background: 'transparent', border: '1px solid #ccc', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontSize: 12 }}
                          onClick={() => setConfirmDeleteId(null)}>No</button>
                      </div>
                    ) : (
                      <button className={styles.editBtn} onClick={() => setConfirmDeleteId(client.id)} title="Eliminar cliente"
                        style={{ color: 'var(--color-error)' }}>
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal formulario */}
      <Modal isOpen={isOpen} onClose={() => setOpen(false)} title={editClient ? 'Editar Cliente' : 'Nuevo Cliente'} size="md">
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.row2}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Input label="DNI" name="dni" id="cli-dni" placeholder="12345678" maxLength={8}
                value={form.dni} onChange={handleChange} error={errors.dni} />
              {isSearchingDni && (
                <span className={styles.dniLoading}>Buscando...</span>
              )}
            </div>
            <Input label="Nombre completo" name="name" id="cli-name" placeholder="Nombre completo"
              value={form.name} onChange={handleChange} error={errors.name} required />
          </div>
          <div className={styles.row2}>
            <Input label="Teléfono" name="phone" id="cli-phone" type="tel" placeholder="987654321"
              value={form.phone} onChange={handleChange} error={errors.phone} required />
            <Input label="Correo electrónico" name="email" id="cli-email" type="email"
              placeholder="cliente@email.com" value={form.email} onChange={handleChange} />
          </div>
          <div className={styles.row2}>
            <Input label="Fecha de cumpleaños" name="birthday" id="cli-birthday" type="date"
              value={form.birthday} onChange={handleChange} />
            <Input label="Alergias" name="allergies" id="cli-allergies" placeholder="Ej: Mariscos, Gluten"
              value={form.allergies} onChange={handleChange} />
          </div>
          <Input label="Preferencias" name="preferences" id="cli-pref"
            placeholder="Mesa favorita, preferencias de servicio..."
            value={form.preferences} onChange={handleChange} />
          <Textarea label="Notas adicionales" name="notes" id="cli-notes"
            placeholder="Información extra sobre el cliente..."
            value={form.notes} onChange={handleChange} />
          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary">
              {editClient ? 'Guardar cambios' : 'Registrar cliente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
