'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
 
import type { DateRangeFilter, DateRangeType } from '@/stores/visualBuilderStore';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
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
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'last_7_days', label: 'Últimos 7 dias' },
  { value: 'last_14_days', label: 'Últimos 14 dias' },
  { value: 'last_30_days', label: 'Últimos 30 dias' },
  { value: 'last_90_days', label: 'Últimos 90 dias' },
  { value: 'custom', label: 'Personalizado' }
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
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => {
    if (currentFilter.type === 'custom' && currentFilter.startDate && currentFilter.endDate) {
      return {
        from: new Date(currentFilter.startDate),
        to: new Date(currentFilter.endDate)
      };
    }
    return undefined;
  });

  // Note: keep selectedType controlled by user action to avoid flicker when opening custom picker

  const handleFilterTypeChange = (value: DateRangeType) => {
    setSelectedType(value);
    if (value !== 'custom') {
      onFilterChange({ type: value });
    } else {
      // Defer opening to avoid immediate close from Select's outside click
      setTimeout(() => setShowCustomPicker(true), 50);
    }
  };

  useEffect(() => {
    // Keep internal range in sync if currentFilter changes externally
    if (currentFilter.type === 'custom' && currentFilter.startDate && currentFilter.endDate) {
      setCustomRange({ from: new Date(currentFilter.startDate), to: new Date(currentFilter.endDate) });
    }
  }, [currentFilter]);

  const handleRefresh = () => {
    onFilterChange(currentFilter);
  };

  const currentLabel = useMemo(() => {
    if (currentFilter.type === 'custom' && currentFilter.startDate && currentFilter.endDate) {
      return `${currentFilter.startDate} - ${currentFilter.endDate}`;
    }
    const option = DATE_RANGE_OPTIONS.find(opt => opt.value === currentFilter.type);
    return option?.label || 'Selecionar período';
  }, [currentFilter.type, currentFilter.startDate, currentFilter.endDate]);

  const dateRangeDescription = useMemo(() => {
    const today = new Date();
    switch (currentFilter.type) {
      case 'today': {
        return `${today.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'yesterday': {
        const y = new Date(today);
        y.setDate(today.getDate() - 1);
        return `${y.toLocaleDateString('pt-BR')} - ${y.toLocaleDateString('pt-BR')}`;
      }
      case 'last_7_days': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        return `${weekAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_14_days': {
        const d = new Date(today);
        d.setDate(today.getDate() - 13);
        return `${d.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_30_days': {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 29);
        return `${monthAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
      }
      case 'last_90_days': {
        const quarterAgo = new Date(today);
        quarterAgo.setDate(today.getDate() - 89);
        return `${quarterAgo.toLocaleDateString('pt-BR')} - ${today.toLocaleDateString('pt-BR')}`;
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
  const isLightTheme = themeName === 'branco' || themeName === 'cinza-claro';
  const variantKind = (headerUi.variant === 'auto' ? (isLightTheme ? 'light' : 'dark') : headerUi.variant);
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
        fontFamily: headerStyle.fontFamily,
      }}
    >
      <div
        className="flex items-center justify-between py-4 md:py-6"
        style={{ paddingLeft: containerPadding, paddingRight: containerPadding }}
      >
        <div className="min-w-0 flex flex-col space-y-0.5">
          <h2
            className="text-base md:text-lg font-semibold leading-tight truncate"
            style={{ color: headerStyle.textPrimary }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-xs md:text-sm truncate"
              style={{ color: headerStyle.textSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:block text-sm" style={{ color: headerStyle.textSecondary }}>
            <span className="font-medium" style={{ color: headerStyle.textPrimary }}>{currentLabel}</span>
            {dateRangeDescription && (
              <span className="ml-2">({dateRangeDescription})</span>
            )}
          </div>
          <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                style={{
                  backgroundColor: 'transparent',
                  color: headerStyle.textPrimary,
                  borderColor: headerStyle.datePickerBorderColor || headerStyle.borderBottomColor,
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">{currentLabel}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={8} className="p-2 w-auto">
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={customRange}
                onSelect={(range?: DateRange) => {
                  setCustomRange(range);
                  if (range?.from && range?.to) {
                    const toISO = (d: Date) => d.toISOString().split('T')[0];
                    onFilterChange({ type: 'custom', startDate: toISO(range.from), endDate: toISO(range.to) });
                    setShowCustomPicker(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {rightExtras}
        </div>
      </div>
    </div>
  );
}
