import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  PieChart, 
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Expense } from '../types';
import { 
  calculateCategoryBreakdown,
  formatCurrency 
} from '../utils';
import { useTranslation } from '../hooks/useTranslation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SummaryProps {
  expenses: Expense[];
}

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function SummaryCard({ title, value, change, changeType = 'neutral', icon, description }: SummaryCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-text-secondary';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return <TrendingUp size={14} className="text-green-500" />;
      case 'negative': return <TrendingDown size={14} className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg text-accent">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
            {description && (
              <p className="text-xs text-text-secondary/70 mt-1">{description}</p>
            )}
          </div>
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getChangeColor()}`}>
            {getChangeIcon()}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-text">{value}</div>
    </div>
  );
}

export function Summary({ expenses }: SummaryProps) {
  const { t } = useTranslation();
  const summaryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Current month data
    const currentMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    // Previous month data
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === prevMonth && expDate.getFullYear() === prevYear;
    });
    
    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DaysExpenses = expenses.filter(exp => 
      new Date(exp.date) >= thirtyDaysAgo
    );
    
    // Last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7DaysExpenses = expenses.filter(exp => 
      new Date(exp.date) >= sevenDaysAgo
    );
    
    // Calculate totals
    const currentMonthTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const prevMonthTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const last30DaysTotal = last30DaysExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const last7DaysTotal = last7DaysExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate changes
    const monthOverMonthChange = prevMonthTotal > 0 
      ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
      : 0;
    
    // Average daily spending
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const avgDailySpending = currentMonthTotal / daysInCurrentMonth;
    
    // Top categories
    const categoryBreakdown = calculateCategoryBreakdown(expenses);
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
    
    // Spending patterns
    const avgExpenseAmount = expenses.length > 0 ? totalSpent / expenses.length : 0;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(exp => exp.amount)) : 0;
    const smallestExpense = expenses.length > 0 ? Math.min(...expenses.map(exp => exp.amount)) : 0;
    
    // Monthly spending data for line chart (last 6 months)
    const monthlyData = [];
    const monthlyLabels = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.getMonth();
      const year = date.getFullYear();
      
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === month && expDate.getFullYear() === year;
      });
      
      const monthTotal = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      monthlyData.push(monthTotal);
      monthlyLabels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    
    // Weekly spending data for bar chart (last 4 weeks)
    const weeklyData = [];
    const weeklyLabels = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + (i * 7)));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= weekStart && expDate <= weekEnd;
      });
      
      const weekTotal = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      weeklyData.push(weekTotal);
      weeklyLabels.push(`Week ${4 - i}`);
    }
    
    return {
      currentMonthTotal,
      prevMonthTotal,
      last30DaysTotal,
      last7DaysTotal,
      totalSpent,
      monthOverMonthChange,
      avgDailySpending,
      topCategories,
      avgExpenseAmount,
      largestExpense,
      smallestExpense,
      monthlyData,
      monthlyLabels,
      weeklyData,
      weeklyLabels,
      totalExpenses: expenses.length,
      currentMonthCount: currentMonthExpenses.length,
      last30DaysCount: last30DaysExpenses.length,
      last7DaysCount: last7DaysExpenses.length
    };
  }, [expenses]);

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeType = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'negative'; // Spending increase is negative
    if (change < 0) return 'positive'; // Spending decrease is positive
    return 'neutral';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title={t('summary.thisMonth')}
          value={formatCurrency(summaryData.currentMonthTotal)}
          change={summaryData.monthOverMonthChange !== 0 ? formatChange(summaryData.monthOverMonthChange) : undefined}
          changeType={getChangeType(summaryData.monthOverMonthChange)}
          icon={<Calendar size={20} />}
          description={`${summaryData.currentMonthCount} ${t('summary.transactions')}`}
        />
        
        <SummaryCard
          title={t('summary.last30Days')}
          value={formatCurrency(summaryData.last30DaysTotal)}
          icon={<BarChart3 size={20} />}
          description={`${summaryData.last30DaysCount} ${t('summary.transactions')}`}
        />
        
        <SummaryCard
          title={t('summary.last7Days')}
          value={formatCurrency(summaryData.last7DaysTotal)}
          icon={<Calendar size={20} />}
          description={`${summaryData.last7DaysCount} ${t('summary.transactions')}`}
        />
        
        <SummaryCard
          title={t('summary.totalSpent')}
          value={formatCurrency(summaryData.totalSpent)}
          icon={<DollarSign size={20} />}
          description={`${summaryData.totalExpenses} ${t('summary.totalTransactions')}`}
        />
      </div>

      {/* Spending Insights */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
        <h3 className="text-lg font-semibold text-text mb-3 sm:mb-4 flex items-center gap-2">
          <Target size={20} className="text-accent" />
          {t('summary.spendingInsights')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex items-center justify-between p-4 bg-bg rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-green-500" />
              <div>
                <div className="text-sm font-medium text-text">{t('summary.avgPerTransaction')}</div>
                <div className="text-xs text-text-secondary">{t('summary.allTime')}</div>
              </div>
            </div>
            <span className="font-semibold text-text">{formatCurrency(summaryData.avgExpenseAmount)}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-bg rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign size={20} className="text-blue-500" />
              <div>
                <div className="text-sm font-medium text-text">{t('summary.dailyAverage')}</div>
                <div className="text-xs text-text-secondary">{t('summary.thisMonth')}</div>
              </div>
            </div>
            <span className="font-semibold text-text">{formatCurrency(summaryData.avgDailySpending)}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-bg rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <div>
                <div className="text-sm font-medium text-text">{t('summary.largestExpense')}</div>
                <div className="text-xs text-text-secondary">{t('summary.allTime')}</div>
              </div>
            </div>
            <span className="font-semibold text-text">{formatCurrency(summaryData.largestExpense)}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-bg rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} className="text-green-500" />
              <div>
                <div className="text-sm font-medium text-text">{t('summary.smallestExpense')}</div>
                <div className="text-xs text-text-secondary">{t('summary.allTime')}</div>
              </div>
            </div>
            <span className="font-semibold text-text">{formatCurrency(summaryData.smallestExpense)}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Monthly Spending Trend */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
          <h3 className="text-lg font-semibold text-text mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-accent" />
            {t('summary.monthlyTrend')}
          </h3>
          <div className="h-64">
            <Line
              data={{
                labels: summaryData.monthlyLabels,
                datasets: [
                  {
                    label: t('summary.monthlySpending'),
                    data: summaryData.monthlyData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${t('summary.spent')}: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9CA3AF',
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9CA3AF',
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Weekly Spending */}
        <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
          <h3 className="text-lg font-semibold text-text mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-accent" />
            {t('summary.weeklySpending')}
          </h3>
          <div className="h-64">
            <Bar
              data={{
                labels: summaryData.weeklyLabels,
                datasets: [
                  {
                    label: t('summary.weeklySpending'),
                    data: summaryData.weeklyData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${t('summary.spent')}: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9CA3AF',
                      callback: function(value) {
                        return formatCurrency(value as number);
                      }
                    }
                  },
                  x: {
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)',
                    },
                    ticks: {
                      color: '#9CA3AF',
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      <div className="bg-card rounded-lg p-4 sm:p-6 border border-border">
        <h3 className="text-lg font-semibold text-text mb-3 sm:mb-4 flex items-center gap-2">
          <PieChart size={20} className="text-accent" />
          {t('summary.categoryDistribution')}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="h-64 flex items-center justify-center">
            <Doughnut
              data={{
                labels: summaryData.topCategories.map(([category]) => category),
                datasets: [
                  {
                    data: summaryData.topCategories.map(([, amount]) => amount),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(139, 92, 246, 0.8)',
                    ],
                    borderColor: [
                      'rgb(59, 130, 246)',
                      'rgb(16, 185, 129)',
                      'rgb(245, 158, 11)',
                      'rgb(239, 68, 68)',
                      'rgb(139, 92, 246)',
                    ],
                    borderWidth: 2,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#9CA3AF',
                      padding: 20,
                      usePointStyle: true,
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div className="space-y-3">
            {summaryData.topCategories.map(([category, amount], index) => {
              const percentage = summaryData.totalSpent > 0 
                ? (amount / summaryData.totalSpent) * 100 
                : 0;
              
              return (
                <div key={category} className="flex items-center justify-between p-3 bg-bg rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: [
                          'rgb(59, 130, 246)',
                          'rgb(16, 185, 129)',
                          'rgb(245, 158, 11)',
                          'rgb(239, 68, 68)',
                          'rgb(139, 92, 246)',
                        ][index % 5]
                      }}
                    ></div>
                    <span className="font-medium text-text">{category}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text">{formatCurrency(amount)}</div>
                    <div className="text-sm text-text-secondary">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Summary;