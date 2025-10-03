import { useState, Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { useExpenses } from './hooks/useExpenses';
import { useToast } from './hooks/useToast';

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const CategoryManagement = lazy(() => import('./components/CategoryManagement'));
const Summary = lazy(() => import('./components/Summary'));
const ChatMode = lazy(() => import('./components/ChatMode'));
const AccountManagement = lazy(() => import('./components/AccountManagement'));

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories' | 'summary' | 'chat' | 'settings'>('dashboard');
  const {
    expenses,
    categories,
    theme,
    toggleTheme,
    addCategory,
    deleteCategory,
    renameCategory,
    importExpenses
  } = useExpenses();
  const { showSuccess, showError } = useToast();

  const handleAddCategory = async (category: string) => {
    try {
      await addCategory(category);
      showSuccess('Category added successfully');
    } catch (error) {
      showError('Failed to add category');
    }
  };

  const handleDeleteCategory = async (category: string, migrateTo?: string) => {
    try {
      await deleteCategory(category, migrateTo);
      showSuccess('Category deleted successfully');
    } catch (error) {
      showError('Failed to delete category');
    }
  };

  const handleRenameCategory = async (oldCategory: string, newCategory: string) => {
    try {
      await renameCategory(oldCategory, newCategory);
      showSuccess('Category renamed successfully');
    } catch (error) {
      showError('Failed to rename category');
    }
  };

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { expenses, categories }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'money-tracker.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Data exported successfully');
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      // Validate the imported data structure
      if (!parsed.data) {
        showError('Invalid file format: missing data section');
        return;
      }
      
      if (!Array.isArray(parsed.data.expenses)) {
        showError('Invalid file format: expenses must be an array');
        return;
      }
      
      // Validate categories if present
      if (parsed.data.categories && !Array.isArray(parsed.data.categories)) {
        showError('Invalid file format: categories must be an array');
        return;
      }
      
      // Validate expense structure
      const validExpenses = parsed.data.expenses.filter((expense: any) => 
        expense && 
        typeof expense.id === 'string' &&
        typeof expense.date === 'string' &&
        typeof expense.amount === 'number' &&
        typeof expense.category === 'string' &&
        typeof expense.note === 'string'
      );
      
      if (validExpenses.length !== parsed.data.expenses.length) {
        showError('Some expenses were skipped due to invalid format');
      }
      
      // Validate category structure
      const validCategories = parsed.data.categories ? 
        parsed.data.categories.filter((category: any) => 
          typeof category === 'string' && category.trim().length > 0
        ) : [];
      
      if (parsed.data.categories && validCategories.length !== parsed.data.categories.length) {
        showError('Some categories were skipped due to invalid format');
      }
      
      // Show confirmation dialog if there are existing expenses
      if (expenses.length > 0) {
        const confirmed = window.confirm(
          `This will replace your current data (${expenses.length} expenses, ${categories.length} categories) with the imported data (${validExpenses.length} expenses, ${validCategories.length} categories). Are you sure?`
        );
        if (!confirmed) {
          showSuccess('Import cancelled');
          return;
        }
      }
      
      // Import the data
      try {
        await importExpenses({
          expenses: validExpenses,
          categories: validCategories
        });
        
        showSuccess(`Data imported successfully: ${validExpenses.length} expenses, ${validCategories.length} categories`);
      } catch (importError) {
        console.error('Import error:', importError);
        showError('Failed to import data. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Import error:', error);
      showError('Failed to import file: Invalid JSON format');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onExport={handleExport}
          onImport={handleImport}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab as any)}
        />

        {/* Main Content */}
        <div className="container">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
          }>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'categories' && (
              <CategoryManagement
                categories={categories}
                expenses={expenses}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onRenameCategory={handleRenameCategory}
              />
            )}
            {activeTab === 'summary' && (
              <Summary
                expenses={expenses}
              />
            )}
            {activeTab === 'chat' && <ChatMode />}
            {activeTab === 'settings' && <AccountManagement />}
          </Suspense>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default App;
