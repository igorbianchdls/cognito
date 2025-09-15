'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, FormEvent } from 'react'
import type { DroppedWidget } from '@/types/apps/droppedWidget'
import WidgetsTable from './tools/WidgetsTable'
import AICodeExecutor from './AICodeExecutor'
import TablesListCustom from './tools/TablesListCustom'
import TableSchemaCustom from './tools/TableSchemaCustom'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Response } from '@/components/ai-elements/response'
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning'
// import { widgetActions } from '@/stores/apps/widgetStore' // REMOVED: Only KPIs supported now
import { kpiActions } from '@/stores/apps/kpiStore'
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { MicIcon, GlobeIcon } from 'lucide-react'

interface ChatPanelProps {
  droppedWidgets: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

interface ReasoningPart {
  type: 'reasoning';
  state: 'streaming' | 'complete';
  content?: string;
  text?: string;
}

interface JsonWidget {
  i: string
  name?: string
  type?: string
  position?: { x: number; y: number }
  size?: { w: number; h: number }
  style?: { color?: string }
  icon?: string
  description?: string
  id?: string
}

interface ActionData {
  action: 'update' | 'move' | 'resize' | 'delete' | 'add'
  widgetId?: string
  changes?: Partial<DroppedWidget>
}

interface ActionFormat {
  action?: string
  widgetId?: string
  changes?: Partial<DroppedWidget>
  actions?: ActionData[]
}

interface LegacyFormat {
  widgets: JsonWidget[]
  meta?: {
    title?: string
    created?: string
    totalWidgets?: number
  }
}

// Function to remove JSON tags from display text
const removeJsonTags = (text: string) => {
  return text.replace(/<json>[\s\S]*?<\/json>/g, '')
}

// Function to parse and apply JSON from AI messages
const parseAndApplyJson = (text: string) => {
  const jsonRegex = /<json>([\s\S]*?)<\/json>/g
  const matches = [...text.matchAll(jsonRegex)]
  
  matches.forEach((match) => {
    try {
      const jsonString = match[1].trim()
      const parsed = JSON.parse(jsonString)
      
      // Check if it's the new action format
      if (parsed.action || parsed.actions) {
        handleActionFormat(parsed)
      }
      // Fallback to old format (complete widgets array)
      else if (parsed && parsed.widgets && Array.isArray(parsed.widgets)) {
        handleLegacyFormat(parsed)
      }
    } catch {
      // JSON parsing failed - ignore
    }
  })
}

// Handle new action-based format
const handleActionFormat = (parsed: ActionFormat) => {
  if (parsed.actions && Array.isArray(parsed.actions)) {
    parsed.actions.forEach((actionData: ActionData) => {
      executeAction(actionData)
    })
  } else if (parsed.action) {
    executeAction(parsed as ActionData)
  }
}

// Execute a single action
const executeAction = (actionData: ActionData) => {
  const { action, widgetId, changes } = actionData
  
  // Map property names for backward compatibility
  const mappedChanges = changes ? { ...changes } : {}
  if ('height' in mappedChanges) {
    mappedChanges.h = mappedChanges.height as number
    delete mappedChanges.height
  }
  if ('width' in mappedChanges) {
    mappedChanges.w = mappedChanges.width as number
    delete mappedChanges.width
  }
  
  switch (action) {
    case 'update':
    case 'move':
    case 'resize':
      if (widgetId && mappedChanges) {
        // Note: Only KPIs supported now - widget editing handled via KPIConfigEditor
        console.log('Widget editing via chat not supported - use KPI editor instead')
      }
      break
      
    case 'delete':
      if (widgetId) {
        // Note: Only KPIs supported now
        kpiActions.removeKPI(widgetId)
      }
      break
      
    case 'add':
      if (mappedChanges) {
        // Transform to DroppedWidget format
        const newWidget: DroppedWidget = {
          id: mappedChanges.id || mappedChanges.i || `widget-${Date.now()}`,
          i: mappedChanges.i || `widget-${Date.now()}`,
          name: mappedChanges.name || 'New Widget',
          type: mappedChanges.type || 'chart',
          icon: mappedChanges.icon || '📊',
          description: mappedChanges.description || '',
          defaultWidth: mappedChanges.w || 2,
          defaultHeight: mappedChanges.h || 2,
          x: mappedChanges.x || 0,
          y: mappedChanges.y || 0,
          w: mappedChanges.w || 2,
          h: mappedChanges.h || 2,
          color: mappedChanges.color || '#3B82F6'
        }
        // Note: Only KPIs supported now
        if (newWidget.type === 'kpi') {
          kpiActions.addKPI({
            name: newWidget.name,
            icon: newWidget.icon,
            description: newWidget.description,
            config: newWidget.config?.kpiConfig || newWidget.kpiConfig,
            position: { x: newWidget.x, y: newWidget.y },
            size: { w: newWidget.w, h: newWidget.h }
          })
        }
      }
      break
  }
}

// Handle legacy format (complete widgets array)
const handleLegacyFormat = (parsed: LegacyFormat) => {
  // Transform JSON widgets to DroppedWidget format
  parsed.widgets.map((widget: JsonWidget, index: number) => {
    const transformedWidget = {
      id: widget.id || widget.i,
      i: widget.i || `widget-${Date.now()}-${index}`,
      name: widget.name || 'Unnamed Widget',
      type: widget.type || 'chart',
      icon: widget.icon || '📊',
      description: widget.description || '',
      defaultWidth: widget.size?.w || 2,
      defaultHeight: widget.size?.h || 2,
      x: widget.position?.x || 0,
      y: widget.position?.y || 0,
      w: widget.size?.w || 2,
      h: widget.size?.h || 2,
      color: widget.style?.color || '#3B82F6'
    }
    return transformedWidget
  })
  
  // Apply changes to canvas - Note: Only KPIs supported now
  // widgetActions.setWidgets(newWidgets) // REMOVED: Chat-based widget management not supported
  console.log('Chat-based widget management not supported - use KPI builder instead')
}

export default function ChatPanel({ droppedWidgets, onEditWidget }: ChatPanelProps) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/appschat',
      body: { widgets: droppedWidgets, onEditWidget }
    }),
    onFinish: ({ message }) => {
      // Parse JSON immediately when message is finished
      message.parts?.forEach((part) => {
        if (part.type === 'text') {
          parseAndApplyJson(part.text)
        }
      })
    },
    onError: () => {
      // Chat error occurred
    }
  })

  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      try {
        sendMessage({ text: input })
        setInput('')
      } catch {
        // Message sending failed
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-scroll space-y-4 custom-scrollbar min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`p-3 text-sm ${
                message.role === 'user'
                  ? 'max-w-[80%] bg-black rounded-lg text-white'
                  : 'w-full bg-transparent text-gray-700'
              }`}
            >
              <div>
                {message.parts?.map((part, index) => {
                  if (part.type === 'text') {
                    const cleanText = removeJsonTags(part.text)
                    return (
                      <Response key={index}>
                        {cleanText}
                      </Response>
                    )
                  }

                  if (part.type === 'reasoning') {
                    const reasoningText = (part as ReasoningPart).content || (part as ReasoningPart).text || '';
                    return (
                      <Reasoning key={index} isStreaming={part.state === 'streaming'}>
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoningText}</ReasoningContent>
                      </Reasoning>
                    );
                  }
                  
                  if (part.type === 'tool-getCanvasWidgets') {
                    const widgetTool = part as {
                      state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
                      input?: Record<string, unknown>
                      output: {
                        widgets: Array<{
                          id: string
                          widgetId: string
                          name: string
                          type: string
                          position: { x: number; y: number }
                          size: { width: number; height: number }
                          description: string
                          icon: string
                        }>
                        totalWidgets: number
                        summary: string
                        success: boolean
                      }
                      errorText?: string
                    }
                    const shouldBeOpen = widgetTool.state === 'output-available' || widgetTool.state === 'output-error'
                    
                    return (
                      <div key={index}>
                        <Tool defaultOpen={shouldBeOpen}>
                          <ToolHeader type="tool-getCanvasWidgets" state={widgetTool.state} />
                          <ToolContent>
                            {widgetTool.input && (
                              <ToolInput input={widgetTool.input} />
                            )}
                            {widgetTool.state === 'output-error' && (
                              <ToolOutput 
                                output={null}
                                errorText={widgetTool.errorText}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                        {widgetTool.state === 'output-available' && (
                          <WidgetsTable
                            summary={widgetTool.output.summary}
                            success={widgetTool.output.success}
                          />
                        )}
                      </div>
                    )
                  }

                  // Handle manageWidgets tool calls
                  if (part.type === 'tool-manageWidgets') {
                    const manageTool = part as {
                      state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
                      input?: Record<string, unknown>
                      output: {
                        success: boolean
                        operations: Array<{
                          action: 'create' | 'update'
                          type?: 'kpi' | 'chart' | 'table'
                          [key: string]: unknown
                        }>
                        message: string
                        totalOperations: number
                        created: number
                        updated: number
                      }
                      errorText?: string
                    }
                    const shouldBeOpen = manageTool.state === 'output-available' || manageTool.state === 'output-error'

                    return (
                      <div key={index}>
                        <Tool defaultOpen={shouldBeOpen}>
                          <ToolHeader type="tool-manageWidgets" state={manageTool.state} />
                          <ToolContent>
                            {manageTool.input && (
                              <ToolInput input={manageTool.input} />
                            )}
                            {manageTool.state === 'output-error' && (
                              <ToolOutput
                                output={null}
                                errorText={manageTool.errorText}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                        {manageTool.state === 'output-available' && manageTool.output.success && manageTool.output.operations && (
                          <AICodeExecutor operations={manageTool.output.operations} />
                        )}
                      </div>
                    )
                  }

                  // Handle getTables tool calls
                  if (part.type === 'tool-getTables') {
                    const tablesTool = part as {
                      state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
                      input?: Record<string, unknown>
                      output: {
                        tables: Array<{
                          tableId: string
                          type: string
                          numRows: string
                          numBytes: string
                          creationTime: string
                          lastModifiedTime: string
                          description?: string
                        }>
                        datasetId: string
                        success: boolean
                        error?: string
                      }
                      errorText?: string
                    }
                    const shouldBeOpen = tablesTool.state === 'output-available' || tablesTool.state === 'output-error'

                    return (
                      <div key={index}>
                        <Tool defaultOpen={shouldBeOpen}>
                          <ToolHeader type="tool-getTables" state={tablesTool.state} />
                          <ToolContent>
                            {tablesTool.input && (
                              <ToolInput input={tablesTool.input} />
                            )}
                            {tablesTool.state === 'output-error' && (
                              <ToolOutput
                                output={null}
                                errorText={tablesTool.errorText}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                        {tablesTool.state === 'output-available' && (
                          <TablesListCustom
                            tables={tablesTool.output.tables?.map(table => ({
                              tableId: table.tableId,
                              numBytes: parseInt(table.numBytes) || 0
                            }))}
                            datasetId={tablesTool.output.datasetId}
                            success={tablesTool.output.success}
                            error={tablesTool.output.error}
                          />
                        )}
                      </div>
                    )
                  }

                  // Handle getTableSchema tool calls
                  if (part.type === 'tool-getTableSchema') {
                    const schemaTool = part as {
                      state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
                      input?: Record<string, unknown>
                      output: {
                        columns: Array<{
                          column_name: string
                          data_type: string
                        }>
                        success: boolean
                        tableName: string
                        datasetId: string
                        projectId: string
                        totalColumns: number
                        error?: string
                      }
                      errorText?: string
                    }
                    const shouldBeOpen = schemaTool.state === 'output-available' || schemaTool.state === 'output-error'

                    return (
                      <div key={index}>
                        <Tool defaultOpen={shouldBeOpen}>
                          <ToolHeader type="tool-getTableSchema" state={schemaTool.state} />
                          <ToolContent>
                            {schemaTool.input && (
                              <ToolInput input={schemaTool.input} />
                            )}
                            {schemaTool.state === 'output-error' && (
                              <ToolOutput
                                output={null}
                                errorText={schemaTool.errorText}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                        {schemaTool.state === 'output-available' && (
                          <TableSchemaCustom
                            columns={schemaTool.output.columns}
                            tableName={schemaTool.output.tableName}
                            success={schemaTool.output.success}
                            error={schemaTool.output.error}
                            totalColumns={schemaTool.output.totalColumns}
                          />
                        )}
                      </div>
                    )
                  }

                  
                  return null
                })}
              </div>
            </div>
          </div>
        ))}
        
        {status !== 'ready' && (
          <div className="flex justify-start">
            <div className="bg-transparent p-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 flex-shrink-0" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={status !== 'ready'}
          />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputButton>
                <MicIcon size={16} />
              </PromptInputButton>
              <PromptInputButton>
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input.trim() || status !== 'ready'}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}