import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Chip } from './ui/Chip';
import { Filters as FiltersType } from '../types';
import { getDateRangePresets } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

interface FiltersProps {
  filters: FiltersType;
  categories: string[];
  onFiltersChange: (filters: Partial<FiltersType>) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  categories,
  onFiltersChange
}) => {
  const { t } = useTranslation();
  
  const sortOptions = [
    { value: 'date_desc', label: t('filters.dateDesc') },
    { value: 'date_asc', label: t('filters.dateAsc') },
    { value: 'amount_desc', label: t('filters.amountDesc') },
    { value: 'amount_asc', label: t('filters.amountAsc') }
  ];

  const categoryOptions = [
    { value: '', label: t('filters.allCategories') },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  const datePresets = getDateRangePresets();

  const applyDatePreset = (preset: keyof typeof datePresets) => {
    const { from, to } = datePresets[preset];
    onFiltersChange({ from, to });
  };

  const resetToDefault = () => {
    const defaultDateRange = getDateRangePresets().last30Days;
    onFiltersChange({
      from: defaultDateRange.from,
      to: defaultDateRange.to,
      category: '',
      search: '',
      sort: 'date_desc'
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      from: '',
      to: '',
      category: '',
      search: '',
      sort: 'date_desc'
    });
  };

  return (
    <div className="panel">
      <h2 className="panel-title">🔍 {t('filters.title')}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Input
          label={t('filters.from')}
          type="date"
          value={filters.from}
          onChange={(e) => onFiltersChange({ from: e.target.value })}
        />
        
        <Input
          label={t('filters.to')}
          type="date"
          value={filters.to}
          onChange={(e) => onFiltersChange({ to: e.target.value })}
        />
        
        <Select
          label={t('filters.category')}
          value={filters.category}
          onChange={(e) => onFiltersChange({ category: e.target.value })}
          options={categoryOptions}
        />
        
        <Input
          label={t('filters.searchNote')}
          type="text"
          placeholder={t('filters.contains')}
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="sm:col-span-2"
        />
        
        <Select
          label={t('filters.sort')}
          value={filters.sort}
          onChange={(e) => onFiltersChange({ sort: e.target.value as FiltersType['sort'] })}
          options={sortOptions}
        />
      </div>
      
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip onClick={() => applyDatePreset('today')}>📅 {t('filters.today')}</Chip>
          <Chip onClick={() => applyDatePreset('last7Days')}>📆 {t('filters.last7Days')}</Chip>
          <Chip onClick={() => applyDatePreset('last30Days')}>📅 {t('filters.last30Days')}</Chip>
          <Chip onClick={() => applyDatePreset('thisMonth')}>📊 {t('filters.thisMonth')}</Chip>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={resetToDefault}>
            🔄 {t('actions.default')}
          </Button>
          <Button variant="secondary" size="sm" onClick={clearFilters}>
            🧹 {t('actions.clear')}
          </Button>
        </div>
      </div>
    </div>
  );
};

