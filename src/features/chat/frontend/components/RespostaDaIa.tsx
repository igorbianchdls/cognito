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
import ToolListResult from '@/components/tools/generic/ToolListResult';
import WeatherResult from '@/components/tools/mcp/WeatherResult';
import ContasAPagarResult from '@/components/tools/ContasAPagarResult';
import ContasAReceberResult from '@/components/tools/ContasAReceberResult';
import PedidosVendasResult from '@/components/tools/vendas-b2b/PedidosVendasResult';
import PedidosCompraResult from '@/components/tools/compras/PedidosCompraResult';
import ContasFinanceirasResult from '@/components/tools/financeiro/ContasFinanceirasResult';
import CategoriasDespesaResult from '@/components/tools/financeiro/CategoriasDespesaResult';
import CategoriasReceitaResult from '@/components/tools/financeiro/CategoriasReceitaResult';
import ComposioGmailEmailsResult from '@/components/tools/mcp/ComposioGmailEmailsResult';
// import CriarCentroCustoResult from '@/components/tools/financeiro/CriarCentroCustoResult';
// Removed per request: do not render green client card
// import CriarClienteResult from '@/components/tools/workflow/CriarClienteResult';
import ToolCreateInputCard from '@/components/tools/workflow/ToolCreateInputCard';
import ToolDeleteInputCard from '@/components/tools/workflow/ToolDeleteInputCard';
// Removed dedicated supplier card for create flow
// import CriarFornecedorResult from '@/components/tools/workflow/CriarFornecedorResult';

type Props = { message: UIMessage };

