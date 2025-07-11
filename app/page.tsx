"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TrendingUp,
  Download,
  Upload,
  BarChart3,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  LogOut,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useGoogleDrive } from "@/hooks/use-google-drive"
import LoginForm from "@/components/login-form"
import DebtForm from "@/components/debt-form"
import DebtList from "@/components/debt-list"
import SearchSection from "@/components/search-section"
import ReceiptPrinter from "@/components/receipt-printer"
import type { DebtRecord } from "@/types/debt"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, logout } = useAuth()
  const {
    isLoading: driveLoading,
    isAuthenticated: driveAuthenticated,
    error: driveError,
    googleEnabled,
    signIn: driveSignIn,
    signOut: driveSignOut,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    saveToLocalBackup,
    loadFromLocalBackup,
  } = useGoogleDrive()

  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [filteredDebts, setFilteredDebts] = useState<DebtRecord[]>([])
  const [showAll, setShowAll] = useState(false)
  const [backupStatus, setBackupStatus] = useState<string>("")

  // Add receipt printing state and handlers after the existing state declarations
  const [showReceiptPrinter, setShowReceiptPrinter] = useState(false)
  const [selectedDebtForReceipt, setSelectedDebtForReceipt] = useState<DebtRecord | null>(null)

  // Ma'lumotlarni yuklash
  useEffect(() => {
    const savedDebts = localStorage.getItem("qarzdorlar")
    if (savedDebts) {
      const parsedDebts = JSON.parse(savedDebts)
      setDebts(parsedDebts)
      setFilteredDebts(parsedDebts)
    }
  }, [])

  // Ma'lumotlarni saqlash
  useEffect(() => {
    if (debts.length > 0) {
      localStorage.setItem("qarzdorlar", JSON.stringify(debts))
      saveToLocalBackup(debts)
    }
  }, [debts, saveToLocalBackup])

  const handleAddDebt = (newDebtData: Omit<DebtRecord, "id">) => {
    const newDebt: DebtRecord = {
      ...newDebtData,
      id: Date.now().toString(),
    }
    const updatedDebts = [...debts, newDebt]
    setDebts(updatedDebts)
    setFilteredDebts(updatedDebts)
  }

  const handleUpdateDebt = (updatedDebt: DebtRecord) => {
    const updatedDebts = debts.map((debt) => (debt.id === updatedDebt.id ? updatedDebt : debt))
    setDebts(updatedDebts)
    setFilteredDebts(updatedDebts)
  }

  const handleDeleteDebt = (id: string) => {
    const updatedDebts = debts.filter((debt) => debt.id !== id)
    setDebts(updatedDebts)
    setFilteredDebts(updatedDebts)
  }

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredDebts(debts)
    } else {
      const filtered = debts.filter(
        (debt) => debt.ism.toLowerCase().includes(searchTerm.toLowerCase()) || debt.tel.includes(searchTerm),
      )
      setFilteredDebts(filtered)
    }
  }

  // Add receipt printing handlers after the existing handlers
  const handlePrintReceipt = (debt: DebtRecord) => {
    setSelectedDebtForReceipt(debt)
    setShowReceiptPrinter(true)
  }

  const handleCloseReceiptPrinter = () => {
    setShowReceiptPrinter(false)
    setSelectedDebtForReceipt(null)
  }

  // Google Drive backup
  const handleBackup = async () => {
    if (!googleEnabled) {
      setBackupStatus("❌ Google Drive sozlanmagan")
      return
    }

    if (!driveAuthenticated) {
      const success = await driveSignIn()
      if (!success) {
        setBackupStatus("❌ Google Drive ga kirib bo'lmadi")
        return
      }
    }

    try {
      setBackupStatus("⏳ Backup qilinmoqda...")
      await backupToGoogleDrive(debts)
      setBackupStatus("✅ Backup muvaffaqiyatli saqlandi!")
      setTimeout(() => setBackupStatus(""), 3000)
    } catch (error) {
      setBackupStatus("❌ Backup xatoligi: " + (error as Error).message)
      setTimeout(() => setBackupStatus(""), 5000)
    }
  }

  // Google Drive restore
  const handleRestore = async () => {
    if (!googleEnabled) {
      setBackupStatus("❌ Google Drive sozlanmagan")
      return
    }

    if (!driveAuthenticated) {
      const success = await driveSignIn()
      if (!success) {
        setBackupStatus("❌ Google Drive ga kirib bo'lmadi")
        return
      }
    }

    try {
      setBackupStatus("⏳ Ma'lumotlar tiklanmoqda...")
      const restoredDebts = await restoreFromGoogleDrive()
      setDebts(restoredDebts)
      setFilteredDebts(restoredDebts)
      setBackupStatus("✅ Ma'lumotlar muvaffaqiyatli tiklandi!")
      setTimeout(() => setBackupStatus(""), 3000)
    } catch (error) {
      setBackupStatus("❌ Tiklash xatoligi: " + (error as Error).message)
      setTimeout(() => setBackupStatus(""), 5000)
    }
  }

  // Local backup restore
  const handleLocalRestore = () => {
    try {
      const localDebts = loadFromLocalBackup()
      if (localDebts.length > 0) {
        setDebts(localDebts)
        setFilteredDebts(localDebts)
        setBackupStatus("✅ Local backup dan tiklandi!")
        setTimeout(() => setBackupStatus(""), 3000)
      } else {
        setBackupStatus("❌ Local backup topilmadi")
        setTimeout(() => setBackupStatus(""), 3000)
      }
    } catch (error) {
      setBackupStatus("❌ Local backup xatoligi")
      setTimeout(() => setBackupStatus(""), 3000)
    }
  }

  // Statistikalar
  const totalDebt = debts.reduce((sum, debt) => sum + debt.qarz, 0)
  const paidDebt = debts.filter((debt) => debt.tolandi).reduce((sum, debt) => sum + debt.qarz, 0)
  const unpaidDebt = debts.filter((debt) => !debt.tolandi).reduce((sum, debt) => sum + debt.qarz, 0)
  const totalCustomers = debts.length

  // Bugungi qarzlar
  const today = new Date().toLocaleDateString()
  const todayDebts = debts.filter((debt) => debt.sana === today)
  const todayTotalDebt = todayDebts.reduce((sum, debt) => sum + debt.qarz, 0)

  const sortedDebts = [...filteredDebts].sort((a, b) => b.qarz - a.qarz)
  const displayedDebts = showAll ? sortedDebts : sortedDebts.slice(0, 5)

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Dorixona Qarz Daftari
                </CardTitle>
                <p className="text-gray-600 mt-1">Qarzdorlar va to'lovlarni boshqarish tizimi</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/statistics">
                  <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                    <BarChart3 className="w-4 h-4" />
                    Statistika
                  </Button>
                </Link>

                {/* Google Drive Status */}
                <div className="flex items-center gap-2">
                  {googleEnabled ? (
                    driveAuthenticated ? (
                      <Badge variant="default" className="bg-green-500">
                        <Cloud className="w-3 h-3 mr-1" />
                        Google Drive
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CloudOff className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline">
                      <CloudOff className="w-3 h-3 mr-1" />
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-off w-3 h-3 mr-1"><path d="m2 2 20 20"></path><path d="M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193"></path><path d="M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07"></path></svg>Local
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => {
                    if (confirm("Tizimdan chiqishni xohlaysizmi?")) {
                      logout()
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Statistikalar - kichraytirilgan */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card className="shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Jami qarzdorlar</p>
                  <p className="text-xl font-bold text-blue-600">{totalCustomers}</p>
                </div>
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Jami qarz</p>
                  <p className="text-xl font-bold text-red-600">{totalDebt.toLocaleString()} so'm</p>
                </div>
                <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Bugungi qarzlar</p>
                  <p className="text-xl font-bold text-purple-600">{todayTotalDebt.toLocaleString()} so'm</p>
                </div>
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">To'lanmagan</p>
                  <p className="text-xl font-bold text-orange-600">{unpaidDebt.toLocaleString()} so'm</p>
                </div>
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup Status */}
        {backupStatus && (
          <Alert
            className={
              backupStatus.includes("✅")
                ? "border-green-500 bg-green-50"
                : backupStatus.includes("❌")
                  ? "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{backupStatus}</AlertDescription>
          </Alert>
        )}

        {/* Google Drive Error */}
        {driveError && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">{driveError}</AlertDescription>
          </Alert>
        )}

        {/* Backup tugmalari - kichraytirilgan */}
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Ma'lumotlar zaxirasi</h3>
              {googleEnabled && driveAuthenticated && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  <Cloud className="w-3 h-3 mr-1" />
                  Ulangan
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {googleEnabled && (
                <>
                  {!driveAuthenticated ? (
                    <Button onClick={driveSignIn} disabled={driveLoading} variant="outline" size="sm">
                      {driveLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Cloud className="w-3 h-3 mr-1" />
                      )}
                      Google Drive
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleBackup} disabled={driveLoading} size="sm">
                        {driveLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3 mr-1" />
                        )}
                        Saqlash
                      </Button>
                      <Button onClick={handleRestore} disabled={driveLoading} variant="outline" size="sm">
                        {driveLoading ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-3 h-3 mr-1" />
                        )}
                        Tiklash
                      </Button>
                      <Button onClick={driveSignOut} variant="ghost" size="sm">
                        <CloudOff className="w-3 h-3 mr-1" />
                        Chiqish
                      </Button>
                    </>
                  )}
                </>
              )}

              <Button onClick={handleLocalRestore} variant="secondary" size="sm">
                <CheckCircle className="w-3 h-3 mr-1" />
                Local
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Asosiy kontent */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Qarzdorlar ro'yxati</TabsTrigger>
            <TabsTrigger value="add">Yangi qarz qo'shish</TabsTrigger>
            <TabsTrigger value="receipt">Chek chiqarish</TabsTrigger>
          </TabsList>

          {/* Update the DebtList component call in the TabsContent to include onPrintReceipt */}
          <TabsContent value="list" className="space-y-4">
            <SearchSection
              debts={debts}
              onEdit={handleUpdateDebt}
              onDelete={handleDeleteDebt}
              onTogglePaid={(id) => {
                const updatedDebts = debts.map((debt) => (debt.id === id ? { ...debt, tolandi: !debt.tolandi } : debt))
                setDebts(updatedDebts)
                setFilteredDebts(updatedDebts)
              }}
            />
            <DebtList
              debts={displayedDebts}
              onEdit={handleUpdateDebt}
              onDelete={handleDeleteDebt}
              onTogglePaid={(id) => {
                const updatedDebts = debts.map((debt) => (debt.id === id ? { ...debt, tolandi: !debt.tolandi } : debt))
                setDebts(updatedDebts)
                setFilteredDebts(updatedDebts)
              }}
              onPrintReceipt={handlePrintReceipt}
            />
            {sortedDebts.length > 5 && (
              <div className="text-center">
                <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                  {showAll ? "Kamroq ko'rsatish" : `Yana ${sortedDebts.length - 5} ta ko'rsatish`}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="add">
            <DebtForm onAdd={handleAddDebt} />
          </TabsContent>

          <TabsContent value="receipt">
            <ReceiptPrinter debts={debts} />
          </TabsContent>
        </Tabs>
        {/* Add the ReceiptPrinter component at the end of the return statement, just before the closing </div> */}
        {showReceiptPrinter && <ReceiptPrinter debt={selectedDebtForReceipt} onClose={handleCloseReceiptPrinter} />}
      </div>
    </div>
  )
}
