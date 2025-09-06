'use client';


import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Helper function to convert hex color + opacity to RGBA
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

interface KPICardProps {
  // Data props
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

  // Customization props (igual ao padrão do Table)
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  textAlign?: 'left' | 'center' | 'right';
  shadow?: boolean;
  
  // Typography props
  valueFontSize?: number;
  valueColor?: string;
  valueFontWeight?: number;
  nameFontSize?: number;
  nameColor?: string;
  nameFontWeight?: number;
  nameFontFamily?: string;
  changeColor?: string;
  targetColor?: string;
  valueFontFamily?: string;
  // Title-specific properties
  titleAlign?: 'left' | 'center' | 'right';
  titleMarginTop?: number;
  titleMarginBottom?: number;
  titleLetterSpacing?: number;
  titleLineHeight?: number;
  // Subtitle-specific properties
  subtitleAlign?: 'left' | 'center' | 'right';
  subtitleMarginTop?: number;
  subtitleMarginBottom?: number;
  subtitleLetterSpacing?: number;
  subtitleLineHeight?: number;
}

export function KPICard({
  // Data props
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
  error,

  // Customization props
  backgroundColor,
  backgroundOpacity,
  borderColor,
  borderOpacity,
  borderWidth,
  borderRadius,
  padding,
  textAlign,
  shadow,
  
  // Typography props
  valueFontSize,
  valueColor,
  valueFontWeight,
  nameFontSize,
  nameColor,
  nameFontWeight,
  nameFontFamily,
  changeColor,
  targetColor,
  valueFontFamily,
  // Title-specific properties
  titleAlign,
  titleMarginTop,
  titleMarginBottom,
  titleLetterSpacing,
  titleLineHeight,
  // Subtitle-specific properties
  subtitleAlign,
  subtitleMarginTop,
  subtitleMarginBottom,
  subtitleLetterSpacing,
  subtitleLineHeight
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


  return (
    <div style={{ width: '100%', height: '100%', minWidth: 0 }}>
      <Card 
        className="@container/card h-full"
        style={{
          backgroundColor: backgroundColor ? hexToRgba(backgroundColor, backgroundOpacity ?? 1) : 'white',
          borderColor: borderColor ? hexToRgba(borderColor, borderOpacity ?? 1) : '#e5e7eb',
          borderWidth: borderWidth ? `${borderWidth}px` : undefined,
          borderRadius: borderRadius ? `${borderRadius}px` : undefined,
          padding: padding ? `${padding}px` : undefined,
          textAlign: textAlign || 'left',
          boxShadow: shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined,
        }}
      >
        <CardHeader className="!text-left !items-start">
          <CardDescription 
            className="!text-left !justify-start"
            style={{
              color: nameColor || undefined,
              fontSize: nameFontSize ? `${nameFontSize}px` : undefined,
              fontWeight: nameFontWeight || undefined,
              fontFamily: nameFontFamily !== 'inherit' ? nameFontFamily : undefined,
              textAlign: subtitleAlign || textAlign || 'left',
              marginTop: subtitleMarginTop ? `${subtitleMarginTop}px` : undefined,
              marginBottom: subtitleMarginBottom ? `${subtitleMarginBottom}px` : undefined,
              letterSpacing: subtitleLetterSpacing ? `${subtitleLetterSpacing}px` : undefined,
              lineHeight: subtitleLineHeight || undefined
            }}>
            {name || 'KPI'}
          </CardDescription>
          <CardTitle 
            className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl !text-left"
            style={{
              color: valueColor || undefined,
              fontSize: valueFontSize ? `${valueFontSize}px` : undefined,
              fontWeight: valueFontWeight || undefined,
              fontFamily: valueFontFamily !== 'inherit' ? valueFontFamily : undefined,
              textAlign: titleAlign || textAlign || 'left',
              marginTop: titleMarginTop ? `${titleMarginTop}px` : undefined,
              marginBottom: titleMarginBottom ? `${titleMarginBottom}px` : undefined,
              letterSpacing: titleLetterSpacing ? `${titleLetterSpacing}px` : undefined,
              lineHeight: titleLineHeight || undefined
            }}
          >
            {formatValue(currentValue, unit || '')}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

export default KPICard