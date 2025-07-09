export interface ReceiptData {
  mijoz: string
  telefon: string
  qarz: number
  sana: string
  tolandi: boolean
  shopName?: string
  shopAddress?: string
  shopPhone?: string
  notes?: string
}

export const generateReceiptImage = async (data: ReceiptData): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    // Canvas o'lchami
    canvas.width = 400
    canvas.height = 600

    // Fon
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Matn sozlamalari
    ctx.fillStyle = "#000000"
    ctx.textAlign = "center"

    let y = 40

    // Do'kon nomi
    ctx.font = "bold 24px Arial"
    ctx.fillText(data.shopName || "Mening Do'konim", canvas.width / 2, y)
    y += 30

    // Manzil
    ctx.font = "16px Arial"
    ctx.fillText(data.shopAddress || "Toshkent shahar", canvas.width / 2, y)
    y += 25

    // Telefon
    ctx.fillText(`Tel: ${data.shopPhone || "+998 90 123 45 67"}`, canvas.width / 2, y)
    y += 40

    // Chiziq
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(canvas.width - 20, y)
    ctx.strokeStyle = "#000000"
    ctx.setLineDash([5, 5])
    ctx.stroke()
    y += 30

    // Chek sarlavhasi
    ctx.font = "bold 20px Arial"
    ctx.fillText("QARZ CHEKI", canvas.width / 2, y)
    y += 40

    // Ma'lumotlar
    ctx.font = "16px Arial"
    ctx.textAlign = "left"

    const leftMargin = 30

    ctx.fillText(`Sana: ${new Date().toLocaleString()}`, leftMargin, y)
    y += 25

    ctx.fillText(`Chek №: ${Date.now()}`, leftMargin, y)
    y += 40

    // Chiziq
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(canvas.width - 20, y)
    ctx.stroke()
    y += 30

    // Mijoz ma'lumotlari
    ctx.font = "bold 18px Arial"
    ctx.fillText(`Mijoz: ${data.mijoz}`, leftMargin, y)
    y += 30

    ctx.font = "16px Arial"
    ctx.fillText(`Telefon: ${data.telefon}`, leftMargin, y)
    y += 25

    ctx.fillText(`Qarz miqdori: ${data.qarz.toLocaleString()} so'm`, leftMargin, y)
    y += 25

    ctx.fillText(`Qarz sanasi: ${data.sana}`, leftMargin, y)
    y += 25

    // Holat
    ctx.font = "bold 16px Arial"
    ctx.fillStyle = data.tolandi ? "#10b981" : "#ef4444"
    ctx.fillText(`Holati: ${data.tolandi ? "To'langan ✅" : "To'lanmagan ❌"}`, leftMargin, y)
    y += 40

    // Izoh
    if (data.notes) {
      ctx.fillStyle = "#000000"
      ctx.font = "14px Arial"
      ctx.fillText(`Izoh: ${data.notes}`, leftMargin, y)
      y += 30
    }

    // Chiziq
    ctx.fillStyle = "#000000"
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(canvas.width - 20, y)
    ctx.stroke()
    y += 30

    // Xayr-salomlashish
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Rahmat!", canvas.width / 2, y)
    y += 20
    ctx.fillText("Yana tashrif buyuring!", canvas.width / 2, y)

    // Canvas ni JPG formatda export qilish
    const dataURL = canvas.toDataURL("image/jpeg", 0.9)
    resolve(dataURL)
  })
}

export const downloadReceiptAsJPG = async (data: ReceiptData) => {
  const imageData = await generateReceiptImage(data)

  const link = document.createElement("a")
  link.download = `chek-${data.mijoz}-${Date.now()}.jpg`
  link.href = imageData
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
