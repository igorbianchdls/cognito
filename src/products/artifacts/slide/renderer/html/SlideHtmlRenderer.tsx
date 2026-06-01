'use client'

import React from 'react'

import JsonRenderQuery, {
  getQueryDeltaColor,
  resolveQueryTemplate,
  useQueryResult,
} from '@/products/bi/json-render/components/QueryRuntime'
import JsxCardSurface, {
  getJsxCardSurfaceStyle,
  isCardLikeSurface,
} from '@/products/bi/json-render/components/JsxCardSurface'
import { renderChartByType } from '@/products/bi/json-render/components/chartFacade'
import { registry as biRegistry } from '@/products/bi/json-render/registry'
import { ThemeProvider, useSemanticUiStyle } from '@/products/bi/json-render/theme/ThemeContext'
import { buildThemeVars } from '@/products/bi/json-render/theme/themeAdapter'
import { mapManagersToCssVars } from '@/products/bi/json-render/theme/thememanagers'
import { SLIDE_SUPPORTED_HTML_TAGS } from '@/products/artifacts/slide/contract/slideContract'
import type {
  SlideElementModel,
  SlideFrameModel,
  SlideModel,
  SlideThemeModel,
} from '@/products/artifacts/slide/model/slideModel'

type AnyRecord = Record<string, any>

function cssVarsToStyle(cssVars: Record<string, string> | undefined): React.CSSProperties {
  const out: Record<string, string> = {}
  if (!cssVars) return out as React.CSSProperties
  for (const [key, value] of Object.entries(cssVars)) {
    out[`--${key}`] = value
  }
  return out as React.CSSProperties
}

function modelElementToRuntimeElement(element: SlideElementModel) {
  return {
    type: element.sourceType,
    props: element.props,
    children: element.children,
  }
}

function normalizeProps(input: Record<string, any> | undefined): Record<string, any> {
  const props = { ...(input || {}) }
  delete props.children
  delete props.h
  delete props.height
  delete props.style
  delete props.text
  delete props.title
  delete props.w
  delete props.width
  delete props.x
  delete props.y
  return props
}

function getFrameStyle(frame: SlideFrameModel | undefined): React.CSSProperties | undefined {
  if (!frame) return undefined
  return {
    position: 'absolute',
    ...(typeof frame.x === 'number' ? { left: frame.x } : {}),
    ...(typeof frame.y === 'number' ? { top: frame.y } : {}),
    ...(typeof frame.w === 'number' ? { width: frame.w } : {}),
    ...(typeof frame.h === 'number' ? { height: frame.h } : {}),
  }
}

function getObjectStyle(input: unknown): React.CSSProperties {
  return input && typeof input === 'object' && !Array.isArray(input) ? (input as React.CSSProperties) : {}
}

