"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Cloud, CloudOff, Download, Upload, Calendar, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import DebtCharts from "@/components/charts/debt-charts"
import DetailedCharts from "@/components/charts/detailed-charts"
import { useGoogleDrive } from "@/hooks/use-google-drive"
import { useAuth } from "@/contexts/auth-context"
import type { DebtRecord } from "@/types/debt"

export default function StatisticsPage() {
  const { isAuthenticated } = useAuth()
  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [totalDebt, setTotalDebt] = useState(0)
  const [paidDebt, setPaidDebt] = useState(0)
  const [unpaidDebt, setUnpaidDebt] = useState(0)
  const [todayDebts, setTodayDebts] = useState(0)
  const [thisMonthDebts, setThisMonthDebts] = useState(0)
  const [thisYearDebts, setThisYearDebts] = useState(0)

  const {
    isLoading,
    isAuthenticated: isGoogleAuthenticated,
    initializeGoogleDrive,
    signIn,
    signOut,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
  } = useGoogleDrive()

  useEffect(() => {
    const savedDebts = localStorage.getItem("qarzdorlar")
    if (savedDebts) {
      const parsedDebts = JSON.parse(savedDebts)
      setDebts(parsedDebts)

      // Statistikalarni hisoblash
      let total = 0
      let paid = 0
      let unpaid = 0
      let today = 0
      let thisMonth = 0
      let thisYear = 0

      const todayStr = new Date().toLocaleDateString()
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()

      parsedDebts.forEach((debt: DebtRecord) => {
        total += debt.qarz
        if (debt.tolandi) {
          paid += debt.qarz
        } else {
          unpaid += debt.qarz
        }

        const debtDate = new Date(debt.sana)

        // Bugungi qarzlar
        if (debtDate.toLocaleDateString() === todayStr) {
          today += debt.qarz
        }

        // Bu oylik qarzlar
        if (debtDate.getMonth() === currentMonth && debtDate.getFullYear() === currentYear) {
          thisMonth += debt.qarz
        }

        // Bu yillik qarzlar
        if (debtDate.getFullYear() === currentYear) {
          thisYear += debt.qarz
        }
      })

      setTotalDebt(total)
      setPaidDebt(paid)
      setUnpaidDebt(unpaid)
      setTodayDebts(today)
      setThisMonthDebts(thisMonth)
      setThisYearDebts(thisYear)
    }

    // Google Drive ni ishga tushirish
    initializeGoogleDrive()
  }, [])

  const handleBackup = async () => {
    try {
      if (!isGoogleAuthenticated) {
        await signIn()
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
        await signIn()
      }
      const restoredDebts = await restoreFromGoogleDrive()
      setDebts(restoredDebts)
      localStorage.setItem("qarzdorlar", JSON.stringify(restoredDebts))
      alert("✅ Ma'lumotlar Google Drive dan tiklandi!")
      window.location.reload()
    } catch (error) {
      alert("❌ Tiklashda xatolik: " + (error as Error).message)
    }
  }

  // Agar autentifikatsiya qilinmagan bo'lsa, asosiy sahifaga yo'naltirish
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 mb-4">Statistikani ko'rish uchun tizimga kiring</p>
            <Link href="/">
              <Button>Asosiy sahifaga qaytish</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ⬅️ Orqaga qaytish
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">📊 Qarzlar Statistikasi</h1>
          </div>

          <div className="flex gap-2">
            <Button onClick={isGoogleAuthenticated ? handleBackup : signIn} disabled={isLoading} variant="outline">
              {isLoading ? (
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
                <Button onClick={handleRestore} disabled={isLoading} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Tiklash
                </Button>
                <Button onClick={signOut} variant="outline">
                  <CloudOff className="w-4 h-4 mr-2" />
                  Chiqish
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Umumiy statistikalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />💰 Jami Qarz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalDebt.toLocaleString()} so'm</div>
              <p className="text-blue-100 text-sm mt-1">Jami {debts.length} ta mijoz</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />✅ To'langan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{paidDebt.toLocaleString()} so'm</div>
              <p className="text-green-100 text-sm mt-1">
                {totalDebt > 0 ? Math.round((paidDebt / totalDebt) * 100) : 0}% to'langan
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />❌ To'lanmagan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{unpaidDebt.toLocaleString()} so'm</div>
              <p className="text-red-100 text-sm mt-1">
                {totalDebt > 0 ? Math.round((unpaidDebt / totalDebt) * 100) : 0}% qolgan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Vaqt bo'yicha statistikalar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">📅 Bugungi Qarzlar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayDebts.toLocaleString()} so'm</div>
              <p className="text-purple-100 text-sm mt-1">Bugun qo'shilgan</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">📊 Bu Oylik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthDebts.toLocaleString()} so'm</div>
              <p className="text-indigo-100 text-sm mt-1">Joriy oyda</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardHeader>
              <CardTitle className="text-lg">🎯 Bu Yillik</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisYearDebts.toLocaleString()} so'm</div>
              <p className="text-teal-100 text-sm mt-1">Joriy yilda</p>
            </CardContent>
          </Card>
        </div>

        {/* Batafsil chartlar */}
        <DetailedCharts debts={debts} />

        {/* Asl chartlar */}
        <DebtCharts debts={debts} />
      </div>
    </div>
  )
}
