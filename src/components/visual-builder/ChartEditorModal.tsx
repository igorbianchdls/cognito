'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FontManager } from './FontManager';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type QueryRuleEdit = { col: string; op: string; val?: string; vals?: string; start?: string; end?: string }

type QueryEdit = {
  schema?: string;
  table?: string;
  measure?: string;
  dimension?: string;
  timeDimension?: string;
  from?: string;
  to?: string;
  limit?: number;
  order?: 'value DESC' | 'value ASC' | 'label ASC' | 'label DESC';
  where?: QueryRuleEdit[];
}

interface ChartEditorModalProps {
  isOpen: boolean;
  initial: {
    titleText: string;
    titleFontFamily?: string;
    titleFontSize?: number;
    titleFontWeight?: string | number;
    titleColor?: string;
    // Container (article) styles
    backgroundColor?: string;
    opacity?: number;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | '';
    borderRadius?: number;
    widthFr?: number;
    query?: QueryEdit;
    // Local Nivo props (merged attrs + <props>)
    chartProps?: Record<string, unknown>;
  };
  onClose: () => void;
  onSave: (data: { titleText: string; titleFontFamily?: string; titleFontSize?: number; titleFontWeight?: string | number; titleColor?: string; backgroundColor?: string; opacity?: number; borderColor?: string; borderWidth?: number; borderStyle?: 'solid'|'dashed'|'dotted'|''; borderRadius?: number; widthFr?: number; query?: QueryEdit; chartProps?: Record<string, unknown> }) => void;
}