export default function RespostaDaIa({ message }: Props) {
  const parts = message.parts || [];
  const hasAnything = parts.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="w-full flex justify-start py-3">
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-blue-500 text-white text-[10px] leading-none shadow-sm ml-0.5">OT</span>
          <span className="font-semibold text-gray-900 text-[16px]">Otto</span>
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
            // Special render: Composio Gmail fetch emails → ArtifactDataTable
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const lower = normalized.toLowerCase();
              const isComposioGmailFetch = lower.includes('mcp__composio__gmail_fetch_emails') || /gmail[_-]?fetch[_-]?emails/i.test(lower);
              if (isComposioGmailFetch) {
                if (state === 'output-error') {
                  return (
                    <Tool key={`tool-${index}`}>
                      <ToolHeader type={'tool-gmail_fetch_emails'} state={'output-error'} />
                      <ToolContent>
                        <ToolOutput output={null} errorText={errorText || 'Erro ao buscar emails'} />
                      </ToolContent>
                    </Tool>
                  );
                }
                if (state === 'output-available') {
                  return (
                    <div key={`tool-${index}`} className="mb-3">
                      <ComposioGmailEmailsResult output={output} />
                    </div>
                  );
                }
              }
            }
            // Special render: MCP list-like outputs (listar/crud listar/workspace GET request) → ArtifactDataTable
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              // Detect CRUD with action 'listar' and workspace read requests
              let actionForCheck: string | undefined = undefined;
              let methodForCheck: string | undefined = undefined;
              let resourceForCheck: string | undefined = undefined;
              let hasDataPayloadForCheck = false;
              let candidateForCheck: any = undefined;
              try {
                let candidate: any = input;
                if (candidate && typeof candidate === 'object') {
                  const o: any = candidate;
                  if (o && (o.tool || o.name)) candidate = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                } else if (!candidate && (typeof (part as any).inputStream === 'string')) {
                  const s = ((part as any).inputStream as string).trim();
                  if (s) { try { candidate = JSON.parse(s) } catch { /* ignore */ } }
                }
                candidateForCheck = candidate;
                if (candidate && typeof candidate === 'object' && typeof (candidate as any).action === 'string') {
                  actionForCheck = String((candidate as any).action).toLowerCase();
                }
                if (candidate && typeof candidate === 'object' && typeof (candidate as any).method === 'string') {
                  methodForCheck = String((candidate as any).method).toUpperCase();
                }
                if (candidate && typeof candidate === 'object') {
                  if (typeof (candidate as any).resource === 'string') resourceForCheck = String((candidate as any).resource);
                  else if (typeof (candidate as any).path === 'string') resourceForCheck = String((candidate as any).path);
                }
                if (candidate && typeof candidate === 'object' && (candidate as any).data !== undefined) {
                  const dataValue = (candidate as any).data;
                  if (dataValue && typeof dataValue === 'object') {
                    hasDataPayloadForCheck = Array.isArray(dataValue) ? dataValue.length > 0 : Object.keys(dataValue).length > 0;
                  } else {
                    hasDataPayloadForCheck = dataValue !== null && dataValue !== '';
                  }
                }
              } catch {}
              const isCrudList = (normalized === 'crud' || /__crud$/i.test(normalized)) && actionForCheck === 'listar';
              const isWorkspaceTool = normalized === 'workspace' || /__workspace$/i.test(normalized);
              const isWorkspaceRequest = actionForCheck === undefined || actionForCheck === 'request';
              const isWorkspaceReadMethod = methodForCheck === undefined || methodForCheck === 'GET';
              const cleanResourceForCheck = String(resourceForCheck || '').replace(/^\/+|\/+$/g, '').toLowerCase();
              const isWorkspaceListResource =
                /^email\/inboxes$/.test(cleanResourceForCheck) ||
                /^email\/messages$/.test(cleanResourceForCheck) ||
                /^drive$/.test(cleanResourceForCheck) ||
                /^drive\/folders\/[^/]+$/.test(cleanResourceForCheck);
              const isWorkspaceGet = isWorkspaceTool && isWorkspaceRequest && isWorkspaceReadMethod && !hasDataPayloadForCheck && isWorkspaceListResource;
              const isGenericList = normalized === 'listar' || /__listar$/i.test(normalized) || isCrudList || isWorkspaceGet;
              if (isGenericList && (state === 'output-available' || state === 'output-error') && output) {
                // Unwrap possible wrapped input (skill wrapper)
                let inputForDisplay: any = candidateForCheck ?? input;
                try {
                  if (input && typeof input === 'object') {
                    const o: any = input as any;
                    if (o && (o.tool || o.name)) inputForDisplay = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                  }
                } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) {
                  const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } }
                }
                // Build dynamic header label: action + '_' + last segment of resource
                let headerType: `tool-${string}` = ((part as any).type as `tool-${string}`) || ('tool-generic' as `tool-${string}`);
                try {
                  const act = (inputForDisplay && typeof (inputForDisplay as any).action === 'string') ? String((inputForDisplay as any).action).toLowerCase() : undefined;
                  const method = (inputForDisplay && typeof (inputForDisplay as any).method === 'string') ? String((inputForDisplay as any).method).toLowerCase() : undefined;
                  const resRaw = (inputForDisplay && typeof (inputForDisplay as any).resource === 'string') ? String((inputForDisplay as any).resource) : (
                    (inputForDisplay && typeof (inputForDisplay as any).path === 'string') ? String((inputForDisplay as any).path) : undefined
                  );
                  const clean = String(resRaw || '').replace(/^\/+|\/+$/g, '').toLowerCase();
                  const toSafeToken = (value: string) => value.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                  const routeToken = (() => {
                    if (!clean) return '';
                    if (/^email\/inboxes$/.test(clean)) return 'inboxes';
                    if (/^email\/messages$/.test(clean)) return 'messages';
                    if (/^email\/messages\/[^/]+$/.test(clean)) return 'message_content';
                    if (/^email\/messages\/[^/]+\/attachments\/[^/]+$/.test(clean)) return 'attachment';
                    if (/^drive$/.test(clean)) return 'drive';
                    if (/^drive\/folders$/.test(clean)) return 'folders';
                    if (/^drive\/folders\/[^/]+$/.test(clean)) return 'folder';
                    if (/^drive\/files\/[^/]+$/.test(clean)) return 'file';
                    if (/^drive\/files\/[^/]+\/download$/.test(clean)) return 'file_download';
                    if (/^drive\/files\/prepare-upload$/.test(clean)) return 'prepare_upload';
                    if (/^drive\/files\/complete-upload$/.test(clean)) return 'complete_upload';
                    const partsSeg = clean.split('/').filter(Boolean);
                    const last = partsSeg[partsSeg.length - 1] || '';
                    const prev = partsSeg[partsSeg.length - 2] || '';
                    const looksDynamic = /[@=+]/.test(last) || /^[0-9a-f-]{16,}$/i.test(last) || last.length > 24;
                    return toSafeToken(looksDynamic ? prev : last);
                  })();
                  const isWorkspaceHeader = normalized === 'workspace' || /__workspace$/i.test(normalized);
                  const verb = act === 'request' ? (method || (isWorkspaceHeader ? 'get' : act)) : act;
                  if (verb) headerType = (`tool-${verb}${routeToken ? '_' + routeToken : ''}` as `tool-${string}`);
                } catch {}
                return (
                  <React.Fragment key={`tool-${index}-${state || 'unknown'}`}>
                    <Tool>
                      <ToolHeader type={headerType} state={(state as any) || 'output-available'} />
                      <ToolContent>
                        {inputForDisplay && (
                          <ToolInput input={inputForDisplay} />
                        )}
                      </ToolContent>
                    </Tool>
                    <div className="mb-3">
                      <ToolListResult output={output} input={inputForDisplay} />
                    </div>
                  </React.Fragment>
                );
              }
            }
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
            // Removed special render for centro de custo (use generic create card below)
            // Special render: get_contas_financeiras
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCF = /get[_-]?contas[_-]?financeiras/i.test(normalized);
              if (isCF && (state === 'output-available' || state === 'output-error') && output) {
                let result: any = (output as any).result !== undefined ? (output as any).result : output;
                if (typeof result === 'string') {
                  const s = result.trim();
                  try { result = JSON.parse(s); } catch {}
                }
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
            // Special render: criar_cliente → mostrar apenas o JSON de entrada (genérico)
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
                // Normalize input for display (prefer parsed input; fallback to streaming/raw)
                let inputForDisplay: any = input;
                try {
                  if (input && typeof input === 'object') {
                    const o: any = input as any;
                    if (o && (o.tool || o.name)) {
                      inputForDisplay = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                    }
                  }
                } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) {
                  const s = inputStream.trim();
                  if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } }
                }
                // Ensure result shape has success/data
                if (result && typeof result === 'object' && !('success' in (result as any))) {
                  if ((result as any).data || (result as any).id || (result as any).nome || (result as any).cpf_cnpj) {
                    result = { success: true, data: (result as any).data ?? result, message: String((result as any).message || 'Cliente criado') };
                  }
                }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Cliente" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_fornecedor → mostrar apenas o JSON de entrada (genérico)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateSupplier = normalized === 'criar_fornecedor' || normalized === 'criarFornecedor' || normalized.endsWith('__criar_fornecedor') || /criar[_-]?fornecedor/i.test(normalized);
              if (isCreateSupplier && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try {
                  if (input && typeof input === 'object') {
                    const o: any = input as any;
                    if (o && (o.tool || o.name)) inputForDisplay = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                  }
                } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) {
                  const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } }
                }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Fornecedor" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_centro_custo → mostrar apenas o JSON de entrada (genérico)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateCC = normalized === 'criar_centro_custo' || normalized === 'criarCentroCusto' || normalized.endsWith('__criar_centro_custo') || /criar[_-]?centro[_-]?custo/i.test(normalized);
              if (isCreateCC && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try {
                  if (input && typeof input === 'object') {
                    const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                  }
                } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) {
                  const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } }
                }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Centro de Custo" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_centro_lucro → mostrar apenas o JSON de entrada (genérico)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCreateCL = normalized === 'criar_centro_lucro' || normalized === 'criarCentroLucro' || normalized.endsWith('__criar_centro_lucro') || /criar[_-]?centro[_-]?lucro/i.test(normalized);
              if (isCreateCL && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try {
                  if (input && typeof input === 'object') {
                    const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                  }
                } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) {
                  const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } }
                }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Centro de Lucro" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_categoria_despesa → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCCD = normalized === 'criar_categoria_despesa' || normalized === 'criarCategoriaDespesa' || /criar[_-]?categoria[_-]?despesa/i.test(normalized);
              if (isCCD && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Categoria de Despesa" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_categoria_receita → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCCR = normalized === 'criar_categoria_receita' || normalized === 'criarCategoriaReceita' || /criar[_-]?categoria[_-]?receita/i.test(normalized);
              if (isCCR && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Categoria de Receita" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_conta_financeira → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCCF = normalized === 'criar_conta_financeira' || normalized === 'criarContaFinanceira' || /criar[_-]?conta[_-]?financeira/i.test(normalized);
              if (isCCF && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Conta Financeira" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: deletar_* → JSON de entrada (genérico)
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const delMap: Array<{ test: RegExp; title: string }> = [
                { test: /deletar[_-]?cliente/i, title: 'Cliente' },
                { test: /deletar[_-]?fornecedor/i, title: 'Fornecedor' },
                { test: /deletar[_-]?centro[_-]?custo/i, title: 'Centro de Custo' },
                { test: /deletar[_-]?centro[_-]?lucro/i, title: 'Centro de Lucro' },
                { test: /deletar[_-]?categoria[_-]?despesa/i, title: 'Categoria de Despesa' },
                { test: /deletar[_-]?categoria[_-]?receita/i, title: 'Categoria de Receita' },
                { test: /deletar[_-]?conta[_-]?financeira/i, title: 'Conta Financeira' },
                { test: /deletar[_-]?venda/i, title: 'Venda' },
                { test: /deletar[_-]?compra/i, title: 'Compra' },
                { test: /deletar[_-]?conta[_-]?pagar/i, title: 'Conta a Pagar' },
                { test: /deletar[_-]?conta[_-]?receber/i, title: 'Conta a Receber' },
              ];
              const match = delMap.find(m => m.test.test(normalized));
              if (match && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolDeleteInputCard title={match.title} input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_venda → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCV = normalized === 'criar_venda' || normalized === 'criarVenda' || /criar[_-]?venda/i.test(normalized);
              if (isCV && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Venda" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_compra → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCCP = normalized === 'criar_compra' || normalized === 'criarCompra' || /criar[_-]?compra/i.test(normalized);
              if (isCCP && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Compra" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_conta_pagar → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCAP = normalized === 'criar_conta_pagar' || normalized === 'criarContaPagar' || /criar[_-]?conta[_-]?pagar/i.test(normalized);
              if (isCAP && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Conta a Pagar" input={inputForDisplay} />
                  </div>
                );
              }
            }
            // Special render: criar_conta_receber → JSON de entrada
            {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const isCAR = normalized === 'criar_conta_receber' || normalized === 'criarContaReceber' || /criar[_-]?conta[_-]?receber/i.test(normalized);
              if (isCAR && (state === 'output-available' || state === 'output-error')) {
                let inputForDisplay: any = input;
                try { if (input && typeof input === 'object') { const o: any = input as any; if (o && (o.tool || o.name)) inputForDisplay = (o.args ?? (o.input ?? o)); } } catch {}
                if (!inputForDisplay && (inputStream && typeof inputStream === 'string')) { const s = inputStream.trim(); if (s) { try { inputForDisplay = JSON.parse(s); } catch { inputForDisplay = s; } } }
                return (
                  <div key={`tool-${index}`} className="mb-3">
                    <ToolCreateInputCard title="Criar Conta a Receber" input={inputForDisplay} />
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
            // Compute dynamic header for ERP CRUD when possible
            let headerTypeGeneric: `tool-${string}` = ((part as any).type as `tool-${string}`) || ('tool-generic' as `tool-${string}`);
            try {
              const normalized = toolType.startsWith('tool-') ? toolType.slice(5) : toolType;
              const looksCrud = normalized === 'crud' || /__crud$/i.test(normalized);
              const looksWorkspace = normalized === 'workspace' || /__workspace$/i.test(normalized);
              if (looksCrud || looksWorkspace) {
                let candidate: any = input;
                if (candidate && typeof candidate === 'object') {
                  const o: any = candidate;
                  if (o && (o.tool || o.name)) candidate = (o.args !== undefined ? o.args : (o.input !== undefined ? o.input : o));
                } else if (!candidate && (typeof (part as any).inputStream === 'string')) {
                  const s = ((part as any).inputStream as string).trim();
                  if (s) { try { candidate = JSON.parse(s) } catch { /* ignore */ } }
                }
                if (candidate && typeof candidate === 'object') {
                  const act = (typeof (candidate as any).action === 'string') ? String((candidate as any).action).toLowerCase() : undefined;
                  const method = (typeof (candidate as any).method === 'string') ? String((candidate as any).method).toLowerCase() : undefined;
                  const resRaw = (typeof (candidate as any).resource === 'string') ? String((candidate as any).resource) : (
                    (typeof (candidate as any).path === 'string') ? String((candidate as any).path) : undefined
                  );
                  const clean = String(resRaw || '').replace(/^\/+|\/+$/g, '').toLowerCase();
                  const toSafeToken = (value: string) => value.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                  const routeToken = (() => {
                    if (!clean) return '';
                    if (/^email\/inboxes$/.test(clean)) return 'inboxes';
                    if (/^email\/messages$/.test(clean)) return 'messages';
                    if (/^email\/messages\/[^/]+$/.test(clean)) return 'message_content';
                    if (/^email\/messages\/[^/]+\/attachments\/[^/]+$/.test(clean)) return 'attachment';
                    if (/^drive$/.test(clean)) return 'drive';
                    if (/^drive\/folders$/.test(clean)) return 'folders';
                    if (/^drive\/folders\/[^/]+$/.test(clean)) return 'folder';
                    if (/^drive\/files\/[^/]+$/.test(clean)) return 'file';
                    if (/^drive\/files\/[^/]+\/download$/.test(clean)) return 'file_download';
                    if (/^drive\/files\/prepare-upload$/.test(clean)) return 'prepare_upload';
                    if (/^drive\/files\/complete-upload$/.test(clean)) return 'complete_upload';
                    const partsSeg = clean.split('/').filter(Boolean);
                    const last = partsSeg[partsSeg.length - 1] || '';
                    const prev = partsSeg[partsSeg.length - 2] || '';
                    const looksDynamic = /[@=+]/.test(last) || /^[0-9a-f-]{16,}$/i.test(last) || last.length > 24;
                    return toSafeToken(looksDynamic ? prev : last);
                  })();
                  const verb = act === 'request' ? (method || (looksWorkspace ? 'get' : act)) : act;
                  if (verb) headerTypeGeneric = (`tool-${verb}${routeToken ? '_' + routeToken : ''}` as `tool-${string}`);
                }
              }
            } catch {}
            return (
              <Tool key={`tool-${index}-${state || 'unknown'}`}>
                <ToolHeader type={headerTypeGeneric} state={(state as any) || 'input-streaming'} />
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
