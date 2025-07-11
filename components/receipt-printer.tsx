"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Printer, Download } from "lucide-react"
import type { DebtRecord } from "@/types/debt"

interface ReceiptPrinterProps {
  debt?: DebtRecord | null
  onClose: () => void
}

export default function ReceiptPrinter({ debt, onClose }: ReceiptPrinterProps) {
  const [shopName, setShopName] = useState("ODINA MADINA MCHJ DORIXONASI")
  const [shopAddress, setShopAddress] = useState("Bog'ot tumani, Dehqonbozor qishloqi, Yo'ldosh ota to'yxonasi yon tomoni")
  const [shopPhone, setShopPhone] = useState("+998 88 458 93 98")
  const [shopPhone, setShopPhone] = useState("+998 90 725 40 02")
  const [notes, setNotes] = useState("")

  // If no debt was passed, render nothing (or a tiny placeholder)
  if (!debt) return null

  const printReceipt = () => {
    const receiptContent = `
      <div style="width: 300px; font-family: monospace; font-size: 12px; line-height: 1.4;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px;">${setShopName}</h2>
          <p style="margin: 2px 0;">${setShopAddress}</p>
          <p style="margin: 2px 0;">Tel: ${setShopPhone}</p>
          <p style="margin: 2px 0;">Tel: ${setShopPhone}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <p style="margin: 2px 0;"><strong>DORIXONA QARZ CHEKI</strong></p>
          <p style="margin: 2px 0;">Sana: ${new Date().toLocaleString()}</p>
          <p style="margin: 2px 0;">Chek №: ${Date.now()}</p>
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 10px 0; margin: 10px 0;">
          <p style="margin: 2px 0;"><strong>Mijoz:</strong> ${debt.ism}</p>
          <p style="margin: 2px 0;"><strong>Telefon:</strong> ${debt.tel}</p>
          <p style="margin: 2px 0;"><strong>Qarz miqdori:</strong> ${debt.qarz.toLocaleString()} so'm</p>
          <p style="margin: 2px 0;"><strong>Qarz sanasi:</strong> ${debt.sana}</p>
          <p style="margin: 2px 0;"><strong>Holati:</strong> ${debt.tolandi ? "To'langan ✅" : "To'lanmagan ❌"}</p>
        </div>
        
        ${notes ? `<div style="margin: 10px 0;"><p style="margin: 2px 0;"><strong>Izoh:</strong></p><p style="margin: 2px 0;">${notes}</p></div>` : ""}
        
        <div style="text-align: center; margin-top: 15px; font-size: 10px;">
          <p style="margin: 2px 0;">Rahmat!</p>
          <p style="margin: 2px 0;">Iltimos! Qarzingizni vaqtida to'lang</p>
        </div>
      </div>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Qarz Cheki</title>
            <style>
              body { margin: 0; padding: 20px; }
              @media print {
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body>
            ${receiptContent}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const downloadReceipt = () => {
    const receiptText = `
${setShopName}
${setShopAddress}
Tel: ${setShopPhone}

================================
"ODINA MADINA MCHJ"
     DORIXONASI
================================
Sana: ${new Date().toLocaleString()}
Chek №: ${Date.now()}

Mijoz: ${debt.ism}
Telefon: ${debt.tel}
Qarz miqdori: ${debt.qarz.toLocaleString()} so'm
Qarz sanasi: ${debt.sana}
Holati: ${debt.tolandi ? "To'langan ✅" : "To'lanmagan ❌"}

${notes ? `Izoh: ${notes}` : ""}

================================
KEYINGI SAFARGI QARZINGIZNI 
     VAQTIDA TO'LANG! 
================================
    `

    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chek-${debt.ism}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>🧾 Chek Chiqarish</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Dorixona nomi:</label>
            <Input value={setShopName} onChange={(e) => setShopName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Manzil:</label>
            <Input value={setShopAddress} onChange={(e) => setShopAddress(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Telefon:</label>
            <Input value={setShopPhone} onChange={(e) => setShopPhone(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Qo'shimcha izoh:</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qo'shimcha ma'lumot..."
              rows={3}
            />
          </div>

          <div className="border rounded p-3 bg-gray-50 text-sm">
            <strong>Chek ma'lumotlari:</strong>
            <br />
            Mijoz: {debt.ism}
            <br />
            Qarz: {debt.qarz.toLocaleString()} so'm
            <br />
            Holat: {debt.tolandi ? "To'langan ✅" : "To'lanmagan ❌"}
          </div>

          <div className="flex gap-2">
            <Button onClick={printReceipt} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Chop etish
            </Button>
            <Button onClick={downloadReceipt} variant="outline" className="flex-1 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Yuklash
            </Button>
          </div>

          <Button onClick={onClose} variant="outline" className="w-full bg-transparent">
            Yopish
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
