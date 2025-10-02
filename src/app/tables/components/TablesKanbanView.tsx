'use client';

import { useMemo, useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText } from 'lucide-react';
import {
  $kanbanTitleColor,
  $kanbanTitleSize,
  $kanbanTitleWeight,
  $kanbanTitleLetterSpacing,
  $kanbanNameColor,
  $kanbanNameSize,
  $kanbanNameWeight,
  $kanbanNameLetterSpacing,
  $kanbanTitleFontFamily,
  $kanbanNameFontFamily,
} from '@/stores/table/tablePreferences';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface TablesKanbanViewProps {
  tableName: string | null;
}

interface KanbanCard {
  id: string;
  status: string;
  data: Record<string, unknown>;
}

function SortableCard({
  card,
  titleField,
  datasetConfig,
  statusBadgeColor,
  kanbanTitleColor,
  kanbanTitleSize,
  kanbanTitleWeight,
  kanbanTitleLetterSpacing,
  kanbanNameColor,
  kanbanNameSize,
  kanbanNameWeight,
  kanbanNameLetterSpacing,
  kanbanTitleFontFamily,
  kanbanNameFontFamily,
}: {
  card: KanbanCard;
  titleField: string | null;
  datasetConfig: typeof SUPABASE_DATASETS[0] | undefined;
  statusBadgeColor: string;
  kanbanTitleColor: string;
  kanbanTitleSize: number;
  kanbanTitleWeight: number;
  kanbanTitleLetterSpacing: string;
  kanbanNameColor: string;
  kanbanNameSize: number;
  kanbanNameWeight: number;
  kanbanNameLetterSpacing: string;
  kanbanTitleFontFamily: string;
  kanbanNameFontFamily: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Identificar campos principais
  const titleValue = titleField ? card.data[titleField] : card.id;
  const title = String(titleValue || '');

  // Categoria: categoria, category
  const categoriaField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('categoria') || col.field?.includes('category')
  );
  const categoria = categoriaField ? String(card.data[categoriaField.field || ''] || '') : null;

  // Tipo: tipo, type
  const tipoField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('tipo') || col.field?.includes('type')
  );
  const tipo = tipoField ? String(card.data[tipoField.field || ''] || '') : null;

  // Prioridade: prioridade, priority
  const prioridadeField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('prioridade') || col.field?.includes('priority')
  );
  const prioridade = prioridadeField ? String(card.data[prioridadeField.field || ''] || '') : null;

  // Sprint: sprint, iteracao
  const sprintField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('sprint') || col.field?.includes('iteracao')
  );
  const sprint = sprintField ? String(card.data[sprintField.field || ''] || '') : null;

  // Valor: valor, amount, preco
  const valorField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('valor') ||
           col.field?.includes('amount') ||
           col.field?.includes('preco')
  );
  const valor = valorField ? card.data[valorField.field || ''] : null;

  const formatCurrency = (value: unknown): string => {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(num);
    }
    return String(value);
  };

  const valorFormatado = valor ? formatCurrency(valor) : null;

  // Alerta: vencido, urgente
  const statusLower = String(card.status || '').toLowerCase();
  const isUrgent = statusLower.includes('vencid') || statusLower.includes('urgente');

  // Cores dos badges baseadas no tipo
  const getBadgeColor = (value: string, type: 'categoria' | 'tipo' | 'prioridade'): string => {
    const lowerValue = value.toLowerCase();

    // Bug/Error - vermelho
    if (lowerValue.includes('bug') || lowerValue.includes('erro')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    // Epic/Feature - roxo
    if (lowerValue.includes('epic') || lowerValue.includes('feature')) {
      return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    // Task - amarelo/laranja
    if (lowerValue.includes('task') || lowerValue.includes('tarefa')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    // Urgente - vermelho
    if (lowerValue.includes('urgent') || lowerValue.includes('alta')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    // Padrão - cinza
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-2 cursor-grab active:cursor-grabbing hover:brightness-95 transition-all border-gray-200 bg-white rounded-md"
        style={{
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 2px 3px -2px rgba(0,0,0,0.05), 0 3px 12px -4px rgba(0,0,0,0.04), 0 4px 16px -8px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent className="px-2.5 pt-0 pb-0 space-y-2">
          {/* 1. Ícone + Título */}
          <div className="flex items-start gap-1.5">
            <FileText className="h-4 w-4 text-gray-600 flex-shrink-0 mt-0.5" />
            <h4
              className="line-clamp-2 flex-1"
              style={{
                fontSize: `${kanbanTitleSize}px`,
                fontWeight: kanbanTitleWeight,
                letterSpacing: kanbanTitleLetterSpacing,
                color: kanbanTitleColor,
                fontFamily: kanbanTitleFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
              }}
            >
              {title}
            </h4>
          </div>

          {/* 2. Pessoas (ícone + nome) hardcoded */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
              <span
                style={{
                  fontSize: `${kanbanNameSize}px`,
                  fontWeight: kanbanNameWeight,
                  letterSpacing: kanbanNameLetterSpacing,
                  color: kanbanNameColor,
                  fontFamily: kanbanNameFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
                }}
              >
                Camille Ricketts
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gray-300 flex-shrink-0" />
              <span
                style={{
                  fontSize: `${kanbanNameSize}px`,
                  fontWeight: kanbanNameWeight,
                  letterSpacing: kanbanNameLetterSpacing,
                  color: kanbanNameColor,
                  fontFamily: kanbanNameFontFamily === 'Inter' ? 'var(--font-inter)' : 'var(--font-geist-sans)',
                }}
              >
                Nate Martins
              </span>
            </div>
          </div>

          {/* 3. Badges hardcoded */}
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-xs px-1.5 py-0.5 rounded-sm border font-normal"
              style={{
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderColor: '#fecaca',
              }}
            >
              Bug
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-sm border font-normal"
              style={{
                backgroundColor: '#faf5ff',
                color: '#6b21a8',
                borderColor: '#e9d5ff',
              }}
            >
              Epic
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-sm border font-normal"
              style={{
                backgroundColor: '#f9fafb',
                color: '#374151',
                borderColor: '#e5e7eb',
              }}
            >
              Sprint 20
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DroppableColumn({
  status,
  cards,
  titleField,
  datasetConfig,
  getStatusBadgeColor,
  getStatusTextColor,
  kanbanTitleColor,
  kanbanTitleSize,
  kanbanTitleWeight,
  kanbanTitleLetterSpacing,
  kanbanNameColor,
  kanbanNameSize,
  kanbanNameWeight,
  kanbanNameLetterSpacing,
  kanbanTitleFontFamily,
  kanbanNameFontFamily,
}: {
  status: string;
  cards: KanbanCard[];
  titleField: string | null;
  datasetConfig: typeof SUPABASE_DATASETS[0] | undefined;
  getStatusBadgeColor: (status: string) => string;
  getStatusTextColor: (status: string) => string;
  kanbanTitleColor: string;
  kanbanTitleSize: number;
  kanbanTitleWeight: number;
  kanbanTitleLetterSpacing: string;
  kanbanNameColor: string;
  kanbanNameSize: number;
  kanbanNameWeight: number;
  kanbanNameLetterSpacing: string;
  kanbanTitleFontFamily: string;
  kanbanNameFontFamily: string;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  const cardIds = cards.map(c => c.id);

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80"
    >
      <div className={`rounded-lg border border-gray-200 flex flex-col bg-gray-50 ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
        {/* Column Header */}
        <div className="p-3 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusBadgeColor(status)}`}></div>
            <h3 className="font-semibold text-sm text-gray-900">
              {status}
            </h3>
            <span className="ml-auto text-xs text-gray-500">
              {cards.length}
            </span>
          </div>
        </div>

        {/* Column Body */}
        <div className="px-2 pt-2 pb-3">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                titleField={titleField}
                datasetConfig={datasetConfig}
                statusBadgeColor={getStatusBadgeColor(card.status)}
                kanbanTitleColor={kanbanTitleColor}
                kanbanTitleSize={kanbanTitleSize}
                kanbanTitleWeight={kanbanTitleWeight}
                kanbanTitleLetterSpacing={kanbanTitleLetterSpacing}
                kanbanNameColor={kanbanNameColor}
                kanbanNameSize={kanbanNameSize}
                kanbanNameWeight={kanbanNameWeight}
                kanbanNameLetterSpacing={kanbanNameLetterSpacing}
                kanbanTitleFontFamily={kanbanTitleFontFamily}
                kanbanNameFontFamily={kanbanNameFontFamily}
              />
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

export default function TablesKanbanView({ tableName }: TablesKanbanViewProps) {
  const { data, loading, error } = useSupabaseTables(tableName || '');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localData, setLocalData] = useState<Array<Record<string, unknown>>>([]);
  const datasetConfig = SUPABASE_DATASETS.find(ds => ds.tableName === tableName);

  // Kanban styles from nanostores
  const kanbanTitleColor = useStore($kanbanTitleColor);
  const kanbanTitleSize = useStore($kanbanTitleSize);
  const kanbanTitleWeight = useStore($kanbanTitleWeight);
  const kanbanTitleLetterSpacing = useStore($kanbanTitleLetterSpacing);
  const kanbanNameColor = useStore($kanbanNameColor);
  const kanbanNameSize = useStore($kanbanNameSize);
  const kanbanNameWeight = useStore($kanbanNameWeight);
  const kanbanNameLetterSpacing = useStore($kanbanNameLetterSpacing);
  const kanbanTitleFontFamily = useStore($kanbanTitleFontFamily);
  const kanbanNameFontFamily = useStore($kanbanNameFontFamily);

  // Sync local data with server data
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Find title field
  const titleField = useMemo(() => {
    if (!datasetConfig?.columnDefs) return null;

    const candidates = datasetConfig.columnDefs.find(
      col => col.field !== 'id' &&
             (col.field?.includes('nome') ||
              col.field?.includes('titulo') ||
              col.field?.includes('numero'))
    );

    return candidates?.field || datasetConfig.columnDefs[1]?.field || null;
  }, [datasetConfig]);

  // Group data by status (using localData for optimistic updates)
  const kanbanData = useMemo(() => {
    if (!localData.length) return {};

    const grouped: Record<string, KanbanCard[]> = {};

    localData.forEach((row: Record<string, unknown>) => {
      const status = String(row.status || 'sem-status');
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push({
        id: String(row.id),
        status,
        data: row,
      });
    });

    return grouped;
  }, [localData]);

  // Get status order for consistent column ordering
  const getStatusOrder = (status: string): number => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('vencido')) return 1;
    if (statusLower.includes('pendente')) return 2;
    if (statusLower.includes('andamento') || statusLower.includes('draft') || statusLower.includes('aberta')) return 3;
    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) return 4;
    if (statusLower.includes('cancelad') || statusLower.includes('reprovado') || statusLower.includes('denegada')) return 5;
    return 99; // outros no final
  };

  // Sort columns consistently to prevent position jumping
  const columns = Object.keys(kanbanData).sort((a, b) =>
    getStatusOrder(a) - getStatusOrder(b)
  );

  // Get status badge color (pill style)
  const getStatusBadgeColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'bg-green-500';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft') || statusLower.includes('fazer')) {
      return 'bg-yellow-500';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'bg-red-500';
    }
    if (statusLower.includes('andamento') || statusLower.includes('progresso') || statusLower.includes('revisão')) {
      return 'bg-blue-500';
    }

    return 'bg-gray-500';
  };

  const getStatusTextColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'text-green-700';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft') || statusLower.includes('fazer')) {
      return 'text-yellow-700';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'text-red-700';
    }
    if (statusLower.includes('andamento') || statusLower.includes('progresso') || statusLower.includes('revisão')) {
      return 'text-blue-700';
    }

    return 'text-gray-700';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);

    // Find the card being dragged
    let cardBeingDragged: KanbanCard | null = null;
    for (const cards of Object.values(kanbanData)) {
      const found = cards.find(c => c.id === activeId);
      if (found) {
        cardBeingDragged = found;
        break;
      }
    }

    if (!cardBeingDragged) {
      setActiveId(null);
      return;
    }

    // Determine new status
    let newStatus: string;
    if (overId.startsWith('column-')) {
      // Dropped on column header/area
      newStatus = overId.replace('column-', '');
    } else {
      // Dropped on another card
      for (const [status, cards] of Object.entries(kanbanData)) {
        if (cards.some(c => c.id === overId)) {
          newStatus = status;
          break;
        }
      }
      newStatus = newStatus!;
    }

    // Update Supabase if status changed
    if (newStatus && newStatus !== cardBeingDragged.status && tableName) {
      // Optimistic update: update local state immediately
      setLocalData(prevData =>
        prevData.map(item =>
          String(item.id) === activeId
            ? { ...item, status: newStatus }
            : item
        )
      );

      // Update Supabase in background
      try {
        // Tentar converter para número se possível, caso contrário usar string
        const idValue = isNaN(Number(activeId)) ? activeId : Number(activeId);

        const { error } = await supabase
          .from(tableName)
          .update({ status: newStatus })
          .eq('id', idValue);

        if (error) {
          console.error('Error updating status:', error);
          // Revert optimistic update on error
          setLocalData(data);
        }
      } catch (err) {
        console.error('Error updating card:', err);
        // Revert optimistic update on error
        setLocalData(data);
      }
    }

    setActiveId(null);
  };

  if (!tableName) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Selecione uma tabela</p>
          <p className="text-sm">Escolha uma tabela do painel lateral para visualizar os dados</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">Erro ao carregar dados</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!columns.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm">{`Esta tabela está vazia ou não possui campo 'status'`}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .kanban-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .kanban-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .kanban-scrollbar::-webkit-scrollbar-thumb {
          background: #9ca3af;
          border-radius: 3px;
        }
        .kanban-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
        .kanban-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #9ca3af transparent;
        }
      `}} />
      <div className="h-full overflow-auto bg-white px-3 py-3 kanban-scrollbar">
        <div className="flex gap-4 min-w-max">
          {columns.map((status) => {
            const cards = kanbanData[status];

            return (
              <DroppableColumn
                key={status}
                status={status}
                cards={cards}
                titleField={titleField}
                datasetConfig={datasetConfig}
                getStatusBadgeColor={getStatusBadgeColor}
                getStatusTextColor={getStatusTextColor}
                kanbanTitleColor={kanbanTitleColor}
                kanbanTitleSize={kanbanTitleSize}
                kanbanTitleWeight={kanbanTitleWeight}
                kanbanTitleLetterSpacing={kanbanTitleLetterSpacing}
                kanbanNameColor={kanbanNameColor}
                kanbanNameSize={kanbanNameSize}
                kanbanNameWeight={kanbanNameWeight}
                kanbanNameLetterSpacing={kanbanNameLetterSpacing}
                kanbanTitleFontFamily={kanbanTitleFontFamily}
                kanbanNameFontFamily={kanbanNameFontFamily}
              />
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <Card className="cursor-grabbing opacity-90 shadow-xl w-80">
            <CardContent className="p-3">
              <p className="font-semibold text-sm">Movendo...</p>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
