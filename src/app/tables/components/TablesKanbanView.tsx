'use client';

import { useMemo, useState } from 'react';
import { useSupabaseTables } from '../hooks/useSupabaseTables';
import { SUPABASE_DATASETS } from '@/data/supabaseDatasets';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
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

function SortableCard({ card, titleField, datasetConfig }: {
  card: KanbanCard;
  titleField: string | null;
  datasetConfig: typeof SUPABASE_DATASETS[0] | undefined;
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

  const title = titleField ? card.data[titleField] : card.id;

  // Get first 3 displayable fields
  const displayFields = datasetConfig?.columnDefs
    .filter(col => col.field !== 'id' && col.field !== 'status' && col.field !== 'created_at' && col.field !== 'updated_at')
    .slice(0, 3) || [];

  const formatValue = (value: unknown, fieldName: string): string => {
    if (value === null || value === undefined) return '—';

    if (fieldName?.includes('valor') || fieldName?.includes('preco')) {
      const num = Number(value);
      if (!isNaN(num)) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(num);
      }
    }

    if (fieldName?.includes('data')) {
      const date = new Date(String(value));
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR');
      }
    }

    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }

    return String(value);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-2">
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
            {formatValue(title, titleField || '')}
          </h4>
          <div className="space-y-1">
            {displayFields.map((field) => {
              const value = card.data[field.field || ''];
              if (!value) return null;

              return (
                <div key={field.field} className="text-xs text-gray-600">
                  <span className="font-medium">{field.headerName}:</span>{' '}
                  {formatValue(value, field.field || '')}
                </div>
              );
            })}
          </div>
          <div className="text-xs text-gray-400 border-t pt-1">
            ID: {card.id}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TablesKanbanView({ tableName }: TablesKanbanViewProps) {
  const { data, loading, error, refetch } = useSupabaseTables(tableName || '');
  const [activeId, setActiveId] = useState<string | null>(null);
  const datasetConfig = SUPABASE_DATASETS.find(ds => ds.tableName === tableName);

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

  // Group data by status
  const kanbanData = useMemo(() => {
    if (!data.length) return {};

    const grouped: Record<string, KanbanCard[]> = {};

    data.forEach((row: Record<string, unknown>) => {
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
  }, [data]);

  const columns = Object.keys(kanbanData);

  // Get status color
  const getStatusColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'bg-green-100 border-green-300';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft')) {
      return 'bg-yellow-100 border-yellow-300';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'bg-red-100 border-red-300';
    }
    if (statusLower.includes('andamento')) {
      return 'bg-blue-100 border-blue-300';
    }

    return 'bg-gray-100 border-gray-300';
  };

  const getStatusTextColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || '';

    if (statusLower.includes('pago') || statusLower.includes('conclu') || statusLower.includes('aprovado') || statusLower.includes('autorizada')) {
      return 'text-green-800';
    }
    if (statusLower.includes('pendente') || statusLower.includes('draft')) {
      return 'text-yellow-800';
    }
    if (statusLower.includes('vencido') || statusLower.includes('reprovado') || statusLower.includes('cancelad')) {
      return 'text-red-800';
    }
    if (statusLower.includes('andamento')) {
      return 'text-blue-800';
    }

    return 'text-gray-800';
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
      try {
        const { error } = await supabase
          .from(tableName)
          .update({ status: newStatus })
          .eq('id', activeId);

        if (error) {
          console.error('Error updating status:', error);
        } else {
          // Refetch data to update UI
          refetch?.();
        }
      } catch (err) {
        console.error('Error updating card:', err);
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
      <div className="h-full overflow-x-auto bg-gray-50 p-6">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((status) => {
            const cards = kanbanData[status];
            const cardIds = cards.map(c => c.id);

            return (
              <div
                key={status}
                id={`column-${status}`}
                className="flex-shrink-0 w-80"
              >
                <div className={`rounded-lg border-2 h-full flex flex-col ${getStatusColor(status)}`}>
                  {/* Column Header */}
                  <div className="p-3 border-b border-gray-300">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-semibold text-sm uppercase ${getStatusTextColor(status)}`}>
                        {status}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {cards.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Column Body - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                      {cards.map((card) => (
                        <SortableCard
                          key={card.id}
                          card={card}
                          titleField={titleField}
                          datasetConfig={datasetConfig}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </div>
              </div>
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
