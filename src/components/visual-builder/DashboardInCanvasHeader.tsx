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
import { useStore } from '@nanostores/react';
import { $headerUi, resolveHeaderStyle } from '@/stores/ui/headerUiStore';
import type { ThemeName } from './ThemeManager';

interface DashboardInCanvasHeaderProps {
  title: string;
  subtitle?: string;
  currentFilter: DateRangeFilter;
  onFilterChange: (filter: DateRangeFilter) => void;
  isLoading?: boolean;
  rightExtras?: React.ReactNode;
  containerPadding?: number; // used to collapse container padding (left/right/top)
  themeName?: ThemeName;
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
  rightExtras,
  containerPadding = 0,
  themeName
}: DashboardInCanvasHeaderProps) {
  const headerUi = useStore($headerUi);
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

  const headerStyle = resolveHeaderStyle(themeName, headerUi.variant);
  const variantKind = (headerUi.variant === 'auto' ? (themeName === 'light' ? 'light' : 'dark') : headerUi.variant);
  const isDark = variantKind === 'dark';

  return (
    <div
      className="sticky top-0 z-20 border-b"
      style={{
        marginLeft: -containerPadding,
        marginRight: -containerPadding,
        background: headerStyle.background,
        borderBottomColor: headerStyle.borderBottomColor,
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
      }}
    >
      <div
        className="flex items-center justify-between py-5 md:py-6"
        style={{ paddingLeft: containerPadding, paddingRight: containerPadding }}
      >
        <div className="min-w-0 flex flex-col space-y-0.5">
          <h2
            className="text-lg md:text-xl font-semibold leading-tight tracking-tight truncate"
            style={{ color: headerStyle.textPrimary }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xs md:text-sm leading-snug truncate"
              style={{ color: headerStyle.textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2">
              <Calendar className="h-4 w-4" style={{ color: headerStyle.textSecondary }} />
              <span className="text-sm font-medium" style={{ color: headerStyle.textSecondary }}>Periodo</span>
            </div>
            <Select value={selectedType} onValueChange={handleFilterTypeChange} disabled={isLoading}>
              <SelectTrigger
                className="w-44 sm:w-56 h-9 rounded-md"
                style={{
                  backgroundColor: 'transparent',
                  color: headerStyle.textPrimary,
                  borderColor: headerStyle.borderBottomColor,
                }}
              >
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent
                className="rounded-md border"
                style={{
                  backgroundColor: headerStyle.background,
                  color: headerStyle.textPrimary,
                  borderColor: headerStyle.borderBottomColor,
                }}
              >
                {DATE_RANGE_OPTIONS.map(opt => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={isDark ? 'hover:bg-gray-800 focus:bg-gray-800' : 'hover:bg-gray-100 focus:bg-gray-100'}
                    style={{ color: headerStyle.textPrimary }}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 h-9"
              style={{
                backgroundColor: 'transparent',
                color: headerStyle.textPrimary,
                borderColor: headerStyle.borderBottomColor,
              }}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
          <div className="hidden lg:block text-sm" style={{ color: headerStyle.textSecondary }}>
            <span className="font-medium" style={{ color: headerStyle.textPrimary }}>{currentLabel}</span>
            {dateRangeDescription && (
              <span className="ml-2">({dateRangeDescription})</span>
            )}
          </div>
          {rightExtras}
        </div>
      </div>
    </div>
  );
}
