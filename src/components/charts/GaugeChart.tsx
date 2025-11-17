"use client";

import React from 'react';

export interface GaugeChartProps {
  // Values
  value?: number;
  target?: number;
  percent?: number; // 0..100
  unit?: string;

  // Title / subtitle
  title?: string;
  subtitle?: string;
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: number | string;
  titleColor?: string;
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: number | string;
  subtitleColor?: string;

  // Container
  className?: string;
  containerBackground?: string;
  containerOpacity?: number;
  containerBackdropFilter?: string;
  containerBoxShadow?: string;
  containerBorder?: string;
  containerTransform?: string;
  containerTransition?: string;
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderAccentColor?: string;
  containerBorderRadius?: number;
  containerBorderVariant?: 'smooth' | 'accent' | 'none';
  containerPadding?: number;

  // Gauge geometry
  startAngle?: number; // degrees (default 180)
  endAngle?: number;   // degrees (default 0)
  radius?: number;     // visual radius (px)
  thickness?: number;  // track thickness (px)
  trackColor?: string;
  progressColor?: string;
  animate?: boolean;
}

export function GaugeChart(props: GaugeChartProps) {
  const {
    value,
    target,
    percent,
    unit,
    title,
    subtitle,
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontFamily,
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    className,
    containerBackground = '#ffffff',
    containerOpacity,
    containerBackdropFilter,
    containerBoxShadow,
    containerBorder,
    containerTransform,
    containerTransition,
    containerBorderWidth,
    containerBorderColor = '#e5e7eb',
    containerBorderAccentColor = '#bbb',
    containerBorderRadius,
    containerBorderVariant = 'smooth',
    containerPadding = 16,
    startAngle = 180,
    endAngle = 0,
    radius = 48,
    thickness = 8,
    trackColor = '#e5e7eb',
    progressColor = '#3b82f6',
    animate = true,
  } = props;

  const pct = (() => {
    if (typeof percent === 'number') return Math.max(0, Math.min(100, percent));
    if (typeof value === 'number' && typeof target === 'number' && target !== 0) {
      return Math.max(0, Math.min(100, (value / target) * 100));
    }
    return 0;
  })();

  // Circumference for a half circle with radius: approx PI * radius
  const arcLength = Math.PI * radius;
  const dash = (pct / 100) * arcLength;
  const svgWidth = radius * 2 + thickness * 2;
  const svgHeight = radius + thickness * 2;

  return (
    <div
      className={className || 'relative flex flex-col min-w-0'}
      style={{
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        height: '100%',
        background: containerBackground,
        opacity: containerOpacity,
        backdropFilter: containerBackdropFilter,
        boxShadow: containerBoxShadow,
        transform: containerTransform,
        transition: containerTransition,
        border: containerBorderVariant === 'none'
          ? 'none'
          : (containerBorder || `${(containerBorderWidth ?? 1)}px solid ${containerBorderColor}`),
        borderRadius: containerBorderVariant === 'accent' ? 0 : (containerBorderRadius !== undefined ? `${containerBorderRadius}px` : '12px'),
        padding: `${containerPadding}px`,
      }}
    >
      {/* Accent corners like KPI when variant is 'accent' */}
      {containerBorderVariant === 'accent' && (
        <>
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', left: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor}`, borderLeft: `0.5px solid ${containerBorderAccentColor}` }} />
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', right: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor}`, borderRight: `0.5px solid ${containerBorderAccentColor}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', left: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor}`, borderLeft: `0.5px solid ${containerBorderAccentColor}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', right: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor}`, borderRight: `0.5px solid ${containerBorderAccentColor}` }} />
        </>
      )}

      {title && (
        <h3
          style={{
            margin: `0 0 8px 0`,
            fontFamily: titleFontFamily,
            fontSize: `${titleFontSize}px`,
            fontWeight: titleFontWeight,
            color: titleColor
          }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <div
          style={{
            margin: `0 0 12px 0`,
            fontFamily: subtitleFontFamily,
            fontSize: `${subtitleFontSize}px`,
            fontWeight: subtitleFontWeight,
            color: subtitleColor
          }}
        >
          {subtitle}
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: svgWidth, height: svgHeight }}>
          <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
            <path
              d={`M ${thickness} ${radius + thickness} A ${radius} ${radius} 0 0 1 ${svgWidth - thickness} ${radius + thickness}`}
              stroke={trackColor}
              strokeWidth={thickness}
              fill="none"
            />
            <path
              d={`M ${thickness} ${radius + thickness} A ${radius} ${radius} 0 0 1 ${svgWidth - thickness} ${radius + thickness}`}
              stroke={progressColor}
              strokeWidth={thickness}
              fill="none"
              strokeDasharray={`${dash} ${arcLength}`}
              style={{ transition: animate ? 'stroke-dasharray 0.5s ease' : undefined }}
            />
            <circle cx={svgWidth / 2} cy={radius + thickness} r={2} fill="#6b7280" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default GaugeChart;

