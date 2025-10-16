'use client';

import { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { DateRangeFilter, DateRangeType } from '@/stores/visualBuilderStore';

interface FilterHeaderProps {
  currentFilter: DateRangeFilter;
  onFilterChange: (filter: DateRangeFilter) => void;
  isLoading?: boolean;
}

const DATE_RANGE_OPTIONS = [
  { value: 'last_7_days', label: 'Ultimos 7 dias' },
  { value: 'last_30_days', label: 'Ultimos 30 dias' },
  { value: 'last_90_days', label: 'Ultimos 90 dias' },
  { value: 'current_month', label: 'Mes atual' },
  { value: 'last_month', label: 'Mes anterior' },
  { value: 'custom', label: 'Periodo personalizado' }
] as const;

export default function FilterHeader({ 
  currentFilter, 
  onFilterChange, 
  isLoading = false 
}: FilterHeaderProps) {
  const [selectedType, setSelectedType] = useState<DateRangeType>(currentFilter.type);

  const handleFilterTypeChange = (value: DateRangeType) => {
    setSelectedType(value);
    
    // Apply filter immediately for predefined ranges
    if (value !== 'custom') {
      const newFilter: DateRangeFilter = {
        type: value
      };
      onFilterChange(newFilter);
    }
  };

  const handleRefresh = () => {
    // Trigger refresh by calling onFilterChange with current filter
    onFilterChange(currentFilter);
  };

  const getCurrentLabel = () => {
    const option = DATE_RANGE_OPTIONS.find(opt => opt.value === currentFilter.type);
    return option?.label || 'Periodo personalizado';
  };

  const getDateRangeDescription = () => {
    const today = new Date();
    
    switch (currentFilter.type) {
      case 'last_7_days':
        const week_ago = new Date(today);
        week_ago.setDate(today.getDate() - 7);
        return `${week_ago.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      
      case 'last_30_days':
        const month_ago = new Date(today);
        month_ago.setDate(today.getDate() - 30);
        return `${month_ago.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      
      case 'last_90_days':
        const quarter_ago = new Date(today);
        quarter_ago.setDate(today.getDate() - 90);
        return `${quarter_ago.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      
      case 'current_month':
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return `${firstDay.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      
      case 'last_month':
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        return `${lastMonthStart.toLocaleDateString('pt-BR')} - ${lastMonthEnd.toLocaleDateString('pt-BR')}`;
      
      case 'custom':
        if (currentFilter.startDate && currentFilter.endDate) {
          return `${currentFilter.startDate} - ${currentFilter.endDate}`;
        }
        return 'Selecione datas';
      
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Periodo:</span>
        </div>
        
        <Select
          value={selectedType}
          onValueChange={handleFilterTypeChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o periodo" />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-1"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-500">
          <span className="font-medium">{getCurrentLabel()}</span>
          {getDateRangeDescription() && (
            <span className="ml-2 text-gray-400">
              ({getDateRangeDescription()})
            </span>
          )}
        </div>
        
        {isLoading && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Atualizando dashboards...</span>
          </div>
        )}
      </div>
    </div>
  );
}