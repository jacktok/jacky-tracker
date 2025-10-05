import React from 'react';
import { CreditCard, Calendar, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils';
import { useTranslation } from '../hooks/useTranslation';

interface SummaryCardsProps {
  totalFiltered: number;
  totalThisMonth: number;
  entryCount: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  totalFiltered,
  totalThisMonth,
  entryCount
}) => {
  const { t } = useTranslation();
  
  const cards = [
    {
      icon: CreditCard,
      label: t('summary.totalFiltered'),
      value: formatCurrency(totalFiltered),
      valueMobile: formatCurrency(totalFiltered, false),
      color: 'text-accent'
    },
    {
      icon: Calendar,
      label: t('summary.thisMonth'),
      value: formatCurrency(totalThisMonth),
      valueMobile: formatCurrency(totalThisMonth, false),
      color: 'text-success'
    },
    {
      icon: BarChart3,
      label: t('summary.entries'),
      value: entryCount.toString(),
      valueMobile: entryCount.toString(),
      color: 'text-warning'
    }
  ];

  return (
    <div className="summary">
      {cards.map((card, index) => (
          <div key={index} className="summary-item">
            <div className="summary-label">{card.label}</div>
            <div className={`summary-value ${card.color}`}>
              <span className="hidden sm:inline">{card.value}</span>
              <span className="sm:hidden">{card.valueMobile}</span>
            </div>
          </div>
        ))}
    </div>
  );
};
