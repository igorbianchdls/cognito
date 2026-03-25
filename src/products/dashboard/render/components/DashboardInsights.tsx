"use client";

import * as React from "react";
import {
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type AnyRecord = Record<string, any>;

function resolveIcon(name: unknown) {
  const normalized = String(name || "").trim().toLowerCase();
  if (normalized === "trend-up" || normalized === "up" || normalized === "positive") return TrendingUp;
  if (normalized === "trend-down" || normalized === "down" || normalized === "negative") return TrendingDown;
  if (normalized === "alert" || normalized === "warning" || normalized === "risk") return AlertTriangle;
  return Info;
}

export default function DashboardInsights({ element }: { element: any }) {
  const props = (element?.props || {}) as AnyRecord;
  const items = Array.isArray(props.items) ? props.items : [];
  const title = typeof props.title === "string" && props.title.trim() ? props.title.trim() : "Insights";
  const containerStyle = props.containerStyle && typeof props.containerStyle === "object"
    ? props.containerStyle as React.CSSProperties
    : undefined;
  const titleStyle = props.titleStyle && typeof props.titleStyle === "object"
    ? props.titleStyle as React.CSSProperties
    : undefined;
  const itemStyle = props.itemStyle && typeof props.itemStyle === "object"
    ? props.itemStyle as React.CSSProperties
    : undefined;
  const textStyle = props.textStyle && typeof props.textStyle === "object"
    ? props.textStyle as React.CSSProperties
    : undefined;
  const iconStyle = props.iconStyle && typeof props.iconStyle === "object"
    ? props.iconStyle as React.CSSProperties
    : undefined;
  const gap = typeof props.gap === "number" ? props.gap : 12;
  const itemGap = typeof props.itemGap === "number" ? props.itemGap : 12;
  const showDividers = props.showDividers === true;
  const dividerColor = typeof props.dividerColor === "string" ? props.dividerColor : "#e2e8f0";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        minWidth: 0,
        ...containerStyle,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          ...titleStyle,
        }}
      >
        {title}
      </p>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, index) => {
          const record = item && typeof item === "object" ? item as AnyRecord : {};
          const text = typeof record.text === "string" ? record.text : "";
          if (!text) return null;
          const Icon = resolveIcon(record.icon);
          const hasIcon = typeof record.icon === "string" && record.icon.trim().length > 0;
          return (
            <div
              key={`${text}-${index}`}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: itemGap,
                padding: "12px 0",
                borderTop: showDividers && index > 0 ? `1px solid ${dividerColor}` : undefined,
                ...itemStyle,
              }}
            >
              {hasIcon ? (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "0 0 auto",
                    marginTop: 1,
                    color: "#2563eb",
                    ...iconStyle,
                  }}
                >
                  <Icon size={16} />
                </div>
              ) : null}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "#475569",
                  ...textStyle,
                }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
