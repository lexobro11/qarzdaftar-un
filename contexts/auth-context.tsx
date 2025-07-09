"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
  checkPassword: (password: string) => boolean
  shouldChangePassword: () => boolean
  changePassword: (oldPassword: string, newPassword: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState<string | null>(null)

  // Yangi login ma'lumotlari
  const VALID_USERNAME = "giyosbek.dev"
  const VALID_PASSWORD = "00005555"

  const getPasswordChangeDate = () => {
    const saved = localStorage.getItem("password_change_date")
    return saved ? new Date(saved) : null
  }

  const shouldChangePassword = () => {
    const lastChange = getPasswordChangeDate()
    if (!lastChange) return false

    const now = new Date()
    const monthsDiff = (now.getFullYear() - lastChange.getFullYear()) * 12 + (now.getMonth() - lastChange.getMonth())

    return monthsDiff >= 1
  }

  useEffect(() => {
    // LocalStorage dan auth holatini yuklash
    const savedAuth = localStorage.getItem("auth_state")
    const savedUsername = localStorage.getItem("username")

    if (savedAuth === "true" && savedUsername) {
      setIsAuthenticated(true)
      setUsername(savedUsername)
    }
  }, [])

  const login = (inputUsername: string, inputPassword: string): boolean => {
    if (inputUsername === VALID_USERNAME && inputPassword === VALID_PASSWORD) {
      setIsAuthenticated(true)
      setUsername(inputUsername)
      localStorage.setItem("auth_state", "true")
      localStorage.setItem("username", inputUsername)
      localStorage.setItem("password_change_date", new Date().toISOString())
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUsername(null)
    localStorage.removeItem("auth_state")
    localStorage.removeItem("username")
  }

  const checkPassword = (password: string): boolean => {
    return password === VALID_PASSWORD
  }

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (oldPassword === VALID_PASSWORD) {
      // Yangi parolni saqlash (keyingi oy uchun)
      localStorage.setItem("custom_password", newPassword)
      localStorage.setItem("password_change_date", new Date().toISOString())
      return true
    }
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        username,
        login,
        logout,
        checkPassword,
        shouldChangePassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
