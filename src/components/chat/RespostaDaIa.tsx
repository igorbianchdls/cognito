"use client";

import React from 'react';
import type { UIMessage } from 'ai';
import { Response } from '@/components/ai-elements/response';
import { Reasoning, ReasoningTrigger, ReasoningContent } from '@/components/ai-elements/reasoning';
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { ToolInputStreaming } from '@/components/ai-elements/tool-input-streaming';
import { CodeBlock } from '@/components/ai-elements/code-block';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { Table as TableIcon } from 'lucide-react';
import FornecedorResult from '@/components/tools/workflow/FornecedorResult';
import WeatherResult from '@/components/tools/mcp/WeatherResult';
import ContasAPagarResult from '@/components/tools/ContasAPagarResult';
import ContasAReceberResult from '@/components/tools/ContasAReceberResult';
import PedidosVendasResult from '@/components/tools/vendas-b2b/PedidosVendasResult';
import PedidosCompraResult from '@/components/tools/compras/PedidosCompraResult';
import ContasFinanceirasResult from '@/components/tools/financeiro/ContasFinanceirasResult';
import CategoriasDespesaResult from '@/components/tools/financeiro/CategoriasDespesaResult';
import CategoriasReceitaResult from '@/components/tools/financeiro/CategoriasReceitaResult';
import CriarCentroCustoResult from '@/components/tools/financeiro/CriarCentroCustoResult';
import CriarClienteResult from '@/components/tools/workflow/CriarClienteResult';
import CriarFornecedorResult from '@/components/tools/workflow/CriarFornecedorResult';

type Props = { message: UIMessage };

