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

  // Container styling props
  kpiContainerBackgroundColor?: string;
  kpiContainerBackgroundOpacity?: number;
  kpiContainerBorderColor?: string;
  kpiContainerBorderOpacity?: number;
  kpiContainerBorderWidth?: number;
  kpiContainerBorderRadius?: number;
  kpiContainerPadding?: number;
  kpiContainerTextAlign?: 'left' | 'center' | 'right';
  kpiContainerShadow?: boolean;

  // KPI Value styling props (number display)
  kpiValueColor?: string;
  kpiValueFontSize?: number;
  kpiValueFontWeight?: number;
  kpiValueFontFamily?: string;
  kpiValueAlign?: 'left' | 'center' | 'right';
  kpiValueMarginTop?: number;
  kpiValueMarginRight?: number;
  kpiValueMarginBottom?: number;
  kpiValueMarginLeft?: number;
  kpiValuePaddingTop?: number;
  kpiValuePaddingRight?: number;
  kpiValuePaddingBottom?: number;
  kpiValuePaddingLeft?: number;
  kpiValueLetterSpacing?: number;
  kpiValueLineHeight?: number;

  // KPI Name styling props (label display)
  kpiNameColor?: string;
  kpiNameFontSize?: number;
  kpiNameFontWeight?: number;
  kpiNameFontFamily?: string;
  kpiNameAlign?: 'left' | 'center' | 'right';
  kpiNameMarginTop?: number;
  kpiNameMarginRight?: number;
  kpiNameMarginBottom?: number;
  kpiNameMarginLeft?: number;
  kpiNamePaddingTop?: number;
  kpiNamePaddingRight?: number;
  kpiNamePaddingBottom?: number;
  kpiNamePaddingLeft?: number;
  kpiNameLetterSpacing?: number;
  kpiNameLineHeight?: number;

  // Special color props
  changeColor?: string;
  targetColor?: string;

  // Tailwind Classes - KPI (precedence over individual props)
  kpiNameClassName?: string;
  kpiValueClassName?: string;
  kpiContainerClassName?: string;
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

  // Container styling props
  kpiContainerBackgroundColor,
  kpiContainerBackgroundOpacity,
  kpiContainerBorderColor,
  kpiContainerBorderOpacity,
  kpiContainerBorderWidth,
  kpiContainerBorderRadius,
  kpiContainerPadding,
  kpiContainerTextAlign,
  kpiContainerShadow,

  // KPI Value styling props (number display)
  kpiValueColor,
  kpiValueFontSize,
  kpiValueFontWeight,
  kpiValueFontFamily,
  kpiValueAlign,
  kpiValueMarginTop,
  kpiValueMarginRight,
  kpiValueMarginBottom,
  kpiValueMarginLeft,
  kpiValuePaddingTop,
  kpiValuePaddingRight,
  kpiValuePaddingBottom,
  kpiValuePaddingLeft,
  kpiValueLetterSpacing,
  kpiValueLineHeight,

  // KPI Name styling props (label display)
  kpiNameColor,
  kpiNameFontSize,
  kpiNameFontWeight,
  kpiNameFontFamily,
  kpiNameAlign,
  kpiNameMarginTop,
  kpiNameMarginRight,
  kpiNameMarginBottom,
  kpiNameMarginLeft,
  kpiNamePaddingTop,
  kpiNamePaddingRight,
  kpiNamePaddingBottom,
  kpiNamePaddingLeft,
  kpiNameLetterSpacing,
  kpiNameLineHeight,

  // Special color props
  changeColor,
  targetColor,

  // Tailwind Classes - KPI
  kpiNameClassName = "",
  kpiValueClassName = "",
  kpiContainerClassName = ""
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
        className={kpiContainerClassName || "@container/card h-full border-0 p-0"}
        style={kpiContainerClassName ? {} : {
          backgroundColor: kpiContainerBackgroundColor ? hexToRgba(kpiContainerBackgroundColor, kpiContainerBackgroundOpacity ?? 1) : 'white',
          borderColor: kpiContainerBorderColor ? hexToRgba(kpiContainerBorderColor, kpiContainerBorderOpacity ?? 1) : '#e5e7eb',
          borderWidth: kpiContainerBorderWidth ? `${kpiContainerBorderWidth}px` : undefined,
          borderRadius: kpiContainerBorderRadius ? `${kpiContainerBorderRadius}px` : undefined,
          padding: kpiContainerPadding ? `${kpiContainerPadding}px` : undefined,
          textAlign: kpiContainerTextAlign || 'left',
          boxShadow: kpiContainerShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : undefined,
        }}
      >
        <CardHeader className="!text-left !items-start">
          <CardDescription
            className={kpiNameClassName || "!text-left !justify-start"}
            style={kpiNameClassName ? {} : {
              color: kpiNameColor || undefined,
              fontSize: kpiNameFontSize ? `${kpiNameFontSize}px` : undefined,
              fontWeight: kpiNameFontWeight || undefined,
              fontFamily: kpiNameFontFamily !== 'inherit' ? kpiNameFontFamily : undefined,
              textAlign: kpiNameAlign || kpiContainerTextAlign || 'left',
              marginTop: kpiNameMarginTop ? `${kpiNameMarginTop}px` : undefined,
              marginRight: kpiNameMarginRight ? `${kpiNameMarginRight}px` : undefined,
              marginBottom: kpiNameMarginBottom ? `${kpiNameMarginBottom}px` : undefined,
              marginLeft: kpiNameMarginLeft ? `${kpiNameMarginLeft}px` : undefined,
              paddingTop: kpiNamePaddingTop ? `${kpiNamePaddingTop}px` : undefined,
              paddingRight: kpiNamePaddingRight ? `${kpiNamePaddingRight}px` : undefined,
              paddingBottom: kpiNamePaddingBottom ? `${kpiNamePaddingBottom}px` : undefined,
              paddingLeft: kpiNamePaddingLeft ? `${kpiNamePaddingLeft}px` : undefined,
              letterSpacing: kpiNameLetterSpacing ? `${kpiNameLetterSpacing}px` : undefined,
              lineHeight: kpiNameLineHeight || undefined
            }}>
            {name || 'KPI'}
          </CardDescription>
          <CardTitle
            className={kpiValueClassName || "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl !text-left"}
            style={kpiValueClassName ? {} : {
              color: kpiValueColor || undefined,
              fontSize: kpiValueFontSize ? `${kpiValueFontSize}px` : undefined,
              fontWeight: kpiValueFontWeight || undefined,
              fontFamily: kpiValueFontFamily !== 'inherit' ? kpiValueFontFamily : undefined,
              textAlign: kpiValueAlign || kpiContainerTextAlign || 'left',
              marginTop: kpiValueMarginTop ? `${kpiValueMarginTop}px` : undefined,
              marginRight: kpiValueMarginRight ? `${kpiValueMarginRight}px` : undefined,
              marginBottom: kpiValueMarginBottom ? `${kpiValueMarginBottom}px` : undefined,
              marginLeft: kpiValueMarginLeft ? `${kpiValueMarginLeft}px` : undefined,
              paddingTop: kpiValuePaddingTop ? `${kpiValuePaddingTop}px` : undefined,
              paddingRight: kpiValuePaddingRight ? `${kpiValuePaddingRight}px` : undefined,
              paddingBottom: kpiValuePaddingBottom ? `${kpiValuePaddingBottom}px` : undefined,
              paddingLeft: kpiValuePaddingLeft ? `${kpiValuePaddingLeft}px` : undefined,
              letterSpacing: kpiValueLetterSpacing ? `${kpiValueLetterSpacing}px` : undefined,
              lineHeight: kpiValueLineHeight || undefined
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