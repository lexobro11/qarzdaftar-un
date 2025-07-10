"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Phone, Edit, Check, X, Trash2, User, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DebtRecord } from "@/types/debt"

interface SearchSectionProps {
  debts?: DebtRecord[]
  onEdit: (debt: DebtRecord) => void
  onDelete: (id: string) => void
  onTogglePaid: (id: string) => void
}

export default function SearchSection({ debts = [], onEdit, onDelete, onTogglePaid }: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState("")

  /* -------------------------------------------------------------------------- */
  /*                         Derived data (no extra state)                      */
  /* -------------------------------------------------------------------------- */
  const filteredDebts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    if (!term) return []

    return debts.filter((debt) => {
      const nameMatch = debt.ism.toLowerCase().startsWith(term)

      const phoneDigits = term.replace(/\D/g, "")
      const debtPhoneDigits = debt.tel.replace(/\D/g, "")
      const phoneMatch = phoneDigits && debtPhoneDigits.startsWith(phoneDigits)

      return nameMatch || phoneMatch
    })
  }, [searchTerm, debts])

  const showResults = searchTerm.trim().length > 0
  /* -------------------------------------------------------------------------- */

  const copyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone)
      alert(`📋 Telefon raqami nusxalandi: ${phone}`)
    } catch (err) {
      console.error("Failed to copy phone number:", err)
    }
  }

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

  // Qidiruv natijasida matnni ajratib ko'rsatish (faqat boshidan)
  const highlightText = (text: string) => {
    const term = searchTerm.trim()
    if (!term || !text.toLowerCase().startsWith(term.toLowerCase())) return text

    const matchLength = term.length
    return (
      <>
        <span className="bg-yellow-200 font-bold">{text.slice(0, matchLength)}</span>
        {text.slice(matchLength)}
      </>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />🔍 Mijoz qidiruv
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Mijoz ismi yoki telefon raqami..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-green-200 focus:border-green-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result header */}
        {showResults && (
          <div className="bg-white p-4 rounded-lg border-l-4 border-green-500 shadow-sm">
            <div className="text-green-700 font-medium mb-2">
              {filteredDebts.length > 0
                ? `${filteredDebts.length} ta natija topildi:`
                : `"${searchTerm}" bilan boshlanadigan mijoz topilmadi`}
            </div>
          </div>
        )}

        {/* Result list */}
        {showResults && filteredDebts.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredDebts.map((debt) => (
              <div
                key={debt.id}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-bold text-gray-800">{highlightText(debt.ism)}</h3>
                      {debt.tolandi && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                          ✅ To'langan
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="font-medium">Qarz:</span>
                        <span className={`font-bold ${debt.tolandi ? "text-green-600" : "text-red-600"}`}>
                          {debt.qarz.toLocaleString()} so'm
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">Sana:</span>
                        <span>{debt.sana}</span>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                        <Phone className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">Telefon:</span>
                        <span className="font-mono">{formatDisplayPhone(debt.tel)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap pt-3 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyPhone(debt.tel)}
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    <Phone className="w-3 h-3 mr-1" />📋 Nusxalash
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(debt)}
                    className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    ✏️ Tahrirlash
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTogglePaid(debt.id)}
                    className={
                      debt.tolandi
                        ? "bg-red-50 hover:bg-red-100 border-red-200"
                        : "bg-green-50 hover:bg-green-100 border-green-200"
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
                    onClick={() => onDelete(debt.id)}
                    className="bg-red-50 hover:bg-red-100 border-red-200 text-red-600"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    🗑️ O'chirish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Prompt when no results */}
        {!showResults && debts.length > 0 && (
          <div className="text-center text-gray-500 py-4">
            <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Mijoz qidirish uchun ism yoki telefon raqamini yozing</p>
            <p className="text-xs mt-1">Faqat boshidan boshlanadigan natijalar ko'rsatiladi</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
