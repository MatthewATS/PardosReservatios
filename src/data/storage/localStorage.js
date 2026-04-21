export function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`localStorage.writeJSON(${key}) falló:`, e)
  }
}

export function remove(key) {
  localStorage.removeItem(key)
}
