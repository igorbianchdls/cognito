'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, AlertTriangle } from 'lucide-react';
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

function SortableCard({ card, titleField, datasetConfig, statusBadgeColor }: {
  card: KanbanCard;
  titleField: string | null;
  datasetConfig: typeof SUPABASE_DATASETS[0] | undefined;
  statusBadgeColor: string;
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

  // Subtitle: empresa, company, contato, cliente
  const subtitleField = datasetConfig?.columnDefs.find(
    col => col.field?.includes('empresa') ||
           col.field?.includes('company') ||
           col.field?.includes('contato') ||
           col.field?.includes('cliente')
  );
  const subtitleValue = subtitleField ? card.data[subtitleField.field || ''] : null;
  const subtitle = subtitleValue ? String(subtitleValue) : null;

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

  // Formatar valor ANTES do JSX
  const valorFormatado = valor ? formatCurrency(valor) : null;

  // Alerta: vencido, urgente
  const statusLower = String(card.status || '').toLowerCase();
  const isUrgent = statusLower.includes('vencid') || statusLower.includes('urgente');

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-2 cursor-grab active:cursor-grabbing hover:brightness-95 transition-all border-gray-200 bg-white"
        style={{
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 2px 3px -2px rgba(0,0,0,0.05), 0 3px 12px -4px rgba(0,0,0,0.04), 0 4px 16px -8px rgba(0,0,0,0.04)'
        }}
      >
        <CardContent className="p-2 space-y-2">
          {/* 1. Título - negrito preto */}
          <h4 className="font-bold text-sm text-gray-900 line-clamp-2">
            {title}
          </h4>

          {/* 2. Subtítulo - normal cinza */}
          {subtitle && (
            <p className="text-sm text-gray-500 font-normal line-clamp-1">
              {subtitle}
            </p>
          )}

          {/* 3. Footer: ícone + valor + alerta */}
          <div className="flex items-center justify-between pt-1">
            {/* Valor com ícone */}
            {valorFormatado && (
              <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                <User className="w-3.5 h-3.5 text-gray-400" />
                {valorFormatado}
              </div>
            )}

            {/* Badge alerta */}
            {isUrgent && (
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
            )}
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
  getStatusTextColor
}: {
  status: string;
  cards: KanbanCard[];
  titleField: string | null;
  datasetConfig: typeof SUPABASE_DATASETS[0] | undefined;
  getStatusBadgeColor: (status: string) => string;
  getStatusTextColor: (status: string) => string;
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
      <div className={`rounded-lg border border-gray-200 h-full flex flex-col bg-gray-50 ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
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

        {/* Column Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-2 pt-2 pb-3 kanban-scrollbar">
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                titleField={titleField}
                datasetConfig={datasetConfig}
                statusBadgeColor={getStatusBadgeColor(card.status)}
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
      <div className="h-full overflow-x-auto bg-white px-3 py-3 kanban-scrollbar">
        <div className="flex gap-4 h-full min-w-max">
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
