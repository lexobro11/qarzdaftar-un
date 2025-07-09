"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/login-form"
import SearchSection from "@/components/search-section"
import DebtForm from "@/components/debt-form"
import DebtList from "@/components/debt-list"
import type { DebtRecord } from "@/types/debt"
import ReceiptPrinter from "@/components/receipt-printer"
import { useGoogleDrive } from "@/hooks/use-google-drive"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { BarChart3, Cloud, CloudOff, Upload, Download, LogOut, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { downloadReceiptAsJPG } from "@/utils/receipt-generator"

export default function Home() {
  const { isAuthenticated, username, logout, shouldChangePassword } = useAuth()
  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null)
  const [showReceiptPrinter, setShowReceiptPrinter] = useState<DebtRecord | null>(null)
  const [showPasswordWarning, setShowPasswordWarning] = useState(false)

  const {
    isLoading: isGoogleLoading,
    isAuthenticated: isGoogleAuthenticated,
    initializeGoogleDrive,
    signIn,
    signOut,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    saveToLocalBackup,
  } = useGoogleDrive()

  // LocalStorage dan ma'lumotlarni yuklash
  useEffect(() => {
    const savedDebts = localStorage.getItem("qarzdorlar")
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts))
    }

    // Google Drive ni ishga tushirish
    initializeGoogleDrive()

    // Parol almashtirish kerakligini tekshirish
    if (isAuthenticated && shouldChangePassword()) {
      setShowPasswordWarning(true)
    }
  }, [isAuthenticated])

  // Ma'lumotlarni localStorage ga saqlash va backup
  useEffect(() => {
    localStorage.setItem("qarzdorlar", JSON.stringify(debts))
    // Avtomatik local backup
    if (debts.length > 0) {
      saveToLocalBackup(debts)
    }
  }, [debts])

  // Avtomatik Google Drive backup har 10 daqiqada
  useEffect(() => {
    if (isGoogleAuthenticated && debts.length > 0) {
      const interval = setInterval(
        async () => {
          try {
            await backupToGoogleDrive(debts)
            console.log("Avtomatik backup muvaffaqiyatli")
          } catch (error) {
            console.error("Avtomatik backup xatosi:", error)
          }
        },
        10 * 60 * 1000,
      ) // 10 daqiqa

      return () => clearInterval(interval)
    }
  }, [isGoogleAuthenticated, debts])

  const askForReceipt = async (debt: DebtRecord) => {
    const shouldPrint = confirm(`${debt.ism} uchun chek chiqarishni xohlaysizmi?`)

    if (shouldPrint) {
      setShowReceiptPrinter(debt)
    } else {
      // Avtomatik JPG formatda saqlash
      try {
        await downloadReceiptAsJPG({
          mijoz: debt.ism,
          telefon: debt.tel,
          qarz: debt.qarz,
          sana: debt.sana,
          tolandi: debt.tolandi,
        })
        alert("Chek kompyuterga JPG formatda saqlandi!")
      } catch (error) {
        console.error("Chek saqlashda xatolik:", error)
        alert("Chek saqlashda xatolik yuz berdi")
      }
    }
  }

  const handleSubmitDebt = async (debtData: Omit<DebtRecord, "id">) => {
    let newDebt: DebtRecord

    if (editingDebt) {
      // Tahrirlash
      setDebts((prev) => prev.map((debt) => (debt.id === editingDebt.id ? { ...debtData, id: editingDebt.id } : debt)))
      setEditingDebt(null)
      return
    } else {
      // Yangi qarz qo'shish yoki mavjudiga qo'shish
      const existingDebt = debts.find((debt) => debt.ism.toLowerCase() === debtData.ism.toLowerCase())

      if (existingDebt) {
        setDebts((prev) =>
          prev.map((debt) =>
            debt.id === existingDebt.id ? { ...debt, qarz: debt.qarz + debtData.qarz, tel: debtData.tel } : debt,
          ),
        )
        newDebt = { ...existingDebt, qarz: existingDebt.qarz + debtData.qarz }
      } else {
        newDebt = {
          ...debtData,
          id: Date.now().toString(),
        }
        setDebts((prev) => [...prev, newDebt])
      }

      // Chek so'rash
      setTimeout(() => askForReceipt(newDebt), 500)
    }
  }

  const handleEditDebt = (debt: DebtRecord) => {
    setEditingDebt(debt)
  }

  const handleDeleteDebt = (id: string) => {
    if (confirm("Haqiqatan o'chirmoqchimisiz? Bu amal bekor qilinmaydi!")) {
      setDebts((prev) => prev.filter((debt) => debt.id !== id))
    }
  }

  const handleTogglePaid = (id: string) => {
    setDebts((prev) => prev.map((debt) => (debt.id === id ? { ...debt, tolandi: !debt.tolandi } : debt)))
  }

  const handleCancelEdit = () => {
    setEditingDebt(null)
  }

  const handleExportPDF = () => {
    alert("PDF export funksiyasi tez orada qo'shiladi")
  }

  const handleBackup = async () => {
    try {
      if (!isGoogleAuthenticated) {
        const success = await signIn()
        if (!success) return
      }
      await backupToGoogleDrive(debts)
      alert("✅ Ma'lumotlar Google Drive ga saqlandi!")
    } catch (error) {
      alert("❌ Saqlashda xatolik: " + (error as Error).message)
    }
  }

  const handleRestore = async () => {
    try {
      if (!isGoogleAuthenticated) {
        const success = await signIn()
        if (!success) return
      }
      const restoredDebts = await restoreFromGoogleDrive()
      setDebts(restoredDebts)
      alert("✅ Ma'lumotlar Google Drive dan tiklandi!")
    } catch (error) {
      alert("❌ Tiklashda xatolik: " + (error as Error).message)
    }
  }

  const handlePrintReceipt = (debt: DebtRecord) => {
    setShowReceiptPrinter(debt)
  }

  const handleLogout = () => {
    if (confirm("Tizimdan chiqishni xohlaysizmi?")) {
      logout()
    }
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Parol almashtirish ogohlantirishi */}
        {showPasswordWarning && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Parolni almashtirish vaqti keldi!</p>
                  <p className="text-sm">Xavfsizlik uchun har oy parol almashtiriladi.</p>
                  <Button
                    size="sm"
                    className="mt-2 bg-orange-500 hover:bg-orange-600"
                    onClick={() => setShowPasswordWarning(false)}
                  >
                    Tushundim
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🧾 Do'kon qarz daftari</h1>
            <p className="text-gray-600 text-sm mt-1">Salom, {username}!</p>
          </div>
          <div className="flex gap-2">
            <Link href="/statistics">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />📊 Statistika
              </Button>
            </Link>

            <Button
              onClick={isGoogleAuthenticated ? handleBackup : signIn}
              disabled={isGoogleLoading}
              variant="outline"
            >
              {isGoogleLoading ? (
                "Yuklanmoqda..."
              ) : isGoogleAuthenticated ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Saqlash
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  Google Drive
                </>
              )}
            </Button>

            {isGoogleAuthenticated && (
              <>
                <Button onClick={handleRestore} disabled={isGoogleLoading} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Tiklash
                </Button>
                <Button onClick={signOut} variant="outline">
                  <CloudOff className="w-4 h-4 mr-2" />
                  Chiqish
                </Button>
              </>
            )}

            <Button onClick={handleLogout} variant="outline" className="text-red-600 hover:text-red-700 bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              Chiqish
            </Button>
          </div>
        </div>

        <SearchSection
          debts={debts}
          onEdit={handleEditDebt}
          onDelete={handleDeleteDebt}
          onTogglePaid={handleTogglePaid}
        />

        <DebtForm
          onSubmit={handleSubmitDebt}
          onExportPDF={handleExportPDF}
          editingDebt={editingDebt}
          onCancelEdit={handleCancelEdit}
        />

        <DebtList
          debts={debts}
          onEdit={handleEditDebt}
          onDelete={handleDeleteDebt}
          onTogglePaid={handleTogglePaid}
          onPrintReceipt={handlePrintReceipt}
        />

        {showReceiptPrinter && <ReceiptPrinter debt={showReceiptPrinter} onClose={() => setShowReceiptPrinter(null)} />}
      </div>
    </div>
  )
}
