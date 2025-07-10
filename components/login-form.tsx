"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, AlertCircle, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showUsernameField, setShowUsernameField] = useState(true)

  const { login, checkPassword } = useAuth()

  useEffect(() => {
    // Agar username saqlangan bo'lsa, faqat parol so'ralsin
    const savedUsername = localStorage.getItem("username")
    if (savedUsername) {
      setUsername(savedUsername)
      setShowUsernameField(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (showUsernameField) {
      // Birinchi marta kirish - username va parol
      if (login(username, password)) {
        setError("")
      } else {
        setError("❌ Noto'g'ri login yoki parol!")
      }
    } else {
      // Keyingi kirishlar - faqat parol
      if (checkPassword(password)) {
        localStorage.setItem("auth_state", "true")
        window.location.reload()
      } else {
        setError("❌ Noto'g'ri parol!")
      }
    }
  }

  const handleChangeUser = () => {
    setShowUsernameField(true)
    setUsername("")
    setPassword("")
    setError("")
    localStorage.removeItem("username")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {showUsernameField ? "🔒 Tizimga kirish" : "🔐 Parolni kiriting"}
          </CardTitle>
          <p className="text-gray-600 text-sm mt-2">
            {showUsernameField ? "Do'kon qarz daftari" : `Salom, ${username}!`}
          </p>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {showUsernameField && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Foydalanuvchi nomi</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Foydalanuvchi nomini kiriting"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Parol</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              Kirish
            </Button>

            {!showUsernameField && (
              <Button type="button" variant="outline" onClick={handleChangeUser} className="w-full bg-transparent">
                Boshqa foydalanuvchi
              </Button>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
