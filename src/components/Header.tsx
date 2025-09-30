import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Upload, Download, Menu, X, Settings, BarChart3, Tag, PieChart, MessageCircle, User } from 'lucide-react';
import { Button } from './ui/Button';
import { AuthButton } from './AuthButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  activeTab?: 'dashboard' | 'categories' | 'summary' | 'chat' | 'settings';
  onTabChange?: (tab: 'dashboard' | 'categories' | 'summary' | 'chat' | 'settings') => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onExport,
  onImport,
  activeTab,
  onTabChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleExportClick = () => {
    onExport();
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleThemeToggle = () => {
    onToggleTheme();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabClick = (tab: 'dashboard' | 'categories' | 'summary' | 'chat' | 'settings') => {
    onTabChange?.(tab);
    setIsMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <>
      <header className="bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">💰</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-text tracking-tight">
              Money Tracker
            </h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {onTabChange && (
            <div className="flex bg-bg rounded-lg p-1 mr-4">
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <BarChart3 size={16} className="inline mr-1.5" />
                Dashboard
              </button>
              <button
                onClick={() => handleTabClick('categories')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <Tag size={16} className="inline mr-1.5" />
                Categories
              </button>
              <button
                onClick={() => handleTabClick('summary')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <PieChart size={16} className="inline mr-1.5" />
                Summary
              </button>
              <button
                onClick={() => handleTabClick('chat')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <MessageCircle size={16} className="inline mr-1.5" />
                Chat
              </button>
              <button
                onClick={() => handleTabClick('settings')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <User size={16} className="inline mr-1.5" />
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Dropdown Menu */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="secondary"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2"
            >
              <Settings size={16} />
              <span className="hidden md:inline">Tools</span>
            </Button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-panel border border-border rounded-lg shadow-custom-xl z-50 backdrop-blur-sm" style={{ backgroundColor: 'var(--panel)' }}>
                <div className="py-1">
                  <button
                    onClick={handleExportClick}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 hover:bg-panel-2"
                    style={{ 
                      color: 'var(--text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Download size={16} />
                    Export Data
                  </button>
                  <button
                    onClick={handleImportClick}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 hover:bg-panel-2"
                    style={{ 
                      color: 'var(--text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Upload size={16} />
                    Import Data
                  </button>
                  <div className="border-t my-1" style={{ borderColor: 'var(--border)' }}></div>
                  <button
                    onClick={handleThemeToggle}
                    className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 hover:bg-panel-2"
                    style={{ 
                      color: 'var(--text)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--panel-2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <AuthButton />
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <AuthButton />
          <Button
            variant="icon"
            onClick={toggleMobileMenu}
            className="p-2"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-card border-b border-border px-4 py-3 space-y-3">
          {/* Mobile Navigation */}
          {onTabChange && (
            <div className="space-y-2">
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <BarChart3 size={16} />
                Dashboard
              </button>
              <button
                onClick={() => handleTabClick('categories')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeTab === 'categories'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <Tag size={16} />
                Manage Categories
              </button>
              <button
                onClick={() => handleTabClick('summary')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeTab === 'summary'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <PieChart size={16} />
                Summary & Analytics
              </button>
              <button
                onClick={() => handleTabClick('chat')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeTab === 'chat'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <MessageCircle size={16} />
                Chat Mode
              </button>
              <button
                onClick={() => handleTabClick('settings')}
                className={`w-full px-3 py-2 text-left text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:text-text hover:bg-bg/50'
                }`}
              >
                <User size={16} />
                Account Settings
              </button>
            </div>
          )}

          {/* Mobile Actions */}
          <div className="border-t border-border pt-3 space-y-2">
            <button
              onClick={handleExportClick}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-bg rounded-md flex items-center gap-2"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={handleImportClick}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-bg rounded-md flex items-center gap-2"
            >
              <Upload size={16} />
              Import Data
            </button>
            <button
              onClick={handleThemeToggle}
              className="w-full px-3 py-2 text-left text-sm text-text hover:bg-bg rounded-md flex items-center gap-2"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

