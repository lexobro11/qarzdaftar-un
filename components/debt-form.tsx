"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, FileDown, Phone, DollarSign, User } from "lucide-react"
import type { DebtRecord } from "@/types/debt"

interface DebtFormProps {
  /** called when the form is successfully submitted (preferred) */
  onAdd?: (debt: Omit<DebtRecord, "id">) => void
  /** legacy name – still supported for safety */
  onSubmit?: (debt: Omit<DebtRecord, "id">) => void
  onExportPDF?: () => void
  editingDebt?: DebtRecord | null
  onCancelEdit?: () => void
}

export default function DebtForm({ onAdd, onSubmit, onExportPDF, editingDebt, onCancelEdit }: DebtFormProps) {
  const [ism, setIsm] = useState("")
  const [tel, setTel] = useState("")
  const [qarz, setQarz] = useState("")

  useEffect(() => {
    if (editingDebt) {
      setIsm(editingDebt.ism)
      // Telefon raqamini formatlash
      const cleanPhone = editingDebt.tel.replace(/\D/g, "")
      if (cleanPhone.startsWith("998")) {
        const phoneDigits = cleanPhone.slice(3)
        setTel(formatPhoneInput(phoneDigits))
      } else {
        setTel(formatPhoneInput(cleanPhone))
      }
      setQarz(editingDebt.qarz.toString())
    } else {
      setIsm("")
      setTel("")
      setQarz("")
    }
  }, [editingDebt])

  // Telefon raqamini formatlash (PayNet kabi) - 9 ta raqam uchun
  const formatPhoneInput = (value: string) => {
    // Faqat raqamlarni qoldirish
    const digits = value.replace(/\D/g, "")

    // Maksimal 9 ta raqam
    const limitedDigits = digits.slice(0, 9)

    // Formatlash: XX XXX XX XX
    let formatted = ""
    if (limitedDigits.length > 0) {
      formatted += limitedDigits.slice(0, 2)
    }
    if (limitedDigits.length > 2) {
      formatted += " " + limitedDigits.slice(2, 5)
    }
    if (limitedDigits.length > 5) {
      formatted += " " + limitedDigits.slice(5, 7)
    }
    if (limitedDigits.length > 7) {
      formatted += " " + limitedDigits.slice(7, 9)
    }

    return formatted
  }

  // Ism kiritishda faqat bosh harflar
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Faqat harflar, bo'shliq va apostrof ruxsat etiladi
    const nameRegex = /^[a-zA-ZА-Яа-яЁёўғҳқўзжшчъэюяЎҒҲҚЎЗЖШЧЪЭЮЯ\s']*$/
    if (nameRegex.test(value) || value === "") {
      // Har bir so'zning birinchi harfini katta qilish
      const formatted = value
        .toLowerCase()
        .split(" ")
        .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
        .join(" ")
      setIsm(formatted)
    }
  }

  // Telefon raqami o'zgarishi
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatPhoneInput(value)
    setTel(formatted)
  }

  // Summa uchun faqat raqamlar
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Faqat raqamlar
    const numbersOnly = value.replace(/\D/g, "")
    setQarz(numbersOnly)
  }

  // To'liq telefon raqamini olish
  const getFullPhoneNumber = () => {
    const digits = tel.replace(/\D/g, "")
    return digits.length > 0 ? `+998${digits}` : ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!ism.trim() || !tel.trim() || !qarz.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring!")
      return
    }

    // Telefon raqamini tekshirish
    const phoneDigits = tel.replace(/\D/g, "")
    if (phoneDigits.length !== 9) {
      alert("Telefon raqami 9 ta raqamdan iborat bo'lishi kerak!")
      return
    }

    const qarzAmount = Number.parseInt(qarz)
    if (isNaN(qarzAmount) || qarzAmount <= 0) {
      alert("Qarz miqdori musbat raqam bo'lishi kerak!")
      return
    }

    const newDebt = {
      ism: ism.trim(),
      tel: getFullPhoneNumber(),
      qarz: qarzAmount,
      sana: new Date().toLocaleDateString(),
      tolandi: editingDebt?.tolandi || false,
    }

    // prefer onAdd, fall back to onSubmit
    if (onAdd) onAdd(newDebt)
    else if (onSubmit) onSubmit(newDebt)

    if (!editingDebt) {
      setIsm("")
      setTel("")
      setQarz("")
    }
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          {editingDebt ? (
            <>
              <Edit className="w-5 h-5" />
              ✏️ Ma'lumotni tahrirlash
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />➕ Qarzni kiritish
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Mijoz ismi
            </label>
            <Input
              placeholder="Mijoz ismini yozing..."
              value={ism}
              onChange={handleNameChange}
              className="border-2 border-blue-200 focus:border-blue-400"
            />
            <p className="text-xs text-gray-400">Faqat harflar. Avtomatik bosh harf bilan yoziladi</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Telefon raqami
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-500 font-mono">+998</div>
              <Input
                placeholder="90 123 45 67"
                value={tel}
                onChange={handlePhoneChange}
                className="border-2 border-green-200 focus:border-green-400 pl-16 font-mono"
                maxLength={12} // XX XXX XX XX format uchun (9 raqam + 3 bo'shliq)
              />
            </div>
            <p className="text-xs text-gray-500">9 ta raqam kiriting. Masalan: 90 123 45 67</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Qarz summasi (so'm)
            </label>
            <Input
              placeholder="100000"
              value={qarz}
              onChange={handleAmountChange}
              className="border-2 border-purple-200 focus:border-purple-400"
            />
            <p className="text-xs text-gray-500">Faqat raqamlar. Masalan: 150000</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {editingDebt ? "Yangilash" : "Qarzni qo'shish"}
            </Button>
            {editingDebt && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit} className="bg-transparent">
                Bekor qilish
              </Button>
            )}
          </div>
        </form>
        <div className="mt-4 space-y-2">
          {onExportPDF && (
            <Button
              onClick={onExportPDF}
              variant="outline"
              className="w-full bg-transparent border-2 border-orange-200 hover:bg-orange-50"
            >
              <FileDown className="w-4 h-4 mr-2" />📤 Ro'yxatni PDF qilish
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
