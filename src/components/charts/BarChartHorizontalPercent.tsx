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

interface BarChartHorizontalPercentProps {
  items: Array<{ label: string; value: number }>
  title: string
  icon?: React.ReactNode
  color?: string
  height?: number
}

export function BarChartHorizontalPercent({
  items,
  title,
  icon,
  color = '#64748b',
  height = 240
}: BarChartHorizontalPercentProps) {
  const data = useMemo(() =>
    items.map(it => ({
      label: it.label,
      value: it.value
    })),
    [items]
  )

  const chartConfig = {
    value: {
      label: "Taxa",
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
            layout="vertical"
            margin={{
              left: 12,
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
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload
                const value = Number(data.value || 0)

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="font-semibold mb-1 max-w-[240px] truncate">
                      {data.label}
                    </div>
                    <div className="text-sm">
                      Taxa de Conversão: {value.toFixed(1)}%
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
