"use client"

import { useState, useEffect } from "react"
import type { DebtRecord } from "@/types/debt"

declare global {
  interface Window {
    gapi: any
  }
}

export function useGoogleDrive() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasValidCreds = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    // require a real  client-id (>10 chars and not the placeholder)
    return !!(clientId && clientId !== "your_google_client_id_here" && clientId.length > 10)
  }

  // LocalStorage backup tizimi
  const saveToLocalBackup = (debts: DebtRecord[]) => {
    try {
      const backup = {
        data: debts,
        timestamp: new Date().toISOString(),
        version: "1.0",
        source: "local_backup",
      }
      localStorage.setItem("debt_backup", JSON.stringify(backup))
      localStorage.setItem(
        "debt_backup_count",
        (Number.parseInt(localStorage.getItem("debt_backup_count") || "0") + 1).toString(),
      )
      console.log("✅ Local backup saved successfully")
    } catch (error) {
      console.error("❌ Local backup failed:", error)
    }
  }

  const loadFromLocalBackup = (): DebtRecord[] => {
    try {
      const backup = localStorage.getItem("debt_backup")
      if (backup) {
        const parsed = JSON.parse(backup)
        console.log("✅ Local backup loaded successfully")
        return parsed.data || []
      }
    } catch (error) {
      console.error("❌ Local backup load failed:", error)
    }
    return []
  }

  // Avtomatik backup har 3 daqiqada
  useEffect(() => {
    const interval = setInterval(
      () => {
        const debts = JSON.parse(localStorage.getItem("qarzdorlar") || "[]")
        if (debts.length > 0) {
          saveToLocalBackup(debts)
        }
      },
      3 * 60 * 1000,
    ) // 3 daqiqa

    return () => clearInterval(interval)
  }, [])

  const loadGoogleAPI = async (): Promise<boolean> => {
    try {
      if (window.gapi) {
        return true
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://apis.google.com/js/api.js"
        script.async = true
        script.defer = true
        script.onload = () => {
          console.log("✅ Google API script loaded")
          resolve(true)
        }
        script.onerror = () => {
          console.error("❌ Failed to load Google API script")
          reject(new Error("Failed to load Google API"))
        }
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error("❌ Error loading Google API:", error)
      return false
    }
  }

  const initializeGoogleDrive = async (): Promise<boolean> => {
    if (isInitialized) return true

    if (!hasValidCreds()) {
      console.warn("⚠️ Google Drive disabled – NEXT_PUBLIC_GOOGLE_CLIENT_ID not configured")
      setIsInitialized(true)
      setIsAuthenticated(false)
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      // Google API ni yuklash
      const apiLoaded = await loadGoogleAPI()
      if (!apiLoaded) {
        throw new Error("Google API yuklanmadi")
      }

      // GAPI client va auth2 ni yuklash
      await new Promise<void>((resolve, reject) => {
        window.gapi.load("client:auth2", {
          callback: resolve,
          onerror: reject,
          timeout: 10000,
          ontimeout: () => reject(new Error("GAPI load timeout")),
        })
      })

      // Client ni initialize qilish
      await window.gapi.client.init({
        clientId: "test-client-id", // Test uchun
        scope: "https://www.googleapis.com/auth/drive.file",
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      })

      const authInstance = window.gapi.auth2.getAuthInstance()
      if (authInstance) {
        setIsAuthenticated(authInstance.isSignedIn.get())
        console.log("✅ Google Drive initialized successfully")
      }

      setIsInitialized(true)
      return true
    } catch (err: any) {
      console.error("❌ Google Drive initialization failed:", err)

      if (err?.error === "idpiframe_initialization_failed") {
        setError("Google Drive bu domendan ishlamaydi. Production domendan foydalaning.")
      } else if (err?.error === "popup_closed_by_user") {
        setError("Popup yopildi. Qayta urinib ko'ring.")
      } else {
        setError("Google Drive ulanishida xatolik. Local backup ishlatiladi.")
      }

      setIsInitialized(true)
      setIsAuthenticated(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (): Promise<boolean> => {
    if (!hasValidCreds()) {
      setError("Google Drive sozlanmagan")
      return false
    }

    try {
      setIsLoading(true)
      setError(null)

      if (!isInitialized) {
        const initialized = await initializeGoogleDrive()
        if (!initialized) {
          return false
        }
      }

      const authInstance = window.gapi.auth2.getAuthInstance()
      if (!authInstance) {
        throw new Error("Auth instance topilmadi")
      }

      // Avval silent sign-in
      try {
        const user = await authInstance.signIn({ prompt: "none" })
        if (user && user.isSignedIn()) {
          setIsAuthenticated(true)
          console.log("✅ Silent sign-in successful")
          return true
        }
      } catch (silentError) {
        console.log("Silent sign-in failed, trying popup...")
      }

      // Popup bilan sign-in
      const user = await authInstance.signIn({
        prompt: "consent",
        ux_mode: "popup",
      })

      if (user && user.isSignedIn()) {
        setIsAuthenticated(true)
        console.log("✅ Popup sign-in successful")
        return true
      }

      return false
    } catch (error: any) {
      console.error("❌ Google sign in failed:", error)

      if (error?.error === "popup_closed_by_user") {
        setError("Popup yopildi")
      } else if (error?.error === "access_denied") {
        setError("Ruxsat berilmadi")
      } else {
        setError("Kirishda xatolik yuz berdi")
      }

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      if (window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance()
        if (authInstance) {
          await authInstance.signOut()
          setIsAuthenticated(false)
          console.log("✅ Signed out successfully")
        }
      }
    } catch (error) {
      console.error("❌ Sign out failed:", error)
    }
  }

  const backupToGoogleDrive = async (debts: DebtRecord[]): Promise<any> => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive sozlanmagan")
    }

    if (!isAuthenticated || !window.gapi) {
      throw new Error("Google Drive ga kirish kerak")
    }

    try {
      setIsLoading(true)
      setError(null)

      // Avval local backup
      saveToLocalBackup(debts)

      const fileContent = JSON.stringify(
        {
          data: debts,
          timestamp: new Date().toISOString(),
          version: "1.0",
          backup_count: localStorage.getItem("debt_backup_count") || "0",
          source: "google_drive_backup",
        },
        null,
        2,
      )

      const fileName = `qarz-daftari-backup-${new Date().toISOString().split("T")[0]}.json`

      // Multipart upload
      const boundary = "-------314159265358979323846"
      const delimiter = "\r\n--" + boundary + "\r\n"
      const close_delim = "\r\n--" + boundary + "--"

      const metadata = {
        name: fileName,
        parents: ["appDataFolder"],
        description: "Qarz daftari backup fayli",
      }

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        fileContent +
        close_delim

      const request = await window.gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart" },
        headers: {
          "Content-Type": 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      })

      console.log("✅ Google Drive backup successful")
      return request.result
    } catch (error: any) {
      console.error("❌ Google Drive backup failed:", error)

      if (error?.status === 401) {
        setError("Avtorizatsiya muddati tugagan. Qayta kiring.")
        setIsAuthenticated(false)
      } else if (error?.status === 403) {
        setError("Google Drive ga ruxsat yo'q")
      } else {
        setError("Backup xatoligi: " + (error?.message || "Noma'lum xatolik"))
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const restoreFromGoogleDrive = async (): Promise<DebtRecord[]> => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive sozlanmagan")
    }

    if (!isAuthenticated || !window.gapi) {
      throw new Error("Google Drive ga kirish kerak")
    }

    try {
      setIsLoading(true)
      setError(null)

      // Fayllarni qidirish
      const response = await window.gapi.client.drive.files.list({
        q: "name contains 'qarz-daftari-backup' and parents in 'appDataFolder'",
        orderBy: "createdTime desc",
        pageSize: 1,
        fields: "files(id,name,createdTime)",
      })

      if (!response.result.files || response.result.files.length === 0) {
        throw new Error("Backup fayl topilmadi")
      }

      const fileId = response.result.files[0].id
      console.log("📁 Found backup file:", response.result.files[0].name)

      // Fayl mazmunini olish
      const fileResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media",
      })

      const backup = JSON.parse(fileResponse.body)
      console.log("✅ Google Drive restore successful")

      return backup.data || backup // Eski formatni ham qo'llab-quvvatlash
    } catch (error: any) {
      console.error("❌ Google Drive restore failed:", error)

      if (error?.status === 401) {
        setError("Avtorizatsiya muddati tugagan. Qayta kiring.")
        setIsAuthenticated(false)
      } else if (error?.status === 404) {
        setError("Backup fayl topilmadi")
      } else {
        setError("Restore xatoligi: " + (error?.message || "Noma'lum xatolik"))
      }

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-initialize on mount
  useEffect(() => {
    if (hasValidCreds() && !isInitialized) {
      initializeGoogleDrive()
    }
  }, [])

  return {
    isLoading,
    isAuthenticated,
    isInitialized,
    error,
    googleEnabled: hasValidCreds(),
    initializeGoogleDrive,
    signIn,
    signOut,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    saveToLocalBackup,
    loadFromLocalBackup,
  }
}
