"use client";

import * as React from "react";

type AnyRecord = Record<string, any>;

export default function DashboardInsights({ element }: { element: any }) {
  const props = (element?.props || {}) as AnyRecord;
  const items = Array.isArray(props.items) ? props.items : [];
  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({});
  const containerStyle = props.containerStyle && typeof props.containerStyle === "object"
    ? props.containerStyle as React.CSSProperties
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
  const markerColor = typeof iconStyle?.backgroundColor === "string"
    ? iconStyle.backgroundColor
    : typeof iconStyle?.color === "string"
      ? iconStyle.color
      : "#2563eb";

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
      <div style={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, index) => {
          const record = item && typeof item === "object" ? item as AnyRecord : {};
          const itemTitle = typeof record.title === "string" ? record.title : "";
          const text = typeof record.text === "string" ? record.text : "";
          const isExpandable = Boolean(itemTitle && text);
          const isOpen = openItems[index] === true;
          if (!text && !itemTitle) return null;
          return (
            <div
              key={`${itemTitle || text}-${index}`}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "8px 0",
                borderTop: showDividers && index > 0 ? `1px solid ${dividerColor}` : undefined,
                ...itemStyle,
              }}
            >
              {isExpandable ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: itemGap,
                      width: "100%",
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        flex: "0 0 auto",
                        marginTop: 5,
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderLeft: `8px solid ${markerColor}`,
                        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        transformOrigin: "35% 50%",
                        transition: "transform 160ms ease",
                      }}
                    />
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 500,
                        lineHeight: 1.6,
                        color: "#475569",
                        ...textStyle,
                      }}
                    >
                      {itemTitle}
                    </p>
                  </button>
                  {isOpen ? (
                    <p
                      style={{
                        margin: 0,
                        marginLeft: itemGap + 8,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "#475569",
                        ...textStyle,
                      }}
                    >
                      {text}
                    </p>
                  ) : null}
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: itemGap,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      flex: "0 0 auto",
                      marginTop: 8,
                      backgroundColor: markerColor,
                    }}
                  />
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
