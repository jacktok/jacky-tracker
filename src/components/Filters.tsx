import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Chip } from './ui/Chip';
import { Filters as FiltersType } from '../types';
import { getDateRangePresets } from '../utils';

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
  const sortOptions = [
    { value: 'date_desc', label: 'Date ↓' },
    { value: 'date_asc', label: 'Date ↑' },
    { value: 'amount_desc', label: 'Amount ↓' },
    { value: 'amount_asc', label: 'Amount ↑' }
  ];

  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  const datePresets = getDateRangePresets();

  const applyDatePreset = (preset: keyof typeof datePresets) => {
    const { from, to } = datePresets[preset];
    onFiltersChange({ from, to });
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
      <h2 className="panel-title">🔍 Filters</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Input
          label="From"
          type="date"
          value={filters.from}
          onChange={(e) => onFiltersChange({ from: e.target.value })}
        />
        
        <Input
          label="To"
          type="date"
          value={filters.to}
          onChange={(e) => onFiltersChange({ to: e.target.value })}
        />
        
        <Select
          label="Category"
          value={filters.category}
          onChange={(e) => onFiltersChange({ category: e.target.value })}
          options={categoryOptions}
        />
        
        <Input
          label="Search note"
          type="text"
          placeholder="Contains..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="sm:col-span-2"
        />
        
        <Select
          label="Sort"
          value={filters.sort}
          onChange={(e) => onFiltersChange({ sort: e.target.value as FiltersType['sort'] })}
          options={sortOptions}
        />
      </div>
      
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Chip onClick={() => applyDatePreset('today')}>📅 Today</Chip>
          <Chip onClick={() => applyDatePreset('last7Days')}>📆 7d</Chip>
          <Chip onClick={() => applyDatePreset('last30Days')}>📅 30d</Chip>
          <Chip onClick={() => applyDatePreset('thisMonth')}>📊 This Month</Chip>
        </div>
        
        <Button variant="secondary" size="sm" onClick={clearFilters}>
          🧹 Clear
        </Button>
      </div>
    </div>
  );
};

