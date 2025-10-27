'use client';

import { Calendar, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DateRangeFilter, DateRangeType } from '@/stores/visualBuilderStore';

interface DashboardInCanvasHeaderProps {
  title: string;
  subtitle?: string;
  currentFilter: DateRangeFilter;
  onFilterChange: (filter: DateRangeFilter) => void;
  isLoading?: boolean;
  rightExtras?: React.ReactNode;
}

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: 'last_7_days', label: 'Ultimos 7 dias' },
  { value: 'last_30_days', label: 'Ultimos 30 dias' },
  { value: 'last_90_days', label: 'Ultimos 90 dias' },
  { value: 'current_month', label: 'Mes atual' },
  { value: 'last_month', label: 'Mes anterior' },
  { value: 'custom', label: 'Periodo personalizado' }
];

export default function DashboardInCanvasHeader({
  title,
  subtitle,
  currentFilter,
  onFilterChange,
  isLoading = false,
  rightExtras
}: DashboardInCanvasHeaderProps) {
  const [selectedType, setSelectedType] = useState<DateRangeType>(currentFilter.type);

  const handleFilterTypeChange = (value: DateRangeType) => {
    setSelectedType(value);
    if (value !== 'custom') {
      onFilterChange({ type: value });
    }
  };

  const handleRefresh = () => {
    onFilterChange(currentFilter);
  };

  const currentLabel = useMemo(() => {
    const option = DATE_RANGE_OPTIONS.find(opt => opt.value === currentFilter.type);
    return option?.label || 'Periodo personalizado';
  }, [currentFilter.type]);

  const dateRangeDescription = useMemo(() => {
    const today = new Date();
    switch (currentFilter.type) {
      case 'last_7_days': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return `${weekAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_30_days': {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return `${monthAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_90_days': {
        const quarterAgo = new Date(today);
        quarterAgo.setDate(today.getDate() - 90);
        return `${quarterAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'current_month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return `${firstDay.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_month': {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}`;
      }
      case 'custom':
        if (currentFilter.startDate && currentFilter.endDate) {
          return `${currentFilter.startDate} - ${currentFilter.endDate}`;
        }
        return 'Selecione datas';
      default:
        return '';
    }
  }, [currentFilter]);

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-gray-200">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-600 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Periodo</span>
            </div>
            <Select value={selectedType} onValueChange={handleFilterTypeChange} disabled={isLoading}>
              <SelectTrigger className="w-44 sm:w-56">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          <div className="hidden lg:block text-sm text-gray-500">
            <span className="font-medium">{currentLabel}</span>
            {dateRangeDescription && (
              <span className="ml-2 text-gray-400">({dateRangeDescription})</span>
            )}
          </div>
          {rightExtras}
        </div>
      </div>
    </div>
  );
}

