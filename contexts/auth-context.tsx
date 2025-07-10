"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  checkPassword: (password: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // To'g'ri login ma'lumotlari
  const VALID_USERNAME = "axmet1994"
  const VALID_PASSWORD = "1994"

  useEffect(() => {
    // Sahifa yuklanganda auth holatini tekshirish
    const authState = localStorage.getItem("auth_state")
    if (authState === "true") {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("auth_state", "true")
      localStorage.setItem("username", username)
      return true
    }
    return false
  }

  const checkPassword = (password: string): boolean => {
    return password === VALID_PASSWORD
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("auth_state")
    localStorage.removeItem("username")
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, checkPassword }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
