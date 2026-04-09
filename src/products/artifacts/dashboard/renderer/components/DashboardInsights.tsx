'use client'

import * as React from 'react'

import {
  InsightsEditorModal,
  type EditableInsightItem,
  type InsightSchedule,
} from '@/products/artifacts/dashboard/editors/insights/InsightsEditorModal'
import { EditableComponentOverlay } from '@/products/artifacts/dashboard/editors/shared/EditableComponentOverlay'
import {
  resolveDashboardInsightsTheme,
  useDashboardThemeSelection,
} from '@/products/artifacts/dashboard/renderer/dashboardThemeConfig'

type AnyRecord = Record<string, any>

function resolveInsightSchedule(input: unknown): InsightSchedule {
  const record = input && typeof input === 'object' ? input as AnyRecord : {}
  return {
    frequency:
      record.frequency === 'daily' || record.frequency === 'weekly' || record.frequency === 'no_repeat'
        ? record.frequency
        : 'no_repeat',
    date: typeof record.date === 'string' ? record.date : '',
    time: typeof record.time === 'string' ? record.time : '',
  }
}

function buildPlaceholderInsightItems(prompt: string, schedule: InsightSchedule): EditableInsightItem[] {
  const normalizedPrompt = prompt.trim()
  const promptPreview = normalizedPrompt
    ? normalizedPrompt.length > 120
      ? `${normalizedPrompt.slice(0, 117)}...`
      : normalizedPrompt
    : 'Defina um prompt para orientar a geracao futura dos insights.'

  const scheduleSummary =
    schedule.frequency === 'no_repeat' && !schedule.date && !schedule.time
      ? 'Sem schedule definido. O bloco permanece com placeholders ate existir execucao automatica.'
      : `Schedule configurado como ${schedule.frequency}${schedule.date ? ` em ${schedule.date}` : ''}${schedule.time ? ` as ${schedule.time}` : ''}.`

  return [
    {
      title: 'Prompt configurado',
      text: promptPreview,
    },
    {
      title: 'Placeholder local',
      text: 'Os itens reais deste bloco devem vir da IA. Enquanto isso, a interface mostra placeholders gerados localmente.',
    },
    {
      title: 'Agendamento',
      text: scheduleSummary,
    },
  ]
}

export default function DashboardInsights({ element }: { element: any }) {
  const props = (element?.props || {}) as AnyRecord
  const { appearanceOverrides, themeName } = useDashboardThemeSelection()
  const theme = resolveDashboardInsightsTheme(themeName, appearanceOverrides)
  const propPrompt = typeof props.prompt === 'string' ? props.prompt : ''
  const propSchedule = React.useMemo(() => resolveInsightSchedule(props.schedule), [props.schedule])
  const propItems = React.useMemo<EditableInsightItem[]>(
    () => (Array.isArray(props.items) ? props.items : [])
      .map((item) => {
        const record = item && typeof item === 'object' ? item as AnyRecord : {}
        return {
          title: typeof record.title === 'string' ? record.title : '',
          text: typeof record.text === 'string' ? record.text : '',
        }
      })
      .filter((item) => item.title || item.text),
    [props.items],
  )
  const itemsSignature = React.useMemo(() => JSON.stringify(propItems), [propItems])
  const [prompt, setPrompt] = React.useState(propPrompt)
  const [schedule, setSchedule] = React.useState<InsightSchedule>(propSchedule)
  const placeholderItems = React.useMemo(() => buildPlaceholderInsightItems(prompt, schedule), [prompt, schedule])
  const items = propItems.length > 0 ? propItems : placeholderItems
  const [openItems, setOpenItems] = React.useState<Record<number, boolean>>({})
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const containerStyle = props.containerStyle && typeof props.containerStyle === 'object'
    ? props.containerStyle as React.CSSProperties
    : undefined
  const itemStyle = props.itemStyle && typeof props.itemStyle === 'object'
    ? props.itemStyle as React.CSSProperties
    : undefined
  const textStyle = props.textStyle && typeof props.textStyle === 'object'
    ? props.textStyle as React.CSSProperties
    : undefined
  const iconStyle = props.iconStyle && typeof props.iconStyle === 'object'
    ? props.iconStyle as React.CSSProperties
    : undefined
  const gap = typeof props.gap === 'number' ? props.gap : 12
  const itemGap = typeof props.itemGap === 'number' ? props.itemGap : 12
  const showDividers = props.showDividers === true
  const dividerColor = typeof props.dividerColor === 'string' ? props.dividerColor : theme.dividerColor
  const markerColor = typeof iconStyle?.backgroundColor === 'string'
    ? iconStyle.backgroundColor
    : typeof iconStyle?.color === 'string'
      ? iconStyle.color
      : typeof theme.iconStyle.backgroundColor === 'string'
        ? theme.iconStyle.backgroundColor
        : '#2563eb'

  React.useEffect(() => {
    setPrompt(propPrompt)
  }, [propPrompt])

  React.useEffect(() => {
    setSchedule(propSchedule)
    setOpenItems({})
  }, [itemsSignature, propItems, propSchedule])

  return (
    <>
      <EditableComponentOverlay onEdit={() => setIsEditorOpen(true)} forceVisible={isEditorOpen}>
        <div
          data-insights-prompt={prompt || undefined}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap,
            minWidth: 0,
            ...theme.containerStyle,
            ...containerStyle,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, index) => {
              const itemTitle = typeof item.title === 'string' ? item.title : ''
              const text = typeof item.text === 'string' ? item.text : ''
              const isExpandable = Boolean(itemTitle && text)
              const isOpen = openItems[index] === true
              if (!text && !itemTitle) return null
              return (
                <div
                  key={`${itemTitle || text}-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '8px 0',
                    borderTop: showDividers && index > 0 ? `1px solid ${dividerColor}` : undefined,
                    ...theme.itemStyle,
                    ...itemStyle,
                  }}
                >
                  {isExpandable ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }))
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: itemGap,
                          width: '100%',
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div
                          style={{
                            width: 0,
                            height: 0,
                            flex: '0 0 auto',
                            marginTop: 5,
                            borderTop: '5px solid transparent',
                            borderBottom: '5px solid transparent',
                            borderLeft: `8px solid ${markerColor}`,
                            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transformOrigin: '35% 50%',
                            transition: 'transform 160ms ease',
                          }}
                        />
                        <p
                          style={{
                            margin: 0,
                            ...theme.titleStyle,
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
                            ...theme.textStyle,
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
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: itemGap,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          flex: '0 0 auto',
                          marginTop: 8,
                          ...theme.iconStyle,
                          backgroundColor: markerColor,
                        }}
                      />
                      <p
                        style={{
                          margin: 0,
                          ...theme.textStyle,
                          ...textStyle,
                        }}
                      >
                        {text}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </EditableComponentOverlay>

      <InsightsEditorModal
        isOpen={isEditorOpen}
        initialPrompt={prompt}
        initialSchedule={schedule}
        onClose={() => setIsEditorOpen(false)}
        onSave={(value) => {
          setPrompt(value.prompt)
          setSchedule(value.schedule)
          setOpenItems({})
          setIsEditorOpen(false)
        }}
      />
    </>
  )
}
