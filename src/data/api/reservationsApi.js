const BASE_URL = 'http://localhost:3001'

export async function fetchRequested() {
  try {
    const res = await fetch(`${BASE_URL}/reservations?status=requested`)
    if (!res.ok) throw new Error(`fetchRequested error: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error('reservationsApi.fetchRequested falló:', e)
    return []
  }
}

export async function patchReservation(id, payload) {
  try {
    const res = await fetch(`${BASE_URL}/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`patchReservation error: ${res.status}`)
    return await res.json()
  } catch (e) {
    console.error(`reservationsApi.patchReservation(${id}) falló:`, e)
    return null
  }
}