export default function RespostaDaIa({ message }: Props) {
  const parts = message.parts || [];
  const hasAnything = parts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="max-w-[720px] w-full">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-[11px] leading-none">IA</span>
          <span className="font-semibold text-gray-900 text-[16px]">Claude</span>
        </div>
        {parts.map((part, index) => {
          if (part.type === 'reasoning') {
            const txt = (part as any).content || (part as any).text || '';
            const isStreaming = (part as any).state === 'streaming';
            if (!txt) return null;
            return (
              <Reasoning key={`think-${index}`} isStreaming={isStreaming}>
                <ReasoningTrigger />
                <ReasoningContent>{txt}</ReasoningContent>
              </Reasoning>
            );
          }
          // Tool UI part (generic + special cases)
          if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
            const state = (part as any).state as 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | undefined;
            const input = (part as any).input;
            const inputStream = (part as any).inputStream as string | undefined;
            const output = (part as any).output;
            const errorText = (part as any).errorText as string | undefined;
            const toolType = (part as any).type as string;
            // Special render: buscarFornecedor (Skill HTTP) or MCP buscar_fornecedor → ArtifactDataTable
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isFornecedor = normalized === 'buscarFornecedor' || normalized === 'buscar_fornecedor' || /buscar.*fornecedor/i.test(normalized);
              if (isFornecedor && (state === 'output-available' || state === 'output-error') && output) {
                // Unwrap possible MCP content shape: { content: [{ type:'json', json: {...} } | { type:'text', text: '...' } ...] }
                let result: any = output as any;
                try {
                  if (result && typeof result === 'object' && 'result' in result) {
                    result = (result as any).result;
                  } else {
                    let arr: Array<any> | null = null;
                    if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                      arr = (result as any).content as Array<any>;
                    } else if (Array.isArray(result)) {
                      arr = result as Array<any>;
                    }
                    if (arr) {
                      // Prefer JSON-like entries; otherwise parse any text entries that are JSON
                      const jsonPart = arr.find((c) => c && (c.json !== undefined));
                      if (jsonPart && jsonPart.json !== undefined) {
                        result = jsonPart.json;
                      } else {
                        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                        let parsed: any = undefined;
                        for (const t of textParts) {
                          const s = t.trim();
                          if (!s) continue;
                          try { const p = JSON.parse(s); parsed = p; break; } catch { /* continue */ }
                        }
                        if (parsed !== undefined) result = parsed;
                      }
                    }
                  }
                } catch { /* ignore */ }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <FornecedorResult result={result} />
                  </div>
                );
              }
            }
            // Special render: criar_centro_custo → CriarCentroCustoResult (form + commit)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateCC = /criar.*centro.*custo/i.test(normalized);
              if (isCreateCC && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <CriarCentroCustoResult result={result as any} />
                  </div>
                );
              }
            }
            // Special render: get_contas_financeiras
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCF = /get[_-]?contas[_-]?financeiras/i.test(normalized);
              if (isCF && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ContasFinanceirasResult result={result} />
                  </div>
                );
              }
            }
            // Special render: criar_cliente → CriarClienteResult (form + commit)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateClient = normalized === 'criar_cliente' || normalized === 'criarCliente' || normalized.endsWith('__criar_cliente') || /criar[_-]?cliente/i.test(normalized);
              if (isCreateClient && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <CriarClienteResult result={result as any} />
                  </div>
                );
              }
            }
            // Special render: criar_fornecedor → CriarFornecedorResult (form + commit)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateSupplier = normalized === 'criar_fornecedor' || normalized === 'criarFornecedor' || normalized.endsWith('__criar_fornecedor') || /criar[_-]?fornecedor/i.test(normalized);
              if (isCreateSupplier && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <CriarFornecedorResult result={result as any} />
                  </div>
                );
              }
            }
            // Special render: get_categorias_despesa
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCD = /get[_-]?categorias[_-]?despesa/i.test(normalized);
              if (isCD && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <CategoriasDespesaResult result={result} />
                  </div>
                );
              }
            }
            // Special render: get_categorias_receita
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCR = /get[_-]?categorias[_-]?receita/i.test(normalized);
              if (isCR && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                try {
                  if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                    const arr = (result as any).content as Array<any>;
                    const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                    for (const t of textParts) { const s = t.trim(); if (!s) continue; try { result = JSON.parse(s); break; } catch {} }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <CategoriasReceitaResult result={result} />
                  </div>
                );
              }
            }
            // Special render: get_vendas / getVendas → PedidosVendasResult
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isVendas = normalized === 'get_vendas' || normalized === 'getVendas' || normalized.endsWith('__get_vendas') || /get[_-]?vendas/i.test(normalized);
              if (isVendas && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = output as any;
                try {
                  if (result && typeof result === 'object' && 'result' in result) {
                    result = (result as any).result;
                  } else {
                    let arr: Array<any> | null = null;
                    if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                      arr = (result as any).content as Array<any>;
                    } else if (Array.isArray(result)) {
                      arr = result as Array<any>;
                    }
                    if (arr) {
                      const jsonPart = arr.find((c) => c && (c.json !== undefined));
                      if (jsonPart && jsonPart.json !== undefined) {
                        result = jsonPart.json;
                      } else {
                        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                        for (const t of textParts) {
                          const s = t.trim();
                          if (!s) continue;
                          try { result = JSON.parse(s); break; } catch {}
                        }
                      }
                    }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <PedidosVendasResult success={!!result?.success} message={String(result?.message || '')} rows={Array.isArray(result?.rows) ? result.rows : []} count={typeof result?.count === 'number' ? result.count : undefined} sql_query={typeof result?.sql_query === 'string' ? result.sql_query : undefined} />
                  </div>
                );
              }
            }
            // Special render: get_compras / getCompras → PedidosCompraResult
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCompras = normalized === 'get_compras' || normalized === 'getCompras' || normalized.endsWith('__get_compras') || /get[_-]?compras/i.test(normalized);
              if (isCompras && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = output as any;
                try {
                  if (result && typeof result === 'object' && 'result' in result) {
                    result = (result as any).result;
                  } else {
                    let arr: Array<any> | null = null;
                    if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                      arr = (result as any).content as Array<any>;
                    } else if (Array.isArray(result)) {
                      arr = result as Array<any>;
                    }
                    if (arr) {
                      const jsonPart = arr.find((c) => c && (c.json !== undefined));
                      if (jsonPart && jsonPart.json !== undefined) {
                        result = jsonPart.json;
                      } else {
                        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                        for (const t of textParts) {
                          const s = t.trim();
                          if (!s) continue;
                          try { result = JSON.parse(s); break; } catch {}
                        }
                      }
                    }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <PedidosCompraResult success={!!result?.success} message={String(result?.message || '')} rows={Array.isArray(result?.rows) ? result.rows : []} count={typeof result?.count === 'number' ? result.count : undefined} sql_query={typeof result?.sql_query === 'string' ? result.sql_query : undefined} title={typeof result?.title === 'string' ? result.title : undefined} />
                  </div>
                );
              }
            }
            // Special render: MCP get_weather → WeatherResult UI
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isWeather = normalized === 'get_weather' || normalized.endsWith('__get_weather') || normalized.includes('get_weather');
              if (isWeather && (state === 'output-available' || state === 'output-error') && output) {
                const result = (output && (output.result !== undefined ? output.result : output)) as any;
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <WeatherResult output={result} input={input} />
                  </div>
                );
              }
            }
            // Special render: get_contas_pagar / getContasPagar → ContasAPagarResult
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isAP = normalized === 'get_contas_pagar' || normalized === 'getContasPagar' || normalized.endsWith('__get_contas_pagar') || /get[_-]?contas[_-]?pagar/i.test(normalized);
              if (isAP && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = output as any;
                try {
                  if (result && typeof result === 'object' && 'result' in result) {
                    result = (result as any).result;
                  } else {
                    let arr: Array<any> | null = null;
                    if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                      arr = (result as any).content as Array<any>;
                    } else if (Array.isArray(result)) {
                      arr = result as Array<any>;
                    }
                    if (arr) {
                      const jsonPart = arr.find((c) => c && (c.json !== undefined));
                      if (jsonPart && jsonPart.json !== undefined) {
                        result = jsonPart.json;
                      } else {
                        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                        for (const t of textParts) {
                          const s = t.trim();
                          if (!s) continue;
                          try { result = JSON.parse(s); break; } catch {}
                        }
                      }
                    }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ContasAPagarResult result={result} />
                  </div>
                );
              }
            }
            // Special render: get_contas_receber / getContasReceber → ContasAReceberResult
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isAR = normalized === 'get_contas_receber' || normalized === 'getContasReceber' || normalized.endsWith('__get_contas_receber') || /get[_-]?contas[_-]?receber/i.test(normalized);
              if (isAR && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = output as any;
                try {
                  if (result && typeof result === 'object' && 'result' in result) {
                    result = (result as any).result;
                  } else {
                    let arr: Array<any> | null = null;
                    if (result && typeof result === 'object' && 'content' in (result as any) && Array.isArray((result as any).content)) {
                      arr = (result as any).content as Array<any>;
                    } else if (Array.isArray(result)) {
                      arr = result as Array<any>;
                    }
                    if (arr) {
                      const jsonPart = arr.find((c) => c && (c.json !== undefined));
                      if (jsonPart && jsonPart.json !== undefined) {
                        result = jsonPart.json;
                      } else {
                        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                        for (const t of textParts) {
                          const s = t.trim();
                          if (!s) continue;
                          try { result = JSON.parse(s); break; } catch {}
                        }
                      }
                    }
                  }
                } catch {}
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ContasAReceberResult result={result} />
                  </div>
                );
              }
            }
            // Generic fallback: if output has rows[], render dynamic table
            if ((state === 'output-available') && output && typeof output === 'object') {
              let res: any = (output as any).result !== undefined ? (output as any).result : output;
              try {
                if (res && typeof res === 'object' && 'content' in (res as any) && Array.isArray((res as any).content)) {
                  const arr = (res as any).content as Array<any>;
                  const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text));
                  for (const t of textParts) { const s = t.trim(); if (!s) continue; try { const parsed = JSON.parse(s); if (parsed) res = parsed; break; } catch {} }
                }
              } catch {}
              if (res && Array.isArray(res.rows)) {
                const rows = res.rows as Array<Record<string, unknown>>;
                const cols: ColumnDef<Record<string, unknown>>[] = [];
                if (rows.length > 0) {
                  const keys = Object.keys(rows[0]);
                  for (const k of keys) cols.push({ accessorKey: k, header: k } as any);
                }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ArtifactDataTable
                      data={rows}
                      columns={cols}
                      title={String(res.title || (toolType || 'Resultado'))}
                      icon={TableIcon}
                      iconColor="text-slate-700"
                      message={String(res.message || `${rows.length} registros`)}
                      success={res.success === undefined ? true : Boolean(res.success)}
                      count={typeof res.count === 'number' ? res.count : rows.length}
                      exportFileName="tool_result"
                      sqlQuery={typeof res.sql_query === 'string' ? res.sql_query : undefined}
                    />
                  </div>
                );
              }
            }
            return (
              <Tool key={`tool-${index}`} defaultOpen>
                <ToolHeader type={(part as any).type} state={(state as any) || 'input-streaming'} />
                <ToolContent>
                  {state === 'input-streaming' && (
                    <ToolInputStreaming input={inputStream || input || ''} isStreaming />
                  )}
                  {/* Show input JSON when available or after completion */}
                  {(state !== 'input-streaming') && input && (
                    <ToolInput input={input} />
                  )}
                  {(state === 'output-available' || state === 'output-error') && (
                    <ToolOutput
                      output={output !== undefined ? (
                        <CodeBlock code={typeof output === 'string' ? output : JSON.stringify(output, null, 2)} language="json" />
                      ) : null}
                      errorText={errorText}
                    />
                  )}
                </ToolContent>
              </Tool>
            );
          }
          if (part.type === 'text') {
            const txt = (part as any).text || '';
            if (!txt) return null;
            return (
              <div key={`resp-${index}`} className="text-[15px] leading-6">
                <Response options={{}}>{txt}</Response>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
