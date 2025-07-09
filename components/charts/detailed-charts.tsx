"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DebtRecord } from "@/types/debt"

interface DetailedChartsProps {
  debts: DebtRecord[]
}

export default function DetailedCharts({ debts }: DetailedChartsProps) {
  const dailyChartRef = useRef<HTMLCanvasElement>(null)
  const monthlyChartRef = useRef<HTMLCanvasElement>(null)
  const yearlyChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadCharts = async () => {
      const Chart = (await import("chart.js/auto")).default

      if (!dailyChartRef.current || !monthlyChartRef.current || !yearlyChartRef.current) return

      // Kunlik statistika (so'nggi 30 kun)
      const dailyData = Array(30).fill(0)
      const dailyLabels: string[] = []

      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        dailyLabels.push(d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit" }))
      }

      debts.forEach((debt) => {
        const debtDate = new Date(debt.sana)
        const today = new Date()
        const diffTime = today.getTime() - debtDate.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays >= 0 && diffDays < 30) {
          dailyData[29 - diffDays] += debt.qarz
        }
      })

      // Oylik statistika (so'nggi 12 oy)
      const monthlyData = Array(12).fill(0)
      const monthlyLabels = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]

      debts.forEach((debt) => {
        const debtDate = new Date(debt.sana)
        const month = debtDate.getMonth()
        monthlyData[month] += debt.qarz
      })

      // Yillik statistika (so'nggi 5 yil)
      const currentYear = new Date().getFullYear()
      const yearlyData = Array(5).fill(0)
      const yearlyLabels = []

      for (let i = 4; i >= 0; i--) {
        yearlyLabels.push((currentYear - i).toString())
      }

      debts.forEach((debt) => {
        const debtDate = new Date(debt.sana)
        const year = debtDate.getFullYear()
        const yearIndex = year - (currentYear - 4)

        if (yearIndex >= 0 && yearIndex < 5) {
          yearlyData[yearIndex] += debt.qarz
        }
      })

      // Kunlik chart
      new Chart(dailyChartRef.current, {
        type: "line",
        data: {
          labels: dailyLabels,
          datasets: [
            {
              label: "Kunlik qarzlar (so'm)",
              data: dailyData,
              fill: true,
              borderColor: "#10b981",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "So'nggi 30 Kunlik Qarzlar" },
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
            x: { display: true },
          },
        },
      })

      // Oylik chart
      new Chart(monthlyChartRef.current, {
        type: "bar",
        data: {
          labels: monthlyLabels,
          datasets: [
            {
              label: "Oylik qarzlar (so'm)",
              data: monthlyData,
              backgroundColor: "#3b82f6",
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Oylik Qarzlar Statistikasi" },
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      })

      // Yillik chart
      new Chart(yearlyChartRef.current, {
        type: "doughnut",
        data: {
          labels: yearlyLabels,
          datasets: [
            {
              data: yearlyData,
              backgroundColor: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"],
              borderWidth: 3,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "So'nggi 5 Yillik Qarzlar" },
            legend: { position: "bottom" },
          },
        },
      })
    }

    loadCharts()
  }, [debts])

  return (
    <div className="grid gap-6">
      {/* Kunlik chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">📅 Kunlik Statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={dailyChartRef} />
        </CardContent>
      </Card>

      {/* Oylik va Yillik chartlar */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">📊 Oylik Statistika</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={monthlyChartRef} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">🎯 Yillik Statistika</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={yearlyChartRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
