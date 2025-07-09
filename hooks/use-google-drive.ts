"use client"

import { useState, useEffect } from "react"
import type { DebtRecord } from "@/types/debt"

export function useGoogleDrive() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const hasValidCreds = () =>
    !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== "your_google_client_id_here"

  // LocalStorage backup tizimi
  const saveToLocalBackup = (debts: DebtRecord[]) => {
    try {
      const backup = {
        data: debts,
        timestamp: new Date().toISOString(),
        version: "1.0",
      }
      localStorage.setItem("debt_backup", JSON.stringify(backup))
      localStorage.setItem(
        "debt_backup_count",
        (Number.parseInt(localStorage.getItem("debt_backup_count") || "0") + 1).toString(),
      )
    } catch (error) {
      console.error("Local backup failed:", error)
    }
  }

  const loadFromLocalBackup = (): DebtRecord[] => {
    try {
      const backup = localStorage.getItem("debt_backup")
      if (backup) {
        const parsed = JSON.parse(backup)
        return parsed.data || []
      }
    } catch (error) {
      console.error("Local backup load failed:", error)
    }
    return []
  }

  // Avtomatik backup har 5 daqiqada
  useEffect(() => {
    const interval = setInterval(
      () => {
        const debts = JSON.parse(localStorage.getItem("qarzdorlar") || "[]")
        if (debts.length > 0) {
          saveToLocalBackup(debts)
        }
      },
      5 * 60 * 1000,
    ) // 5 daqiqa

    return () => clearInterval(interval)
  }, [])

  const initializeGoogleDrive = async () => {
    if (isInitialized) return true

    if (!hasValidCreds()) {
      console.warn("Google Drive disabled – set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable.")
      setIsInitialized(true)
      setIsAuthenticated(false)
      return false
    }

    try {
      setIsLoading(true)

      // Google API ni yuklash
      if (!window.gapi) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://apis.google.com/js/api.js"
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      await new Promise((resolve) => window.gapi.load("client:auth2", resolve))

      await window.gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "demo_key",
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "demo_client",
        scope: "https://www.googleapis.com/auth/drive.file",
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      })

      const authInstance = window.gapi.auth2.getAuthInstance()
      setIsAuthenticated(authInstance.isSignedIn.get())
      setIsInitialized(true)

      return true
    } catch (err: any) {
      if (err?.error === "idpiframe_initialization_failed") {
        console.warn("Google Drive disabled for this preview URL; falling back to local backup.")
        setIsInitialized(true)
        setIsAuthenticated(false)
        return false
      }
      console.error("Google Drive initialization failed:", err)
      setIsInitialized(true)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async () => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive is not configured for this deployment.")
    }

    if (!isInitialized) {
      await initializeGoogleDrive()
    }

    try {
      setIsLoading(true)
      const authInstance = window.gapi.auth2.getAuthInstance()

      // Avval silent sign-in
      try {
        await authInstance.signIn({ prompt: "none" })
      } catch {
        // Agar silent ishlamasa, popup
        await authInstance.signIn({ prompt: "consent" })
      }

      setIsAuthenticated(true)
      return true
    } catch (error: any) {
      if (error?.error === "popup_closed_by_user") {
        console.info("User closed popup")
        return false
      }
      console.error("Google sign in failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive is not configured for this deployment.")
    }

    try {
      if (window.gapi?.auth2) {
        const authInstance = window.gapi.auth2.getAuthInstance()
        await authInstance.signOut()
      }
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Google sign out failed:", error)
    }
  }

  const backupToGoogleDrive = async (debts: DebtRecord[]) => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive is not configured for this deployment.")
    }

    if (!isAuthenticated || !window.gapi) {
      throw new Error("Google Drive ga kirish kerak")
    }

    try {
      setIsLoading(true)

      // Avval local backup
      saveToLocalBackup(debts)

      const fileContent = JSON.stringify(
        {
          data: debts,
          timestamp: new Date().toISOString(),
          version: "1.0",
          backup_count: localStorage.getItem("debt_backup_count") || "0",
        },
        null,
        2,
      )

      const fileName = `qarz-daftari-backup-${new Date().toISOString().split("T")[0]}.json`

      const boundary = "-------314159265358979323846"
      const delimiter = "\r\n--" + boundary + "\r\n"
      const close_delim = "\r\n--" + boundary + "--"

      const metadata = {
        name: fileName,
        parents: ["appDataFolder"],
      }

      const multipartRequestBody =
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        JSON.stringify(metadata) +
        delimiter +
        "Content-Type: application/json\r\n\r\n" +
        fileContent +
        close_delim

      const request = window.gapi.client.request({
        path: "https://www.googleapis.com/upload/drive/v3/files",
        method: "POST",
        params: { uploadType: "multipart" },
        headers: {
          "Content-Type": 'multipart/related; boundary="' + boundary + '"',
        },
        body: multipartRequestBody,
      })

      const response = await request
      return response.result
    } catch (error) {
      console.error("Backup to Google Drive failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const restoreFromGoogleDrive = async (): Promise<DebtRecord[]> => {
    if (!hasValidCreds()) {
      throw new Error("Google Drive is not configured for this deployment.")
    }

    if (!isAuthenticated || !window.gapi) {
      throw new Error("Google Drive ga kirish kerak")
    }

    try {
      setIsLoading(true)

      // Fayllarni qidirish
      const response = await window.gapi.client.drive.files.list({
        q: "name contains 'qarz-daftari-backup' and parents in 'appDataFolder'",
        orderBy: "createdTime desc",
        pageSize: 1,
        fields: "files(id,name)",
      })

      if (!response.result.files || response.result.files.length === 0) {
        throw new Error("Backup fayl topilmadi")
      }

      const fileId = response.result.files[0].id

      // Fayl mazmunini olish
      const fileResponse = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: "media",
      })

      const backup = JSON.parse(fileResponse.body)
      return backup.data || backup // Eski formatni ham qo'llab-quvvatlash
    } catch (error) {
      console.error("Restore from Google Drive failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    isAuthenticated,
    isInitialized,
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
