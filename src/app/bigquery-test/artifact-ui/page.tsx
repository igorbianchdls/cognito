"use client"

import React, { useMemo, useState } from "react"
import ArtifactDataTable from "@/components/widgets/ArtifactDataTable"
import type { ColumnDef } from "@tanstack/react-table"
import { Table as TableIcon } from "lucide-react"

type Row = {
  id: string
  cliente: string
  categoria: string
  valor: number
  status: "Ativo" | "Pendente" | "Suspenso"
  criadoEm: string
}

const FONTS: Array<{ label: string; value: string }> = [
  { label: "Geist (Next)", value: "var(--font-geist-sans), Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" },
  { label: "Inter (system)", value: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" },
  { label: "System UI", value: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji" },
  { label: "Roboto", value: "Roboto, system-ui, -apple-system, Segoe UI, Helvetica, Arial, sans-serif" },
  { label: "Source Sans Pro", value: "Source Sans Pro, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Open Sans", value: "Open Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Montserrat", value: "Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "DM Sans", value: "DM Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Nunito", value: "Nunito, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
  { label: "Lato", value: "Lato, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" },
]

const LETTER_SPACING_VALUES: number[] = [-0.04, -0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03, 0.04]

const sampleRows: Row[] = [
  { id: "1001", cliente: "ACME Ltd.", categoria: "SaaS", valor: 1299.9, status: "Ativo", criadoEm: "2024-11-10" },
  { id: "1002", cliente: "Bravo Co.", categoria: "Serviços", valor: 650.0, status: "Pendente", criadoEm: "2024-11-11" },
  { id: "1003", cliente: "Casa Verde", categoria: "Varejo", valor: 239.5, status: "Ativo", criadoEm: "2024-11-11" },
  { id: "1004", cliente: "Delta Tech", categoria: "SaaS", valor: 199.0, status: "Suspenso", criadoEm: "2024-11-12" },
  { id: "1005", cliente: "Evo Labs", categoria: "Indústria", valor: 7999.0, status: "Ativo", criadoEm: "2024-11-12" },
  { id: "1006", cliente: "Fazenda Luz", categoria: "Agro", valor: 120.0, status: "Pendente", criadoEm: "2024-11-12" },
  { id: "1007", cliente: "Global Motors", categoria: "Indústria", valor: 13999.99, status: "Ativo", criadoEm: "2024-11-13" },
  { id: "1008", cliente: "Hotel Sol", categoria: "Turismo", valor: 980.0, status: "Ativo", criadoEm: "2024-11-13" },
  { id: "1009", cliente: "Ita Center", categoria: "Serviços", valor: 410.75, status: "Pendente", criadoEm: "2024-11-13" },
  { id: "1010", cliente: "Jade Store", categoria: "Varejo", valor: 85.3, status: "Ativo", criadoEm: "2024-11-14" },
  { id: "1011", cliente: "Kairos", categoria: "SaaS", valor: 159.0, status: "Ativo", criadoEm: "2024-11-14" },
  { id: "1012", cliente: "Leme", categoria: "Serviços", valor: 205.49, status: "Suspenso", criadoEm: "2024-11-14" },
]

function currencyBRL(v: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
  } catch {
    return `R$ ${v.toFixed(2)}`
  }
}

export default function ArtifactUiPlaygroundPage() {
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "cliente", header: "Cliente" },
    { accessorKey: "categoria", header: "Categoria" },
    { accessorKey: "valor", header: "Valor",
      cell: ({ row }) => <span>{currencyBRL(row.original.valor)}</span> },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "criadoEm", header: "Criado em" },
  ], [])

  // Artifact-level styles
  const [artifactFont, setArtifactFont] = useState<string>("var(--font-geist-sans), Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji")
  const [artifactWeight, setArtifactWeight] = useState<number>(400)
  const [artifactSize, setArtifactSize] = useState<number>(14)
  const [artifactText, setArtifactText] = useState<string>("#0f172a") // slate-900
  const [artifactBg, setArtifactBg] = useState<string>("#ffffff")
  const [artifactLetter, setArtifactLetter] = useState<string>("-0.02em")

  // Header (barra superior do Artifact)
  const [hdrFont, setHdrFont] = useState<string>(artifactFont)
  const [hdrWeight, setHdrWeight] = useState<number>(600)
  const [hdrSize, setHdrSize] = useState<number>(14)
  const [hdrText, setHdrText] = useState<string>("#0f172a")
  const [hdrBg, setHdrBg] = useState<string>("#ffffff")
  const [hdrLetter, setHdrLetter] = useState<string>("-0.02em")

  // Tabela (thead)
  const [thFont, setThFont] = useState<string>(artifactFont)
  const [thWeight, setThWeight] = useState<number>(500)
  const [thSize, setThSize] = useState<number>(14)
  const [thText, setThText] = useState<string>("#414141") // rgb(65,65,65)
  const [thBg, setThBg] = useState<string>("#fcfcfc") // rgb(252, 252, 252)
  const [thLetter, setThLetter] = useState<string>("0em")

  // Tabela (tbody/rows)
  const [rowFont, setRowFont] = useState<string>(artifactFont)
  const [rowWeight, setRowWeight] = useState<number>(400)
  const [rowSize, setRowSize] = useState<number>(13)
  const [rowText, setRowText] = useState<string>("#414141")
  const [rowBg, setRowBg] = useState<string>("#ffffff")
  const [rowZebra, setRowZebra] = useState<boolean>(true)
  const [rowZebraBg, setRowZebraBg] = useState<string>("#ffffff")
  const [rowHoverBg, setRowHoverBg] = useState<string>("#f1f5f9")
  const [tblBorder, setTblBorder] = useState<string>("#e5e7eb")
  const [rowLetter, setRowLetter] = useState<string>("0em")

  const resetAll = () => {
    setArtifactFont("Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji")
    setArtifactWeight(400)
    setArtifactSize(14)
    setArtifactText("#0f172a")
    setArtifactBg("#ffffff")
    setArtifactLetter("-0.02em")
    setHdrFont("Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji")
    setHdrWeight(600)
    setHdrSize(14)
    setHdrText("#0f172a")
    setHdrBg("#ffffff")
    setHdrLetter("-0.02em")
    setThFont("Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji")
    setThWeight(500)
    setThSize(14)
    setThText("#414141")
    setThBg("#fcfcfc")
    setThLetter("0em")
    setRowFont("Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji")
    setRowWeight(400)
    setRowSize(13)
    setRowText("#414141")
    setRowBg("#ffffff")
    setRowZebra(true)
    setRowZebraBg("#ffffff")
    setRowHoverBg("#f1f5f9")
    setTblBorder("#e5e7eb")
    setRowLetter("0em")
  }

  return (
    <div className="px-8 py-6">
      <h1 className="text-2xl font-semibold mb-2">Artifact Data Table — Playground</h1>
      <p className="text-sm text-slate-600 mb-6">Dados simulados e controles para experimentar estilos (fonte, cores, tamanhos, fundos) do Artifact + tabela.</p>

      {/* Wrapper com variáveis CSS para estilização dinâmica */}
      <div
        className="artifact-playground"
        style={{
          // Artifact (base)
          ["--artifact-font" as any]: artifactFont,
          ["--artifact-weight" as any]: String(artifactWeight),
          ["--artifact-size" as any]: `${artifactSize}px`,
          ["--artifact-text" as any]: artifactText,
          ["--artifact-bg" as any]: artifactBg,
          ["--artifact-letter" as any]: artifactLetter,
          // Header do Artifact
          ["--hdr-font" as any]: hdrFont,
          ["--hdr-weight" as any]: String(hdrWeight),
          ["--hdr-size" as any]: `${hdrSize}px`,
          ["--hdr-text" as any]: hdrText,
          ["--hdr-bg" as any]: hdrBg,
          ["--hdr-letter" as any]: hdrLetter,
          // Table header
          ["--tbl-head-font" as any]: thFont,
          ["--tbl-head-weight" as any]: String(thWeight),
          ["--tbl-head-size" as any]: `${thSize}px`,
          ["--tbl-head-text" as any]: thText,
          ["--tbl-head-bg" as any]: thBg,
          ["--tbl-head-letter" as any]: thLetter,
          // Rows
          ["--row-font" as any]: rowFont,
          ["--row-weight" as any]: String(rowWeight),
          ["--row-size" as any]: `${rowSize}px`,
          ["--row-text" as any]: rowText,
          ["--row-bg" as any]: rowBg,
          ["--row-zebra-bg" as any]: rowZebra ? rowZebraBg : rowBg,
          ["--row-hover-bg" as any]: rowHoverBg,
          ["--row-letter" as any]: rowLetter,
          // Borders
          ["--tbl-border" as any]: tblBorder,
        } as React.CSSProperties}
      >
        <ArtifactDataTable<Row>
          data={sampleRows}
          columns={columns}
          title="Pedidos (Simulado)"
          icon={TableIcon}
          message="Dados de demonstração para ajustes de UI"
          success={true}
          count={sampleRows.length}
          exportFileName="pedidos-demo"
        />
      </div>

      {/* Controles de estilo */}
      <div className="mt-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Controles de UI</h2>
          <button onClick={resetAll} className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800">Resetar</button>
        </div>

        {/* Artifact (base) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Artifact (base)</h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">Fonte (preset)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={artifactFont} onChange={(e) => setArtifactFont(e.target.value)}>
                {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
              <label className="block text-xs text-slate-600">Fonte (CSS font-family)</label>
              <input className="w-full rounded border px-2 py-1 text-sm" value={artifactFont} onChange={(e) => setArtifactFont(e.target.value)} />

              <label className="block text-xs text-slate-600 mt-2">Peso</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={artifactWeight} onChange={(e) => setArtifactWeight(Number(e.target.value))}>
                {[300,400,500,600,700].map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="block text-xs text-slate-600 mt-2">Tamanho (px)</label>
              <input type="number" min={10} max={20} className="w-full rounded border px-2 py-1 text-sm" value={artifactSize} onChange={(e) => setArtifactSize(Number(e.target.value))} />

              <div className="flex items-center gap-3 mt-2">
                <div>
                  <label className="block text-xs text-slate-600">Cor do texto</label>
                  <input type="color" value={artifactText} onChange={(e) => setArtifactText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Fundo (Artifact)</label>
                  <input type="color" value={artifactBg} onChange={(e) => setArtifactBg(e.target.value)} />
                </div>
              </div>

              <label className="block text-xs text-slate-600 mt-2">Espaçamento (em)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={artifactLetter} onChange={(e) => setArtifactLetter(e.target.value)}>
                {LETTER_SPACING_VALUES.map(v => {
                  const val = `${v}em`
                  return <option key={val} value={val}>{v.toFixed(2)}em</option>
                })}
              </select>
            </div>
          </div>

          {/* Header do Artifact */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Header do Artifact</h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">Fonte (preset)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={hdrFont} onChange={(e) => setHdrFont(e.target.value)}>
                {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
              <label className="block text-xs text-slate-600">Fonte (CSS font-family)</label>
              <input className="w-full rounded border px-2 py-1 text-sm" value={hdrFont} onChange={(e) => setHdrFont(e.target.value)} />

              <label className="block text-xs text-slate-600 mt-2">Peso</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={hdrWeight} onChange={(e) => setHdrWeight(Number(e.target.value))}>
                {[400,500,600,700].map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="block text-xs text-slate-600 mt-2">Tamanho (px)</label>
              <input type="number" min={12} max={20} className="w-full rounded border px-2 py-1 text-sm" value={hdrSize} onChange={(e) => setHdrSize(Number(e.target.value))} />

              <div className="flex items-center gap-3 mt-2">
                <div>
                  <label className="block text-xs text-slate-600">Texto</label>
                  <input type="color" value={hdrText} onChange={(e) => setHdrText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Fundo</label>
                  <input type="color" value={hdrBg} onChange={(e) => setHdrBg(e.target.value)} />
                </div>
              </div>

              <label className="block text-xs text-slate-600 mt-2">Espaçamento (em)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={hdrLetter} onChange={(e) => setHdrLetter(e.target.value)}>
                {LETTER_SPACING_VALUES.map(v => {
                  const val = `${v}em`
                  return <option key={val} value={val}>{v.toFixed(2)}em</option>
                })}
              </select>
            </div>
          </div>

          {/* Header da Tabela */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Header da Tabela (thead)</h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">Fonte (preset)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={thFont} onChange={(e) => setThFont(e.target.value)}>
                {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
              <label className="block text-xs text-slate-600">Fonte (CSS font-family)</label>
              <input className="w-full rounded border px-2 py-1 text-sm" value={thFont} onChange={(e) => setThFont(e.target.value)} />

              <label className="block text-xs text-slate-600 mt-2">Peso</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={thWeight} onChange={(e) => setThWeight(Number(e.target.value))}>
                {[400,500,600,700].map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="block text-xs text-slate-600 mt-2">Tamanho (px)</label>
              <input type="number" min={10} max={18} className="w-full rounded border px-2 py-1 text-sm" value={thSize} onChange={(e) => setThSize(Number(e.target.value))} />

              <div className="flex items-center gap-3 mt-2">
                <div>
                  <label className="block text-xs text-slate-600">Texto</label>
                  <input type="color" value={thText} onChange={(e) => setThText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Fundo</label>
                  <input type="color" value={thBg} onChange={(e) => setThBg(e.target.value)} />
                </div>
              </div>

              <label className="block text-xs text-slate-600 mt-2">Espaçamento (em)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={thLetter} onChange={(e) => setThLetter(e.target.value)}>
                {LETTER_SPACING_VALUES.map(v => {
                  const val = `${v}em`
                  return <option key={val} value={val}>{v.toFixed(2)}em</option>
                })}
              </select>
            </div>
          </div>
        </section>

        {/* Linhas da tabela */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Rows (tbody)</h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">Fonte (preset)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={rowFont} onChange={(e) => setRowFont(e.target.value)}>
                {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
              </select>
              <label className="block text-xs text-slate-600">Fonte (CSS font-family)</label>
              <input className="w-full rounded border px-2 py-1 text-sm" value={rowFont} onChange={(e) => setRowFont(e.target.value)} />

              <label className="block text-xs text-slate-600 mt-2">Peso</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={rowWeight} onChange={(e) => setRowWeight(Number(e.target.value))}>
                {[300,400,500,600,700].map(w => <option key={w} value={w}>{w}</option>)}
              </select>

              <label className="block text-xs text-slate-600 mt-2">Tamanho (px)</label>
              <input type="number" min={10} max={18} className="w-full rounded border px-2 py-1 text-sm" value={rowSize} onChange={(e) => setRowSize(Number(e.target.value))} />

              <div className="flex items-center gap-3 mt-2">
                <div>
                  <label className="block text-xs text-slate-600">Texto</label>
                  <input type="color" value={rowText} onChange={(e) => setRowText(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Fundo</label>
                  <input type="color" value={rowBg} onChange={(e) => setRowBg(e.target.value)} />
                </div>
              </div>

              <label className="block text-xs text-slate-600 mt-2">Espaçamento (em)</label>
              <select className="w-full rounded border px-2 py-1 text-sm" value={rowLetter} onChange={(e) => setRowLetter(e.target.value)}>
                {LETTER_SPACING_VALUES.map(v => {
                  const val = `${v}em`
                  return <option key={val} value={val}>{v.toFixed(2)}em</option>
                })}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Zebra/Hover</h3>
            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={rowZebra} onChange={(e) => setRowZebra(e.target.checked)} />
                Zebra nas linhas
              </label>
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-xs text-slate-600">Zebra bg</label>
                  <input type="color" value={rowZebraBg} onChange={(e) => setRowZebraBg(e.target.value)} disabled={!rowZebra} />
                </div>
                <div>
                  <label className="block text-xs text-slate-600">Hover bg</label>
                  <input type="color" value={rowHoverBg} onChange={(e) => setRowHoverBg(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Bordas</h3>
            <div className="space-y-2">
              <label className="block text-xs text-slate-600">Cor da borda</label>
              <input type="color" value={tblBorder} onChange={(e) => setTblBorder(e.target.value)} />
            </div>
          </div>
        </section>
      </div>

      {/* Estilos dinâmicos escopados à página */}
      <style jsx>{`
        /* Mantém o padrão de tipografia do Artifact/Shadcn (sem overrides globais) */
        .artifact-playground {}
        /* Fundo do container Artifact (usa bg-background) */
        .artifact-playground :global(.bg-background) {
          background-color: var(--artifact-bg) !important;
        }
        /* Header do Artifact: apenas fundo, sem alterar tipografia */
        .artifact-playground :global(.border-b.bg-white) {
          background-color: var(--hdr-bg) !important;
        }
        /* Thead */
        .artifact-playground :global(thead tr) {
          background-color: var(--tbl-head-bg) !important;
        }
        .artifact-playground :global(thead th) {
          color: var(--tbl-head-text) !important;
          font-family: var(--tbl-head-font) !important;
          font-weight: var(--tbl-head-weight) !important;
          font-size: var(--tbl-head-size) !important;
          border-color: var(--tbl-border) !important;
          letter-spacing: var(--tbl-head-letter) !important;
        }
        /* Rows */
        .artifact-playground :global(tbody tr) {
          background-color: var(--row-bg) !important;
        }
        .artifact-playground :global(tbody td) {
          color: var(--row-text) !important;
          font-family: var(--row-font) !important;
          font-weight: var(--row-weight) !important;
          font-size: var(--row-size) !important;
          border-color: var(--tbl-border) !important;
          letter-spacing: var(--row-letter) !important;
        }
        .artifact-playground :global(tbody tr:nth-child(odd)) {
          background-color: var(--row-zebra-bg) !important;
        }
        .artifact-playground :global(tbody tr:hover) {
          background-color: var(--row-hover-bg) !important;
        }
        .artifact-playground :global(table),
        .artifact-playground :global(thead th),
        .artifact-playground :global(tbody td) {
          border-color: var(--tbl-border) !important;
        }
      `}</style>
    </div>
  )
}