export default function ChartEditorModal({ isOpen, initial, onClose, onSave }: ChartEditorModalProps) {
  // Static options
  const SCHEMAS = [ { value: 'financeiro', label: 'Financeiro' }, { value: 'vendas', label: 'Vendas' } ];
  const TABLES = [
    { value: 'contas_pagar', label: 'Contas a Pagar' },
    { value: 'contas_receber', label: 'Contas a Receber' },
    { value: 'pagamentos_efetuados', label: 'Pagamentos Efetuados' },
    { value: 'pagamentos_recebidos', label: 'Pagamentos Recebidos' },
    { value: 'pedidos', label: 'Pedidos (Vendas)' },
  ];
  const TABLE_META: Record<string, { defaultMeasureField: string; defaultTimeColumn: string; dimensions: string[]; measureFields: string[]; timeColumns: string[] }> = {
    contas_pagar: {
      defaultMeasureField: 'valor_liquido',
      defaultTimeColumn: 'data_vencimento',
      measureFields: ['valor_liquido'],
      timeColumns: ['data_vencimento'],
      dimensions: ['categoria','fornecedor','departamento','centro_custo','filial','unidade_negocio','titulo','metodo_pagamento','conta_financeira']
    },
    contas_receber: {
      defaultMeasureField: 'valor_liquido',
      defaultTimeColumn: 'data_vencimento',
      measureFields: ['valor_liquido'],
      timeColumns: ['data_vencimento'],
      dimensions: ['categoria','cliente','centro_lucro','filial','unidade_negocio','titulo','metodo_pagamento','conta_financeira']
    },
    pagamentos_efetuados: {
      defaultMeasureField: 'valor_total_pagamento',
      defaultTimeColumn: 'data_pagamento',
      measureFields: ['valor_total_pagamento'],
      timeColumns: ['data_pagamento'],
      dimensions: ['categoria','fornecedor','departamento','centro_custo','filial','unidade_negocio','metodo_pagamento','conta_financeira']
    },
    pagamentos_recebidos: {
      defaultMeasureField: 'valor_total_recebido',
      defaultTimeColumn: 'data_recebimento',
      measureFields: ['valor_total_recebido'],
      timeColumns: ['data_recebimento'],
      dimensions: ['categoria','cliente','centro_lucro','filial','unidade_negocio','metodo_pagamento','conta_financeira']
    },
    pedidos: {
      defaultMeasureField: 'subtotal',
      defaultTimeColumn: 'data_pedido',
      measureFields: ['subtotal'],
      timeColumns: ['data_pedido'],
      dimensions: ['vendedor','canal_venda','canal_distribuicao','territorio','servico','categoria_servico','produto','cliente','cidade','filial','unidade_negocio','sales_office','marca','campanha','centro_lucro','cupom']
    },
  };
  const AGGS: Array<'SUM'|'COUNT'|'AVG'|'MIN'|'MAX'> = ['SUM','COUNT','AVG','MIN','MAX'];

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'chart' | 'container' | 'query'>('chart');
  const [titleText, setTitleText] = useState(initial.titleText || '');
  const [titleFontFamily, setTitleFontFamily] = useState(initial.titleFontFamily || '');
  const [titleFontSize, setTitleFontSize] = useState<number | undefined>(initial.titleFontSize);
  const [titleFontWeight, setTitleFontWeight] = useState<string | number | undefined>(initial.titleFontWeight);
  const [titleColor, setTitleColor] = useState(initial.titleColor || '#111827');
  const [dirtyTitleFamily, setDirtyTitleFamily] = useState(false);
  const [dirtyTitleSize, setDirtyTitleSize] = useState(false);
  const [dirtyTitleWeight, setDirtyTitleWeight] = useState(false);
  const [dirtyTitleColor, setDirtyTitleColor] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(initial.backgroundColor || '');
  const [widthFr, setWidthFr] = useState<number | undefined>(initial.widthFr ?? 1);
  const [opacity, setOpacity] = useState<number | undefined>(initial.opacity);
  const [borderColor, setBorderColor] = useState(initial.borderColor || '');
  const [borderWidth, setBorderWidth] = useState<number | undefined>(initial.borderWidth);
  const [borderStyle, setBorderStyle] = useState<'solid'|'dashed'|'dotted'|''>(initial.borderStyle || '');
  const [borderRadius, setBorderRadius] = useState<number | undefined>(initial.borderRadius);
  const [dirtyBg, setDirtyBg] = useState(false);
  const [dirtyOpacity, setDirtyOpacity] = useState(false);
  const [dirtyBColor, setDirtyBColor] = useState(false);
  const [dirtyBWidth, setDirtyBWidth] = useState(false);
  const [dirtyBStyle, setDirtyBStyle] = useState(false);
  const [dirtyBRadius, setDirtyBRadius] = useState(false);
  // Local BarChart props (from initial.chartProps)
  const initialProps = (initial.chartProps || {}) as Record<string, any>;
  const get = (obj: any, path: string, d?: any) => {
    try { return path.split('.').reduce((o,k)=> (o && typeof o==='object') ? o[k] : undefined, obj) ?? d; } catch { return d; }
  };
  const [layout, setLayout] = useState<string>(String(initialProps.layout || 'vertical'));
  const [enableGridX, setEnableGridX] = useState<boolean>(Boolean(initialProps.enableGridX ?? false));
  const [enableGridY, setEnableGridY] = useState<boolean>(Boolean(initialProps.enableGridY ?? true));
  const [gridColor, setGridColor] = useState<string>(String(initialProps.gridColor || '#e5e7eb'));
  const [gridStrokeWidth, setGridStrokeWidth] = useState<number>(Number(initialProps.gridStrokeWidth ?? 1));
  const [axisBottomLegend, setAxisBottomLegend] = useState<string>(String(get(initialProps,'axisBottom.legend','')));
  const [axisBottomLegendOffset, setAxisBottomLegendOffset] = useState<number | undefined>(get(initialProps,'axisBottom.legendOffset', undefined));
  const [axisBottomLegendPosition, setAxisBottomLegendPosition] = useState<string>(String(get(initialProps,'axisBottom.legendPosition','middle')));
  const [axisBottomTickRotation, setAxisBottomTickRotation] = useState<number>(Number(get(initialProps,'axisBottom.tickRotation', 0)));
  const [axisBottomTickSize, setAxisBottomTickSize] = useState<number | undefined>(get(initialProps,'axisBottom.tickSize', undefined));
  const [axisBottomTickPadding, setAxisBottomTickPadding] = useState<number | undefined>(get(initialProps,'axisBottom.tickPadding', undefined));
  const [axisLeftLegend, setAxisLeftLegend] = useState<string>(String(get(initialProps,'axisLeft.legend','')));
  const [axisLeftLegendOffset, setAxisLeftLegendOffset] = useState<number | undefined>(get(initialProps,'axisLeft.legendOffset', undefined));
  const [axisLeftTickSize, setAxisLeftTickSize] = useState<number | undefined>(get(initialProps,'axisLeft.tickSize', undefined));
  const [axisLeftTickPadding, setAxisLeftTickPadding] = useState<number | undefined>(get(initialProps,'axisLeft.tickPadding', undefined));
  const colorsToString = (c: any): string => Array.isArray(c) ? c.join(', ') : (typeof c === 'string' ? c : '');
  const [colorsText, setColorsText] = useState<string>(colorsToString(initialProps.colors));
  const [showLegend, setShowLegend] = useState<boolean>(Boolean(initialProps.showLegend ?? false));
  const [enableLabel, setEnableLabel] = useState<boolean>(Boolean(initialProps.enableLabel ?? false));
  const [labelPosition, setLabelPosition] = useState<'start'|'middle'|'end'>((initialProps.labelPosition as any) || 'middle');
  const [labelOffset, setLabelOffset] = useState<number | undefined>(typeof initialProps.labelOffset === 'number' ? initialProps.labelOffset : undefined);
  const [labelSkipWidth, setLabelSkipWidth] = useState<number | undefined>(typeof initialProps.labelSkipWidth === 'number' ? initialProps.labelSkipWidth : undefined);
  const [labelSkipHeight, setLabelSkipHeight] = useState<number | undefined>(typeof initialProps.labelSkipHeight === 'number' ? initialProps.labelSkipHeight : undefined);
  const [labelTextColor, setLabelTextColor] = useState<string>(String(initialProps.labelTextColor || '#374151'));
  const [padding, setPadding] = useState<number | undefined>(typeof initialProps.padding === 'number' ? initialProps.padding : undefined);
  const [innerPadding, setInnerPadding] = useState<number | undefined>(typeof initialProps.innerPadding === 'number' ? initialProps.innerPadding : undefined);
  const [animate, setAnimate] = useState<boolean>(Boolean(initialProps.animate ?? true));
  const [motionConfig, setMotionConfig] = useState<string>(String(initialProps.motionConfig || 'gentle'));
  const [groupMode, setGroupMode] = useState<'grouped'|'stacked'>(String((initialProps.groupMode || 'grouped')).toLowerCase() === 'stacked' ? 'stacked' : 'grouped');
  const [barBorderRadius, setBarBorderRadius] = useState<number | undefined>(typeof initialProps.borderRadius === 'number' ? initialProps.borderRadius : undefined);
  const [barBorderWidth, setBarBorderWidth] = useState<number | undefined>(typeof initialProps.borderWidth === 'number' ? initialProps.borderWidth : undefined);
  const [barOpacity, setBarOpacity] = useState<number | undefined>(typeof initialProps.barOpacity === 'number' ? initialProps.barOpacity : undefined);
  const [legendAnchor, setLegendAnchor] = useState<string>(String((initialProps.legends as any)?.anchor || 'bottom'));
  const [legendDirection, setLegendDirection] = useState<string>(String((initialProps.legends as any)?.direction || 'row'));
  const [legendTranslateY, setLegendTranslateY] = useState<number | undefined>(typeof (initialProps.legends as any)?.translateY === 'number' ? (initialProps.legends as any).translateY : undefined);
  // Query state
  const [schema, setSchema] = useState<string>(initial.query?.schema || 'financeiro')
  const [table, setTable] = useState<string>(initial.query?.table || '')
  // Measure split: aggregate + field
  const parseMeasure = (s?: string): { agg?: 'SUM'|'COUNT'|'AVG'|'MIN'|'MAX'; field?: string } => {
    const raw = String(s || '').trim();
    const m = raw.match(/^([A-Za-z]+)\s*\(\s*([A-Za-z0-9_\.]+)\s*\)\s*$/);
    if (m) {
      const agg = m[1].toUpperCase();
      const field = m[2];
      if (AGGS.includes(agg as any)) return { agg: agg as any, field };
      return { field: raw };
    }
    return raw ? { field: raw } : {};
  };
  const initialParsed = parseMeasure(initial.query?.measure);
  const [measureAgg, setMeasureAgg] = useState<'SUM'|'COUNT'|'AVG'|'MIN'|'MAX'>(initialParsed.agg || 'SUM');
  const [measureField, setMeasureField] = useState<string>(initialParsed.field || '');
  const [dimension, setDimension] = useState<string>(initial.query?.dimension || '')
  const [timeDimension, setTimeDimension] = useState<string>(initial.query?.timeDimension || '')
  const [from, setFrom] = useState<string>(initial.query?.from || '')
  const [to, setTo] = useState<string>(initial.query?.to || '')
  const [limit, setLimit] = useState<number>(typeof initial.query?.limit === 'number' ? (initial.query?.limit as number) : 5)
  const [order, setOrder] = useState<QueryEdit['order']>(initial.query?.order || 'value DESC')
  const [where, setWhere] = useState<QueryRuleEdit[]>(Array.isArray(initial.query?.where) ? (initial.query?.where as QueryRuleEdit[]) : [])
  const [dirtyQuery, setDirtyQuery] = useState(false)

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);
  useEffect(() => {
    if (isOpen) {
      setTitleText(initial.titleText || '');
      setTitleFontFamily(initial.titleFontFamily || '');
      setTitleFontSize(initial.titleFontSize);
      setTitleFontWeight(initial.titleFontWeight);
      setTitleColor(initial.titleColor || '#111827');
      setBackgroundColor(initial.backgroundColor || '');
      setOpacity(initial.opacity);
      setBorderColor(initial.borderColor || '');
      setBorderWidth(initial.borderWidth);
      setBorderStyle(initial.borderStyle || '');
      setBorderRadius(initial.borderRadius);
      // chart props local
      const p = (initial.chartProps || {}) as Record<string, any>;
      setLayout(String(p.layout || 'vertical'));
      setEnableGridX(Boolean(p.enableGridX ?? false));
      setEnableGridY(Boolean(p.enableGridY ?? true));
      setGridColor(String(p.gridColor || '#e5e7eb'));
      setGridStrokeWidth(Number(p.gridStrokeWidth ?? 1));
      setAxisBottomLegend(String(get(p,'axisBottom.legend','')));
      setAxisBottomLegendOffset(get(p,'axisBottom.legendOffset', undefined));
      setAxisBottomLegendPosition(String(get(p,'axisBottom.legendPosition','middle')));
      setAxisBottomTickRotation(Number(get(p,'axisBottom.tickRotation', 0)));
      setAxisBottomTickSize(get(p,'axisBottom.tickSize', undefined));
      setAxisBottomTickPadding(get(p,'axisBottom.tickPadding', undefined));
      setAxisLeftLegend(String(get(p,'axisLeft.legend','')));
      setAxisLeftLegendOffset(get(p,'axisLeft.legendOffset', undefined));
      setAxisLeftTickSize(get(p,'axisLeft.tickSize', undefined));
      setAxisLeftTickPadding(get(p,'axisLeft.tickPadding', undefined));
      setColorsText(colorsToString(p.colors));
      setShowLegend(Boolean(p.showLegend ?? false));
      setEnableLabel(Boolean(p.enableLabel ?? false));
      setLabelPosition(((p.labelPosition as any) || 'middle') as any);
      setLabelOffset(typeof p.labelOffset === 'number' ? p.labelOffset : undefined);
      setLabelSkipWidth(typeof p.labelSkipWidth === 'number' ? p.labelSkipWidth : undefined);
      setLabelSkipHeight(typeof p.labelSkipHeight === 'number' ? p.labelSkipHeight : undefined);
      setLabelTextColor(String(p.labelTextColor || '#374151'));
      setPadding(typeof p.padding === 'number' ? p.padding : undefined);
      setInnerPadding(typeof p.innerPadding === 'number' ? p.innerPadding : undefined);
      setAnimate(Boolean(p.animate ?? true));
      setMotionConfig(String(p.motionConfig || 'gentle'));
      setGroupMode(String((p.groupMode || 'grouped')).toLowerCase() === 'stacked' ? 'stacked' : 'grouped');
      setBarBorderRadius(typeof p.borderRadius === 'number' ? p.borderRadius : undefined);
      setBarBorderWidth(typeof p.borderWidth === 'number' ? p.borderWidth : undefined);
      setBarOpacity(typeof p.barOpacity === 'number' ? p.barOpacity : undefined);
      if (p.legends && typeof p.legends === 'object') {
        setLegendAnchor(String((p.legends as any).anchor || 'bottom'));
        setLegendDirection(String((p.legends as any).direction || 'row'));
        setLegendTranslateY(typeof (p.legends as any).translateY === 'number' ? (p.legends as any).translateY : undefined);
      }
      // query
      setSchema(initial.query?.schema || 'financeiro')
      setTable(initial.query?.table || '')
      const pm = parseMeasure(initial.query?.measure);
      setMeasureAgg(pm.agg || 'SUM');
      setMeasureField(pm.field || '');
      setDimension(initial.query?.dimension || '')
      setTimeDimension(initial.query?.timeDimension || '')
      setFrom(initial.query?.from || '')
      setTo(initial.query?.to || '')
      setLimit(typeof initial.query?.limit === 'number' ? (initial.query?.limit as number) : 5)
      setOrder(initial.query?.order || 'value DESC')
      setWhere(Array.isArray(initial.query?.where) ? (initial.query?.where as QueryRuleEdit[]) : [])
      setDirtyQuery(false)
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;
  const parseColors = (s: string): any => {
    const t = String(s || '').trim();
    if (!t) return undefined;
    if (t.startsWith('[')) { try { return JSON.parse(t); } catch { return undefined; } }
    if (t.includes(',')) return t.split(',').map(x => x.trim()).filter(Boolean);
    return t;
  };

  const modal = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-[520px] max-w-[95vw] p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Editar Chart</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-auto pr-1">
          <Tabs value={tab} onValueChange={(v)=>setTab(v as any)} className="">
            <TabsList variant="underline" className="mb-2">
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
              <TabsTrigger value="container">Container</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
            </TabsList>

            <TabsContent value="container">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Título (HTML &lt;h1&gt;)</label>
                  <input className="w-full px-3 py-2 bg-gray-100 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={titleText} onChange={e=>setTitleText(e.target.value)} placeholder="Ex.: Faturamento Mensal" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Largura (fração)</label>
                  <div className="grid grid-cols-4 gap-2 items-center">
                    <input type="number" step={0.5} min={0.25} className="col-span-2 px-2 py-2 bg-gray-100 border-0 rounded-md" value={widthFr ?? 1} onChange={e=>setWidthFr(e.target.value===''?1:parseFloat(e.target.value))} />
                    <div className="col-span-2 flex items-center gap-2 text-xs">
                      {[0.5,1,1.5,2,3].map(v => (
                        <button key={v} type="button" className={`px-2 py-1 rounded bg-gray-100 ${widthFr===v?'ring-1 ring-blue-500':''}`} onClick={()=>setWidthFr(v)}>{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Tipografia do Título</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select className="px-2 py-2 bg-gray-100 border-0 rounded-md" value={titleFontFamily} onChange={e=>{ setTitleFontFamily(e.target.value); setDirtyTitleFamily(true); }}>
                      <option value="">(Padrão)</option>
                      {FontManager.getAvailableFonts().map(f => (
                        <option key={f.key} value={f.family}>{f.name}</option>
                      ))}
                    </select>
                    <input type="number" min={10} className="px-2 py-2 bg-gray-100 border-0 rounded-md" placeholder="Tamanho" value={titleFontSize ?? ''} onChange={e=>{ setTitleFontSize(e.target.value ? parseInt(e.target.value) : undefined); setDirtyTitleSize(true); }} />
                    <select className="px-2 py-2 bg-gray-100 border-0 rounded-md" value={String(titleFontWeight ?? '')} onChange={e=>{ setTitleFontWeight(e.target.value ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value)) : undefined); setDirtyTitleWeight(true); }}>
                      <option value="">Peso</option>
                      {[100,200,300,400,500,600,700,800,900].map(w => <option key={w} value={String(w)}>{w}</option>)}
                    </select>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-gray-600 block mb-1">Cor</label>
                    <input type="color" className="px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={titleColor} onChange={e=>{ setTitleColor(e.target.value); setDirtyTitleColor(true); }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Container do Article</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fundo</label>
                      <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={backgroundColor || '#ffffff'} onChange={e=>{ setBackgroundColor(e.target.value); setDirtyBg(true); }} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Opacidade</label>
                      <input type="number" min={0} max={1} step={0.05} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={opacity ?? ''} onChange={e=>{ setOpacity(e.target.value===''?undefined:parseFloat(e.target.value)); setDirtyOpacity(true); }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Borda (px)</label>
                      <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderWidth ?? ''} onChange={e=>{ setBorderWidth(e.target.value===''?undefined:parseInt(e.target.value)); setDirtyBWidth(true); }} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Estilo</label>
                      <select className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderStyle} onChange={e=>{ setBorderStyle((e.target.value as any) || ''); setDirtyBStyle(true); }}>
                        <option value="">(padrão)</option>
                        <option value="solid">solid</option>
                        <option value="dashed">dashed</option>
                        <option value="dotted">dotted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cor</label>
                      <input type="color" className="w-full px-1 py-1 bg-gray-100 border-0 rounded-md h-10" value={borderColor || '#e5e7eb'} onChange={e=>{ setBorderColor(e.target.value); setDirtyBColor(true); }} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Raio (px)</label>
                      <input type="number" min={0} className="w-full px-2 py-2 bg-gray-100 border-0 rounded-md" value={borderRadius ?? ''} onChange={e=>{ setBorderRadius(e.target.value===''?undefined:parseInt(e.target.value)); setDirtyBRadius(true); }} />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="chart">
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Layout</div>
                  <select className="w-full px-2 py-2 bg-gray-100 rounded" value={layout} onChange={e=>setLayout(e.target.value)}>
                    <option value="vertical">vertical</option>
                    <option value="horizontal">horizontal</option>
                  </select>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Cores</div>
                  <input className="w-full px-2 py-2 bg-gray-100 rounded" placeholder='#2563eb ou #2563eb,#22c55e ou ["#2563eb"]' value={colorsText} onChange={e=>setColorsText(e.target.value)} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Espaçamento</div>
                  <div className="flex items-center gap-2">
                    <input className="w-20 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="padding" value={padding ?? ''} onChange={e=>setPadding(e.target.value===''?undefined:Number(e.target.value))} />
                    <input className="w-24 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="innerPadding" value={innerPadding ?? ''} onChange={e=>setInnerPadding(e.target.value===''?undefined:Number(e.target.value))} />
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-600 mb-1">Grid</div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={enableGridX} onChange={e=>setEnableGridX(e.target.checked)} /> Grid X</label>
                    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={enableGridY} onChange={e=>setEnableGridY(e.target.checked)} /> Grid Y</label>
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs">Cor</span>
                      <input type="color" value={gridColor} onChange={e=>setGridColor(e.target.value)} />
                      <span className="text-xs">Esp.</span>
                      <input type="number" className="w-16 px-2 py-1 rounded bg-gray-100" min={0} value={gridStrokeWidth} onChange={e=>setGridStrokeWidth(e.target.value===''?0:Number(e.target.value))} />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Axis Bottom</div>
                  <input className="w-full px-2 py-1 bg-gray-100 rounded mb-1" placeholder="Legenda" value={axisBottomLegend} onChange={e=>setAxisBottomLegend(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <input className="w-20 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="Rotação" value={axisBottomTickRotation} onChange={e=>setAxisBottomTickRotation(e.target.value===''?0:Number(e.target.value))} />
                    <input className="w-24 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="Offset" value={axisBottomLegendOffset ?? ''} onChange={e=>setAxisBottomLegendOffset(e.target.value===''?undefined:Number(e.target.value))} />
                    <select className="px-2 py-1 bg-gray-100 rounded" value={axisBottomLegendPosition} onChange={e=>setAxisBottomLegendPosition(e.target.value)}>
                      <option value="start">start</option>
                      <option value="middle">middle</option>
                      <option value="end">end</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Axis Left</div>
                  <input className="w-full px-2 py-1 bg-gray-100 rounded mb-1" placeholder="Legenda" value={axisLeftLegend} onChange={e=>setAxisLeftLegend(e.target.value)} />
                  <input className="w-24 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="Offset" value={axisLeftLegendOffset ?? ''} onChange={e=>setAxisLeftLegendOffset(e.target.value===''?undefined:Number(e.target.value))} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Rótulos e Legenda</div>
                  <label className="flex items-center gap-2 text-xs mb-1"><input type="checkbox" checked={enableLabel} onChange={e=>setEnableLabel(e.target.checked)} /> enableLabel</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={showLegend} onChange={e=>setShowLegend(e.target.checked)} /> showLegend</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <select className="px-2 py-1 bg-gray-100 rounded" value={labelPosition} onChange={e=>setLabelPosition(e.target.value as any)}>
                      <option value="start">start</option>
                      <option value="middle">middle</option>
                      <option value="end">end</option>
                    </select>
                    <input className="px-2 py-1 bg-gray-100 rounded" type="number" placeholder="labelOffset" value={labelOffset ?? ''} onChange={e=>setLabelOffset(e.target.value===''?undefined:Number(e.target.value))} />
                    <input className="px-2 py-1 bg-gray-100 rounded" type="color" value={labelTextColor} onChange={e=>setLabelTextColor(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <input className="w-20 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="skipWidth" value={labelSkipWidth ?? ''} onChange={e=>setLabelSkipWidth(e.target.value===''?undefined:Number(e.target.value))} />
                    <input className="w-24 px-2 py-1 bg-gray-100 rounded" type="number" placeholder="skipHeight" value={labelSkipHeight ?? ''} onChange={e=>setLabelSkipHeight(e.target.value===''?undefined:Number(e.target.value))} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">Animação</div>
                  <label className="flex items-center gap-2 text-xs mb-1"><input type="checkbox" checked={animate} onChange={e=>setAnimate(e.target.checked)} /> animate</label>
                  <select className="w-full px-2 py-1 bg-gray-100 rounded" value={motionConfig} onChange={e=>setMotionConfig(e.target.value)}>
                    {['default','gentle','wobbly','stiff','slow'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="query">
              {/* Query Editor */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">Query</label>
                  <button className="text-xs text-blue-600 hover:underline" onClick={() => {
                    const t = table.trim().toLowerCase()
                    if (!t) return
                    if (TABLE_META[t]) {
                      setMeasureAgg('SUM');
                      setMeasureField(TABLE_META[t].defaultMeasureField);
                      setTimeDimension(TABLE_META[t].defaultTimeColumn);
                    }
                    setDirtyQuery(true)
                  }}>Reset defaults</button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Schema</label>
                    <select className="w-full px-2 py-1 bg-gray-100 rounded" value={schema} onChange={e=>{ setSchema(e.target.value); setDirtyQuery(true) }}>
                      {SCHEMAS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Table</label>
                    <select className="w-full px-2 py-1 bg-gray-100 rounded" value={table} onChange={e=>{
                      const v = e.target.value; setTable(v);
                      const meta = TABLE_META[v];
                      if (meta) {
                        if (!meta.measureFields.includes(measureField)) setMeasureField(meta.defaultMeasureField);
                        if (!meta.timeColumns.includes(timeDimension)) setTimeDimension(meta.defaultTimeColumn);
                        if (dimension && !meta.dimensions.includes(dimension)) setDimension('');
                      }
                      setDirtyQuery(true)
                    }}>
                      <option value="">Selecione…</option>
                      {TABLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Measure</label>
                    <div className="flex gap-2">
                      <select className="px-2 py-1 bg-gray-100 rounded w-28" value={measureAgg} onChange={e=>{ setMeasureAgg(e.target.value as any); setDirtyQuery(true); }}>
                        {AGGS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      <select className="flex-1 px-2 py-1 bg-gray-100 rounded" value={measureField} onChange={e=>{ setMeasureField(e.target.value); setDirtyQuery(true); }}>
                        <option value="">Selecione…</option>
                        {(TABLE_META[table]?.measureFields || []).map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Dimension</label>
                    <select className="w-full px-2 py-1 bg-gray-100 rounded" value={dimension} onChange={e=>{ setDimension(e.target.value); setDirtyQuery(true) }}>
                      <option value="">(Nenhuma)</option>
                      {(TABLE_META[table]?.dimensions || []).map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">timeDimension</label>
                    <select className="w-full px-2 py-1 bg-gray-100 rounded" value={timeDimension} onChange={e=>{ setTimeDimension(e.target.value); setDirtyQuery(true) }}>
                      <option value="">(Nenhuma)</option>
                      {(TABLE_META[table]?.timeColumns || []).map(tc => <option key={tc} value={tc}>{tc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">From</label>
                    <input type="date" className="w-full px-2 py-1 bg-gray-100 rounded" value={from} onChange={e=>{ setFrom(e.target.value); setDirtyQuery(true) }} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">To</label>
                    <input type="date" className="w-full px-2 py-1 bg-gray-100 rounded" value={to} onChange={e=>{ setTo(e.target.value); setDirtyQuery(true) }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Limit</label>
                    <input type="number" min={1} max={50} className="w-full px-2 py-1 bg-gray-100 rounded" value={limit} onChange={e=>{ setLimit(e.target.value ? parseInt(e.target.value) : 5); setDirtyQuery(true) }} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 block mb-1">Order</label>
                    <select className="w-full px-2 py-1 bg-gray-100 rounded" value={order} onChange={e=>{ setOrder(e.target.value as any); setDirtyQuery(true) }}>
                      <option value="value DESC">value DESC</option>
                      <option value="value ASC">value ASC</option>
                      <option value="label ASC">label ASC</option>
                      <option value="label DESC">label DESC</option>
                    </select>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-600">Where rules</label>
                    <button className="text-xs text-blue-600 hover:underline" onClick={()=>{ setWhere([...(where||[]), { col: '', op: '=', val: '' }]); setDirtyQuery(true) }}>+ Regra</button>
                  </div>
                  <div className="space-y-2">
                    {(where || []).map((r, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <input className="col-span-3 px-2 py-1 bg-gray-100 rounded" placeholder="col" value={r.col} onChange={e=>{ const w=[...where]; w[idx]={...w[idx], col:e.target.value}; setWhere(w); setDirtyQuery(true) }} />
                        <select className="col-span-2 px-2 py-1 bg-gray-100 rounded" value={r.op} onChange={e=>{ const w=[...where]; w[idx]={...w[idx], op:e.target.value}; setWhere(w); setDirtyQuery(true) }}>
                          <option value="=">=</option>
                          <option value="in">in</option>
                          <option value="between">between</option>
                          <option value="like">like</option>
                        </select>
                        <input className="col-span-3 px-2 py-1 bg-gray-100 rounded" placeholder="val(s)" value={r.vals !== undefined ? r.vals : (r.val || '')} onChange={e=>{ const w=[...where]; const op=(w[idx].op||'').toLowerCase(); if (op==='in') w[idx]={...w[idx], vals:e.target.value}; else if(op==='between'){ /* ignore here */ } else w[idx]={...w[idx], val:e.target.value}; setWhere(w); setDirtyQuery(true) }} />
                        <input className="col-span-2 px-2 py-1 bg-gray-100 rounded" placeholder="start" value={r.start || ''} onChange={e=>{ const w=[...where]; w[idx]={...w[idx], start:e.target.value}; setWhere(w); setDirtyQuery(true) }} />
                        <input className="col-span-2 px-2 py-1 bg-gray-100 rounded" placeholder="end" value={r.end || ''} onChange={e=>{ const w=[...where]; w[idx]={...w[idx], end:e.target.value}; setWhere(w); setDirtyQuery(true) }} />
                        <button className="col-span-12 text-xs text-red-600 hover:underline" onClick={()=>{ const w=[...where]; w.splice(idx,1); setWhere(w); setDirtyQuery(true) }}>remover</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700">Cancelar</button>
          <button onClick={() => onSave({
            titleText,
            titleFontFamily: dirtyTitleFamily ? titleFontFamily : undefined,
            titleFontSize: dirtyTitleSize ? titleFontSize : undefined,
            titleFontWeight: dirtyTitleWeight ? titleFontWeight : undefined,
            titleColor: dirtyTitleColor ? titleColor : undefined,
            backgroundColor: dirtyBg ? backgroundColor : undefined,
            opacity: dirtyOpacity ? opacity : undefined,
            borderColor: dirtyBColor ? borderColor : undefined,
            borderWidth: dirtyBWidth ? borderWidth : undefined,
            borderStyle: dirtyBStyle ? borderStyle : undefined,
            borderRadius: dirtyBRadius ? borderRadius : undefined,
            widthFr,
            chartProps: {
              layout,
              groupMode,
              enableGridX,
              enableGridY,
              gridColor,
              gridStrokeWidth,
              colors: parseColors(colorsText),
              showLegend,
              enableLabel,
              labelPosition,
              ...(labelOffset !== undefined ? { labelOffset } : {}),
              ...(labelSkipWidth !== undefined ? { labelSkipWidth } : {}),
              ...(labelSkipHeight !== undefined ? { labelSkipHeight } : {}),
              labelTextColor,
              ...(padding !== undefined ? { padding } : {}),
              ...(innerPadding !== undefined ? { innerPadding } : {}),
              animate,
              motionConfig,
              axisBottom: {
                ...(axisBottomLegend ? { legend: axisBottomLegend } : {}),
                ...(axisBottomLegendOffset !== undefined ? { legendOffset: axisBottomLegendOffset } : {}),
                ...(axisBottomLegendPosition ? { legendPosition: axisBottomLegendPosition } : {}),
                tickRotation: axisBottomTickRotation,
                ...(axisBottomTickSize !== undefined ? { tickSize: axisBottomTickSize } : {}),
                ...(axisBottomTickPadding !== undefined ? { tickPadding: axisBottomTickPadding } : {}),
              },
              axisLeft: {
                ...(axisLeftLegend ? { legend: axisLeftLegend } : {}),
                ...(axisLeftLegendOffset !== undefined ? { legendOffset: axisLeftLegendOffset } : {}),
                ...(axisLeftTickSize !== undefined ? { tickSize: axisLeftTickSize } : {}),
                ...(axisLeftTickPadding !== undefined ? { tickPadding: axisLeftTickPadding } : {}),
              }
              ,
              ...(barBorderRadius !== undefined ? { borderRadius: barBorderRadius } : {}),
              ...(barBorderWidth !== undefined ? { borderWidth: barBorderWidth } : {}),
              ...(barOpacity !== undefined ? { barOpacity } : {}),
              ...(showLegend ? { legends: { anchor: legendAnchor, direction: legendDirection, ...(legendTranslateY !== undefined ? { translateY: legendTranslateY } : {}) } } : {}),
            },
            query: dirtyQuery ? {
              schema,
              table,
              measure: (measureField ? `${measureAgg}(${measureField})` : undefined),
              dimension,
              timeDimension,
              from,
              to,
              limit,
              order,
              where: (where || []).map(r => ({ ...r }))
            } : undefined,
          })} className="px-4 py-2 rounded-md bg-blue-600 text-white">Salvar</button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  const root = typeof document !== 'undefined' ? document.body : null;
  return root ? createPortal(modal, root) : null;
}
