"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

interface BarChartHorizontalRechartsProps {
  items: Array<{ label: string; value: number }>
  title: string
  icon?: React.ReactNode
  color?: string
  height?: number
}

export function BarChartHorizontalRecharts({
  items,
  title,
  icon,
  color = '#64748b',
  height = 240
}: BarChartHorizontalRechartsProps) {
  const data = useMemo(() =>
    items.map(it => ({
      label: it.label,
      value: it.value
    })),
    [items]
  )

  const total = useMemo(() =>
    items.reduce((acc, it) => acc + (it.value || 0), 0),
    [items]
  )

  const chartConfig = {
    value: {
      label: "Valor",
      color: color,
    },
  } satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} style={{ height }}>
          <BarChart
            accessibilityLayer
            data={data}
            layout="horizontal"
            margin={{
              left: 0,
              right: 12,
              top: 10,
              bottom: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              style={{ fontSize: '12px' }}
            />
            <XAxis
              type="number"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload
                const value = Number(data.value || 0)
                const percentage = total > 0 ? (value / total) * 100 : 0

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-semibold mb-1 max-w-[240px] truncate">
                      {data.label}
                    </div>
                    <div className="text-sm">
                      Valor: {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Participação: {percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              fill={color}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
