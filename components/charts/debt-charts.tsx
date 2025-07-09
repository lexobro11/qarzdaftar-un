"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DebtRecord } from "@/types/debt"

interface DebtChartsProps {
  debts: DebtRecord[]
}

export default function DebtCharts({ debts }: DebtChartsProps) {
  const monthlyChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const weeklyChartRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadCharts = async () => {
      const Chart = (await import("chart.js/auto")).default

      if (!monthlyChartRef.current || !pieChartRef.current || !weeklyChartRef.current) return

      // Ma'lumotlarni tahlil qilish
      const today = new Date()
      const monthly = Array(12).fill(0)
      const paid = { yes: 0, no: 0 }
      const last7days = Array(7).fill(0)
      const labels7: string[] = []

      // So'nggi 7 kunlik labellar
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(today.getDate() - i)
        labels7.push(d.toLocaleDateString())
      }

      // Ma'lumotlarni qayta ishlash
      debts.forEach((debt) => {
        const d = new Date(debt.sana)
        const month = d.getMonth()
        monthly[month] += debt.qarz || 0

        if (debt.tolandi) {
          paid.yes += debt.qarz || 0
        } else {
          paid.no += debt.qarz || 0
        }

        labels7.forEach((label, i) => {
          if (new Date(debt.sana).toLocaleDateString() === label) {
            last7days[i] += debt.qarz || 0
          }
        })
      })

      // Oylik chart
      new Chart(monthlyChartRef.current, {
        type: "bar",
        data: {
          labels: ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"],
          datasets: [
            {
              label: "Oylik qarzlar (so'm)",
              data: monthly,
              backgroundColor: "#3b82f6",
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: true },
            title: { display: true, text: "Oylik Qarzlar Statistikasi" },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      })

      // Pie chart
      new Chart(pieChartRef.current, {
        type: "pie",
        data: {
          labels: ["To'langan", "To'lanmagan"],
          datasets: [
            {
              data: [paid.yes, paid.no],
              backgroundColor: ["#10b981", "#ef4444"],
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "To'langan/To'lanmagan Qarzlar" },
          },
        },
      })

      // Haftalik chart
      new Chart(weeklyChartRef.current, {
        type: "line",
        data: {
          labels: labels7,
          datasets: [
            {
              label: "So'nggi 7 kunlik qarzlar (so'm)",
              data: last7days,
              fill: false,
              borderColor: "#f59e0b",
              backgroundColor: "#fbbf24",
              tension: 0.1,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "So'nggi 7 Kunlik Qarzlar" },
          },
          scales: {
            y: { beginAtZero: true },
          },
        },
      })
    }

    loadCharts()
  }, [debts])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📊 Oylik Statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <canvas ref={monthlyChartRef} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>💰 To'lov Holati</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={pieChartRef} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📈 Haftalik Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={weeklyChartRef} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
