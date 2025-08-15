'use client';

import { TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface KPICardProps {
  kpiId?: string;
  name?: string;
  datasetId?: string;
  tableId?: string;
  metric?: string;
  calculation?: string;
  currentValue?: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  change?: number;
  trend?: string;
  status?: string;
  timeRange?: string;
  visualization?: {
    chartType?: string;
    color?: string;
    showTrend?: boolean;
    showTarget?: boolean;
  };
  metadata?: {
    createdAt?: string;
    lastUpdated?: string;
    refreshRate?: string;
    dataSource?: string;
  };
  success?: boolean;
  error?: string;
}

export function KPICard({
  kpiId,
  name,
  datasetId,
  tableId,
  metric,
  calculation,
  currentValue,
  previousValue,
  target,
  unit,
  change,
  trend,
  status,
  timeRange,
  visualization,
  metadata,
  success,
  error
}: KPICardProps) {
  if (error || !success) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardDescription className="text-red-600">Erro ao carregar KPI</CardDescription>
          <CardTitle className="text-red-800">{error || 'Erro desconhecido'}</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const formatValue = (value: number | undefined, unit: string = '') => {
    if (value === undefined || value === null) return 'N/A';
    
    const formattedNumber = value.toLocaleString('pt-BR', {
      minimumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
      maximumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
    });
    
    return unit === '$' ? `${unit}${formattedNumber}` : `${formattedNumber} ${unit}`;
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="size-4" />;
      case 'decreasing':
        return <TrendingDown className="size-4" />;
      case 'stable':
        return <Minus className="size-4" />;
      default:
        return <BarChart3 className="size-4" />;
    }
  };

  const getTrendVariant = (): "outline" | "default" | "secondary" | "destructive" => {
    if (change === undefined) return "outline";
    return change >= 0 ? "default" : "destructive";
  };

  const getBadgeClassName = () => {
    switch (status) {
      case 'on-target':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'above-target':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'below-target':
        return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'critical':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'on-target':
        return 'Meta atingida';
      case 'above-target':
        return 'Acima da meta';
      case 'below-target':
        return 'Abaixo da meta';
      case 'critical':
        return 'Situação crítica';
      default:
        return timeRange || 'Período atual';
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
      <Card className="@container/card bg-white border-gray-200 h-full">
        <CardHeader>
          <CardDescription>{name || 'KPI'}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatValue(currentValue, unit || '')}
          </CardTitle>
          <CardAction>
            {change !== undefined && (
              <Badge variant={getTrendVariant()} className={getBadgeClassName()}>
                {getTrendIcon()}
                {change >= 0 ? '+' : ''}{change?.toFixed(1)}%
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {getStatusMessage()} {getTrendIcon()}
          </div>
          <div className="text-muted-foreground">
            {target && `Meta: ${formatValue(target, unit || '')}`}
            {calculation && ` • ${calculation}`}
          </div>
          {metadata?.dataSource && (
            <div className="text-xs text-gray-400">
              {metadata.dataSource}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default KPICard