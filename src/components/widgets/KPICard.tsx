"use client";


import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import React from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

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
  // Visual variant
  variant?: 'classic' | 'tile'
  size?: 'sm' | 'md' | 'lg'
  borderVariant?: 'smooth' | 'accent'

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
  change?: number; // kept for backward-compat
  changePct?: number; // percent change (e.g., 14.7 for 14.7%)
  trend?: string;
  status?: string;
  timeRange?: string;
  comparisonLabel?: string; // e.g. 'VS PREV. 28 DAYS'
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

  // Icon for tile variant
  icon?: React.ReactNode;
  iconColor?: string;
  iconBg?: string;

  // Formatting
  abbreviate?: boolean;
  decimals?: number;

  // Colors
  positiveColor?: string;
  negativeColor?: string;
  neutralColor?: string;

  // Tile layout overrides (optional)
  tilePadding?: number; // px (uniform)
  tilePaddingX?: number; // px
  tilePaddingY?: number; // px
  tileIconCircleSize?: number; // px
  tileIconSize?: number; // px
  tileValuePaddingY?: number; // px

  // Container styling props
  kpiContainerBackgroundColor?: string;
  kpiContainerBackgroundOpacity?: number;
  kpiContainerBorderColor?: string;
  kpiContainerBorderAccentColor?: string;
  kpiContainerBorderOpacity?: number;
  kpiContainerBorderWidth?: number;
  kpiContainerBorderRadius?: number;
  kpiContainerPadding?: number;
  kpiContainerTextAlign?: 'left' | 'center' | 'right';
  kpiContainerShadow?: boolean;

  // Advanced Background Effects
  backgroundOpacity?: number;
  backgroundGradient?: {
    enabled: boolean;
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
  backdropFilter?: {
    enabled: boolean;
    blur: number;
  };

  // Advanced Shadow Effects
  containerShadowColor?: string;
  containerShadowOpacity?: number;
  containerShadowBlur?: number;
  containerShadowOffsetX?: number;
  containerShadowOffsetY?: number;

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
  variant = 'classic',
  size = 'md',
  borderVariant = 'smooth',
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
  changePct,
  trend,
  status,
  timeRange,
  comparisonLabel = 'VS PREV. 28 DAYS',
  visualization,
  metadata,
  success,
  error,

  // Icon
  icon,
  iconColor,
  iconBg,

  // Formatting
  abbreviate,
  decimals = 2,

  // Colors
  positiveColor = '#16a34a',
  negativeColor = '#dc2626',
  neutralColor = '#6b7280',

  // Tile overrides
  tilePadding,
  tilePaddingX,
  tilePaddingY,
  tileIconCircleSize,
  tileIconSize,
  tileValuePaddingY,

  // Container styling props
  kpiContainerBackgroundColor,
  kpiContainerBackgroundOpacity,
  kpiContainerBorderColor,
  kpiContainerBorderAccentColor,
  kpiContainerBorderOpacity,
  kpiContainerBorderWidth,
  kpiContainerBorderRadius,
  kpiContainerPadding,
  kpiContainerTextAlign,
  kpiContainerShadow,

  // Advanced Background Effects
  backgroundOpacity,
  backgroundGradient,
  backdropFilter,

  // Advanced Shadow Effects
  containerShadowColor,
  containerShadowOpacity,
  containerShadowBlur,
  containerShadowOffsetX,
  containerShadowOffsetY,

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
  changeColor: changeColorProp,
  targetColor: targetColorProp,

  // Tailwind Classes - KPI
  kpiNameClassName = "",
  kpiValueClassName = "",
  kpiContainerClassName = ""
}: KPICardProps) {
  // Reference compatibility props so linter doesn't flag them as unused
  const __compat = { kpiId, datasetId, tableId, metric, calculation, target, trend, status, timeRange, visualization, metadata, targetColorProp }
  void __compat

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

  const formatAbbreviate = (n: number) => {
    const abs = Math.abs(n)
    if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(decimals)}B`
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(decimals)}M`
    if (abs >= 1_000) return `${(n / 1_000).toFixed(decimals)}K`
    return n.toFixed(decimals)
  }

  const formatValue = (value: number | undefined, unit: string = '') => {
    if (value === undefined || value === null) return 'N/A';
    let formattedNumber: string
    if (abbreviate && unit !== '%' && unit !== 'rating') {
      formattedNumber = formatAbbreviate(Number(value))
    } else {
      formattedNumber = Number(value).toLocaleString('pt-BR', {
        minimumFractionDigits: unit === '%' || unit === 'rating' ? 2 : 0,
        maximumFractionDigits: unit === '%' || unit === 'rating' ? 2 : 2,
      })
    }
    if (unit === '$') return `${unit}${formattedNumber}`
    if (unit) return `${formattedNumber} ${unit}`
    return formattedNumber
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  };

  // Create advanced background styles
  const getAdvancedBackground = () => {
    // Priority: gradient > backgroundColor with opacity > backgroundColor
    if (backgroundGradient?.enabled) {
      const { type, direction, startColor, endColor } = backgroundGradient;
      switch (type) {
        case 'linear':
          return `linear-gradient(${direction}, ${startColor}, ${endColor})`;
        case 'radial':
          return `radial-gradient(${direction}, ${startColor}, ${endColor})`;
        case 'conic':
          return `conic-gradient(from ${direction}, ${startColor}, ${endColor})`;
        default:
          return `linear-gradient(${direction}, ${startColor}, ${endColor})`;
      }
    }

    // Apply opacity to backgroundColor if specified
    if (kpiContainerBackgroundColor && backgroundOpacity !== undefined) {
      const hex = kpiContainerBackgroundColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
    }

    return kpiContainerBackgroundColor ? hexToRgba(kpiContainerBackgroundColor, kpiContainerBackgroundOpacity ?? 1) : 'white';
  };

  const getBackdropFilter = () => {
    if (backdropFilter?.enabled && backdropFilter?.blur) {
      return `blur(${backdropFilter.blur}px)`;
    }
    return undefined;
  };


  // Tile variant (mock-like UI)
  if (variant === 'tile') {
    // Calculate change percent
    const effectiveChangePct = changePct !== undefined && changePct !== null
      ? changePct
      : (previousValue !== undefined && previousValue !== null && previousValue !== 0
          ? ((Number(currentValue || 0) - Number(previousValue)) / Math.abs(Number(previousValue))) * 100
          : (change !== undefined ? change : 0))

    const isPositive = (effectiveChangePct ?? 0) >= 0
    const appliedChangeColor = changeColorProp ?? (isPositive ? positiveColor : negativeColor)
    const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight

    const sizeMap = {
      sm: { label: 'text-[12px]', value: 'text-[20px]', micro: 'text-[11px]', icon: 30, pad: 'p-3' },
      md: { label: 'text-[13px]', value: 'text-[24px]', micro: 'text-[12px]', icon: 36, pad: 'p-4' },
      lg: { label: 'text-[14px]', value: 'text-[28px]', micro: 'text-[12px]', icon: 42, pad: 'p-5' },
    } as const
    const s = sizeMap[size]
    const circleSize = tileIconCircleSize ?? s.icon
    const innerIconSize = tileIconSize ?? Math.max(16, circleSize - 8)

    return (
      <Card className={kpiContainerClassName || `bg-white ${borderVariant === 'accent' ? 'border-0' : 'border border-gray-200'} shadow-sm rounded-xl relative ${s.pad}`}
        style={(() => {
          if (tilePadding !== undefined) return { padding: `${tilePadding}px` } as React.CSSProperties
          const style: React.CSSProperties = {}
          if (tilePaddingX !== undefined) { style.paddingLeft = tilePaddingX; style.paddingRight = tilePaddingX }
          if (tilePaddingY !== undefined) { style.paddingTop = tilePaddingY; style.paddingBottom = tilePaddingY }
          // Apply custom border for smooth variant only
          if (kpiContainerBorderColor && borderVariant === 'smooth') {
            style.border = `${borderVariant === 'accent' ? 0.5 : (kpiContainerBorderWidth ?? 1)}px solid ${hexToRgba(kpiContainerBorderColor, kpiContainerBorderOpacity ?? 1)}`
          }
          if (typeof kpiContainerBorderRadius === 'number') style.borderRadius = kpiContainerBorderRadius
          if (typeof kpiContainerShadow === 'boolean') style.boxShadow = kpiContainerShadow ? '0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)' : 'none'
          return Object.keys(style).length ? style : undefined
        })()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`font-medium text-slate-800 leading-none ${s.label}`}>{name || 'KPI'}</div>
          {React.isValidElement(icon) ? (
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: circleSize, height: circleSize, backgroundColor: iconBg || '#f3f4f6' }}
            >
              {React.cloneElement(
                icon as React.ReactElement<{ size?: number; color?: string }>,
                { size: innerIconSize, color: iconColor || '#9ca3af' }
              )}
            </div>
          ) : null}
        </div>
        {/* Value */}
        <div className={`font-semibold text-slate-900 leading-none ${s.value}`} style={tileValuePaddingY !== undefined ? { paddingTop: tileValuePaddingY, paddingBottom: tileValuePaddingY } : { paddingTop: 4, paddingBottom: 4 }}>
          {formatValue(currentValue, unit)}
        </div>
        {/* Footer */}
        <div className="flex items-center gap-2">
          <TrendIcon size={14} color={appliedChangeColor} />
          <span style={{ color: appliedChangeColor }} className="font-medium text-[12px] leading-none">
            {Math.abs(effectiveChangePct || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
          </span>
          <span className={`uppercase tracking-wide leading-none ${s.micro}`} style={{ color: neutralColor }}>
            {comparisonLabel}
          </span>
        </div>
        {borderVariant === 'accent' ? (
          <>
            <div
              className="absolute w-3 h-3"
              style={{
                top: '-0.5px',
                left: '-0.5px',
                borderTop: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
                borderLeft: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
              }}
            />
            <div
              className="absolute w-3 h-3"
              style={{
                top: '-0.5px',
                right: '-0.5px',
                borderTop: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
                borderRight: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
              }}
            />
            <div
              className="absolute w-3 h-3"
              style={{
                bottom: '-0.5px',
                left: '-0.5px',
                borderBottom: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
                borderLeft: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
              }}
            />
            <div
              className="absolute w-3 h-3"
              style={{
                bottom: '-0.5px',
                right: '-0.5px',
                borderBottom: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
                borderRight: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
              }}
            />
          </>
        ) : null}
      </Card>
    )
  }

  return (
    <Card
      className={kpiContainerClassName || "@container/card h-full w-full p-0 rounded-none relative"}
      style={kpiContainerClassName ? {} : {
        background: getAdvancedBackground(),
        backdropFilter: getBackdropFilter(),
        // Commented out border props - now handled directly
        // borderColor: kpiContainerBorderColor ? hexToRgba(kpiContainerBorderColor, kpiContainerBorderOpacity ?? 1) : '#e5e7eb',
        // borderWidth: kpiContainerBorderWidth ? `${kpiContainerBorderWidth}px` : '1px',
        // borderStyle: 'solid',
        border: `0.5px solid ${kpiContainerBorderColor || '#777'}`, // Corner accent border applied directly
        // borderRadius: kpiContainerBorderRadius ? `${kpiContainerBorderRadius}px` : undefined, // Commented for corner accent effect
        padding: kpiContainerPadding ? `${kpiContainerPadding}px` : undefined,
        textAlign: kpiContainerTextAlign || 'left',
        boxShadow: 'none',
      }}
    >
      {/* Corner accents - positioned inside to overlay border */}
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          left: '-0.5px',
          borderTop: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          right: '-0.5px',
          borderTop: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          left: '-0.5px',
          borderBottom: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          right: '-0.5px',
          borderBottom: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${kpiContainerBorderAccentColor || '#bbb'}`
        }}
      ></div>
        <CardHeader className="!text-left !items-start">
          <CardDescription
            className={kpiNameClassName || "!text-left !justify-start"}
            style={kpiNameClassName ? {} : {
              color: kpiNameColor || undefined,
              fontSize: kpiNameFontSize ? `${kpiNameFontSize}px` : undefined,
              fontWeight: kpiNameFontWeight || undefined,
              fontFamily: kpiNameFontFamily !== 'inherit' ? kpiNameFontFamily : undefined,
              textAlign: kpiNameAlign || kpiContainerTextAlign || 'left',
              marginTop: kpiNameMarginTop !== undefined ? `${kpiNameMarginTop}px` : '12px',
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
  );
}

export default KPICard