function getStringProp(props: AnyRecord, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getNumberProp(props: AnyRecord, key: string): number | undefined {
  const value = props[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function resolveElementText(element: SlideElementModel, queryResult: ReturnType<typeof useQueryResult>): string {
  const text =
    element.text ||
    getStringProp(element.props as AnyRecord, 'text') ||
    getStringProp(element.props as AnyRecord, 'value') ||
    ''
  return resolveQueryTemplate(text, queryResult)
}

function HtmlNode({
  element,
  children,
}: {
  element: SlideElementModel
  children?: React.ReactNode
}) {
  const props = element.props as AnyRecord
  const tag = element.sourceType.toLowerCase() as keyof React.JSX.IntrinsicElements
  const queryResult = useQueryResult()
  const semanticStyle = useSemanticUiStyle(props['data-ui'], tag)
  const queryDeltaColor = props['data-ui'] === 'kpi-delta' ? getQueryDeltaColor(queryResult) : undefined
  const fallbackContent =
    typeof props.text === 'string'
      ? resolveQueryTemplate(props.text, queryResult)
      : typeof props.title === 'string'
        ? resolveQueryTemplate(props.title, queryResult)
        : null
  const content = children ?? fallbackContent
  const style = {
    boxSizing: 'border-box',
    minWidth: 0,
    ...semanticStyle,
    ...getObjectStyle(props.style),
    ...(queryDeltaColor ? { color: queryDeltaColor } : {}),
  }

  if (isCardLikeSurface(props)) {
    return (
      <JsxCardSurface
        element={{
          ...modelElementToRuntimeElement(element),
          props: {
            ...props,
            style: getJsxCardSurfaceStyle(props, semanticStyle),
          },
        }}
      >
        {content}
      </JsxCardSurface>
    )
  }

  return React.createElement(tag, { ...normalizeProps(props), style }, content)
}

function SemanticText({
  element,
  children,
  role,
}: {
  element: SlideElementModel
  children?: React.ReactNode
  role: 'title' | 'subtitle' | 'textBox' | 'bullets' | 'footer'
}) {
  const queryResult = useQueryResult()
  const props = element.props as AnyRecord
  const frameStyle = getFrameStyle(element.frame)
  const fontSize = getNumberProp(props, 'fontSize')
  const color = getStringProp(props, 'color')
  const align = getStringProp(props, 'align') as React.CSSProperties['textAlign']
  const defaults: Record<'title' | 'subtitle' | 'textBox' | 'bullets' | 'footer', React.CSSProperties> = {
    title: { fontSize: 44, lineHeight: 1.05, fontWeight: 700 },
    subtitle: { fontSize: 20, lineHeight: 1.35, color: '#4F6078' },
    textBox: { fontSize: 16, lineHeight: 1.55 },
    bullets: { fontSize: 16, lineHeight: 1.55 },
    footer: { fontSize: 11, lineHeight: 1.4, color: '#7B8798' },
  }
  const content = children ?? resolveElementText(element, queryResult)

  return (
    <div
      style={{
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...frameStyle,
        ...defaults[role],
        ...(fontSize ? { fontSize } : {}),
        ...(color ? { color } : {}),
        ...(align ? { textAlign: align } : {}),
        ...getObjectStyle(props.style),
      }}
    >
      {role === 'bullets' ? <ul style={{ margin: 0, paddingLeft: 22 }}>{content}</ul> : content}
    </div>
  )
}

function ImageElement({ element }: { element: SlideElementModel }) {
  const props = element.props as AnyRecord
  const src = getStringProp(props, 'src')
  if (!src) return null

  return (
    <img
      alt={getStringProp(props, 'alt') || ''}
      src={src}
      style={{
        boxSizing: 'border-box',
        display: 'block',
        objectFit: getStringProp(props, 'fit') === 'cover' ? 'cover' : 'contain',
        ...getFrameStyle(element.frame),
        ...getObjectStyle(props.style),
      }}
    />
  )
}

function ShapeElement({ element }: { element: SlideElementModel }) {
  const props = element.props as AnyRecord
  return (
    <div
      style={{
        boxSizing: 'border-box',
        backgroundColor: getStringProp(props, 'fill') || 'transparent',
        borderColor: getStringProp(props, 'stroke') || 'transparent',
        borderRadius: getNumberProp(props, 'radius') || 0,
        borderStyle: 'solid',
        borderWidth: getStringProp(props, 'stroke') ? 1 : 0,
        ...getFrameStyle(element.frame),
        ...getObjectStyle(props.style),
      }}
    />
  )
}

function StatElement({ element }: { element: SlideElementModel }) {
  const queryResult = useQueryResult()
  const props = element.props as AnyRecord
  const value = getStringProp(props, 'value')
  const delta = getStringProp(props, 'delta')
  return (
    <div
      style={{
        boxSizing: 'border-box',
        border: '1px solid #D8E1EE',
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 8,
        ...getFrameStyle(element.frame),
        ...getObjectStyle(props.style),
      }}
    >
      {getStringProp(props, 'label') ? (
        <p style={{ margin: 0, fontSize: 12, color: '#6E7B8D' }}>{getStringProp(props, 'label')}</p>
      ) : null}
      {value ? (
        <strong style={{ fontSize: 30, lineHeight: 1, color: '#17243A' }}>{resolveQueryTemplate(value, queryResult)}</strong>
      ) : null}
      {delta ? (
        <p style={{ margin: 0, fontSize: 12, color: '#3B7D4F' }}>{resolveQueryTemplate(delta, queryResult)}</p>
      ) : null}
    </div>
  )
}

function CardElement({ element, children }: { element: SlideElementModel; children?: React.ReactNode }) {
  const props = element.props as AnyRecord
  const frameStyle = getFrameStyle(element.frame)
  return (
    <div style={frameStyle}>
      <JsxCardSurface element={modelElementToRuntimeElement(element)}>{children}</JsxCardSurface>
    </div>
  )
}

function RenderSlideHtmlElement({
  element,
  onAction,
}: {
  element: SlideElementModel
  onAction?: (action: any) => void
}) {
  const queryResult = useQueryResult()
  const text = resolveElementText(element, queryResult)
  const children = element.children.length
    ? element.children.map((child) => (
        <RenderSlideHtmlElement key={child.id} element={child} onAction={onAction} />
      ))
    : undefined

  if (element.kind === 'text') return <>{text}</>
  if (element.kind === 'lineBreak') return <br />
  if (element.kind === 'html' && SLIDE_SUPPORTED_HTML_TAGS.has(element.sourceType.toLowerCase())) {
    return <HtmlNode element={element}>{children}</HtmlNode>
  }
  if (element.kind === 'query') {
    return <JsonRenderQuery element={modelElementToRuntimeElement(element)}>{children}</JsonRenderQuery>
  }
  if (element.kind === 'chart') {
    return <>{renderChartByType((element.props as AnyRecord).type, modelElementToRuntimeElement(element), onAction)}</>
  }
  if (element.kind === 'table') {
    return <biRegistry.Table element={modelElementToRuntimeElement(element)} onAction={onAction} />
  }
  if (element.kind === 'pivotTable') {
    return <biRegistry.PivotTable element={modelElementToRuntimeElement(element)} onAction={onAction} />
  }
  if (element.kind === 'card') return <CardElement element={element}>{children}</CardElement>
  if (element.kind === 'title') return <SemanticText role="title" element={element}>{children}</SemanticText>
  if (element.kind === 'subtitle') return <SemanticText role="subtitle" element={element}>{children}</SemanticText>
  if (element.kind === 'textBox') return <SemanticText role="textBox" element={element}>{children}</SemanticText>
  if (element.kind === 'bullets') return <SemanticText role="bullets" element={element}>{children}</SemanticText>
  if (element.kind === 'footer') return <SemanticText role="footer" element={element}>{children}</SemanticText>
  if (element.kind === 'image' || element.kind === 'logo') return <ImageElement element={element} />
  if (element.kind === 'shape') return <ShapeElement element={element} />
  if (element.kind === 'stat') return <StatElement element={element} />
  if (element.kind === 'container') return <>{children}</>

  return (
    <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
      Unknown component: {element.sourceType || 'node'}
    </div>
  )
}

export function SlideHtmlRenderer({
  slide,
  theme,
  onAction,
}: {
  slide: SlideModel
  theme: SlideThemeModel
  onAction?: (action: any) => void
}) {
  const preset = buildThemeVars(theme.name, theme.managers as AnyRecord, { headerTheme: theme.headerTheme })
  const cssVars = preset.cssVars || mapManagersToCssVars(theme.managers as AnyRecord)

  return (
    <ThemeProvider name={theme.name} cssVars={cssVars}>
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          boxSizing: 'border-box',
          ...cssVarsToStyle(cssVars),
        }}
      >
        {slide.elements.map((element) => (
          <RenderSlideHtmlElement key={element.id} element={element} onAction={onAction} />
        ))}
      </div>
    </ThemeProvider>
  )
}
