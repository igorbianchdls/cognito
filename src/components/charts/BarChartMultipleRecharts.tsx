"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
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
  ChartTooltipContent,
} from "@/components/ui/chart"

interface SeriesConfig {
  key: string
  label: string
  color: string
}

interface BarChartMultipleRechartsProps {
  items: Array<{ label: string; [key: string]: string | number }>
  title: string
  icon?: React.ReactNode
  series: SeriesConfig[]
  height?: number
}

export function BarChartMultipleRecharts({
  items,
  title,
  icon,
  series,
  height = 240
}: BarChartMultipleRechartsProps) {
  // Build chart config from series
  const chartConfig = series.reduce((acc, s) => {
    acc[s.key] = {
      label: s.label,
      color: s.color,
    }
    return acc
  }, {} as ChartConfig)

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
            data={items}
            margin={{ top: 10, right: 12, bottom: 30, left: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                // Truncate long labels
                return value.length > 10 ? value.slice(0, 10) + '...' : value
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                // Format as currency
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(value)
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="rect"
            />
            {series.map((s) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                fill={s.color}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
