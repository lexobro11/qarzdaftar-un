"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Phone,
  Edit,
  Check,
  X,
  Trash2,
  FileText,
  Receipt,
  User,
  Calendar,
  DollarSign,
  Crown,
  Users,
} from "lucide-react"
import type { DebtRecord } from "@/types/debt"

interface DebtListProps {
  debts: DebtRecord[]
  onEdit: (debt: DebtRecord) => void
  onDelete: (id: string) => void
  onTogglePaid: (id: string) => void
  /** optional – if not provided the “Chek” button is hidden */
  onPrintReceipt?: (debt: DebtRecord) => void
}

export default function DebtList({ debts, onEdit, onDelete, onTogglePaid, onPrintReceipt }: DebtListProps) {
  const [showAllDebtors, setShowAllDebtors] = useState(false)

  // Telefon raqamini chiroyli ko'rsatish
  const formatDisplayPhone = (phone: string) => {
    if (phone.startsWith("+998")) {
      const cleaned = phone.replace("+998", "")
      if (cleaned.length === 9) {
        return `+998 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`
      }
    }
    return phone
  }

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      alert(`Telefon raqami nusxalandi: ${phone}`)
    } catch (err) {
      console.error("Failed to copy phone number:", err)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Haqiqatan o'chirmoqchimisiz?")) {
      onDelete(id)
    }
  }

  // Qarzdorlarni qarz miqdori bo'yicha tartiblash (eng ko'p qarzdor birinchi)
  const sortedDebts = [...debts].sort((a, b) => b.qarz - a.qarz)

  // Top 5 va qolganlarni ajratish
  const top5Debts = sortedDebts.slice(0, 5)
  const remainingDebts = sortedDebts.slice(5)

  const displayedDebts = showAllDebtors ? sortedDebts : top5Debts

  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />📃 Qarzdorlar ro'yxati
          <span className="ml-auto bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">{debts.length} ta mijoz</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {debts.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Hozircha qarzdorlar yo'q</p>
            <p className="text-gray-400 text-sm mt-2">Yangi qarz qo'shish uchun yuqoridagi formadan foydalaning</p>
          </div>
        ) : (
          <>
            <div className="space-y-4" id="debt-list">
              {displayedDebts.map((debt, index) => (
                <div
                  key={debt.id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {index < 3 && !showAllDebtors && (
                          <div className="flex items-center gap-1">
                            <Crown
                              className={`w-5 h-5 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-amber-600"}`}
                            />
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-full ${
                                index === 0
                                  ? "bg-yellow-100 text-yellow-800"
                                  : index === 1
                                    ? "bg-gray-100 text-gray-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              #{index + 1}
                            </span>
                          </div>
                        )}
                        <User className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-800">{debt.ism}</h3>
                        {debt.tolandi && (
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                            ✅ To'langan
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          <span className="font-medium text-gray-600">Qarz:</span>
                          <span className={`font-bold text-lg ${debt.tolandi ? "text-green-600" : "text-red-600"}`}>
                            {debt.qarz.toLocaleString()} so'm
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-600">Sana:</span>
                          <span className="text-gray-700">{debt.sana}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                      <Phone className="w-4 h-4 text-purple-500" />
                      <span className="font-mono font-medium">{formatDisplayPhone(debt.tel)}</span>
                      <Button size="sm" variant="ghost" onClick={() => copyPhone(debt.tel)} className="h-8 w-8 p-0">
                        <Phone className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(debt)}
                      className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-xs"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Tahrirlash
                    </Button>
                    {onPrintReceipt && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintReceipt(debt)}
                        className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-xs"
                      >
                        <Receipt className="w-3 h-3 mr-1" />🧾 Chek
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTogglePaid(debt.id)}
                      className={
                        debt.tolandi
                          ? "bg-red-50 hover:bg-red-100 border-red-200 text-xs"
                          : "bg-green-50 hover:bg-green-100 border-green-200 text-xs"
                      }
                    >
                      {debt.tolandi ? (
                        <>
                          <X className="w-3 h-3 mr-1" />❎ Bekor qilish
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />✅ To'landi
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(debt.id)}
                      className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600 text-xs"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />❌
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Top 5 dan keyingi qarzdorlar uchun tugma */}
            {remainingDebts.length > 0 && (
              <div className="mt-6 text-center">
                <Button
                  onClick={() => setShowAllDebtors(!showAllDebtors)}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100"
                >
                  <Users className="w-4 h-4 mr-2" />
                  {showAllDebtors ? (
                    <>Faqat top 5 ni ko'rsatish</>
                  ) : (
                    <>Barcha qarzdorlarni ko'rish ({remainingDebts.length} ta qolgan)</>
                  )}
                </Button>
              </div>
            )}

            {/* Statistika */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{debts.length}</div>
                <div className="text-sm text-gray-600">Jami mijozlar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{debts.filter((d) => d.tolandi).length}</div>
                <div className="text-sm text-gray-600">To'langan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{debts.filter((d) => !d.tolandi).length}</div>
                <div className="text-sm text-gray-600">To'lanmagan</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
