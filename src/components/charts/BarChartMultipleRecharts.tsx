"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
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
          <BarChart accessibilityLayer data={items}>
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
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
