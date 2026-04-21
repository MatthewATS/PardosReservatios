import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { MOCK_USERS }        from '@/data/seeds/usersSeed'
import { ROLE_PERMISSIONS }  from '@/domain/auth/permissions'
import { readJSON, writeJSON, remove } from '@/data/storage/localStorage'

export { MOCK_USERS }
export { ROLE_PERMISSIONS }

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = readJSON('pardos_user')
    if (savedUser) setUser(savedUser)
    setIsLoading(false)
  }, [])

  const login = useCallback((email, password) => {
    const found = MOCK_USERS.find(
      u => u.email === email.trim().toLowerCase() && u.password === password
    )
    if (!found) {
      return { success: false, message: 'Correo o contraseña incorrectos.' }
    }
    const { password: _pw, ...safeUser } = found
    setUser(safeUser)
    writeJSON('pardos_user', safeUser)
    return { success: true, message: `Bienvenido, ${safeUser.name}` }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    remove('pardos_user')
  }, [])

  const hasPermission = useCallback(
    (permission) => {
      if (!user) return false
      return ROLE_PERMISSIONS[user.role]?.[permission] === true
    },
    [user]
  )

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    permissions: user ? ROLE_PERMISSIONS[user.role] : null,
    login,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
