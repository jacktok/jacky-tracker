import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Upload, Download, Menu, X, BarChart3, Tag, PieChart, MessageCircle, User } from 'lucide-react';
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
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);
  const unifiedMenuRef = useRef<HTMLDivElement>(null);

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
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);
  };

  const handleExportClick = () => {
    onExport();
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);
  };

  const handleThemeToggle = () => {
    onToggleTheme();
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);
  };

  const toggleUnifiedMenu = () => {
    // For mobile screens, toggle mobile menu
    if (window.innerWidth < 768) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
      setIsNavDropdownOpen(false);
    } else {
      // For medium screens, toggle nav dropdown
      setIsNavDropdownOpen(!isNavDropdownOpen);
      setIsMobileMenuOpen(false);
    }
  };

  const handleTabClick = (tab: 'dashboard' | 'categories' | 'summary' | 'chat' | 'settings') => {
    onTabChange?.(tab);
    setIsMobileMenuOpen(false);
    setIsNavDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navDropdownRef.current && !navDropdownRef.current.contains(target) &&
          unifiedMenuRef.current && !unifiedMenuRef.current.contains(target)) {
        setIsNavDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    if (isNavDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavDropdownOpen, isMobileMenuOpen]);

  return (
    <>
      <header className="bg-card border-b border-border px-2 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-sm">
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
        <div className="hidden md:flex items-center gap-1">
          {onTabChange && (
            <>
              {/* Full Navigation - Large Screens */}
              <div className="hidden xl:flex bg-bg rounded-lg p-1 mr-4">
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

            </>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden xl:flex items-center gap-2">
          <AuthButton />
        </div>

        {/* Mobile and Medium Actions */}
        <div className="flex xl:hidden items-center gap-2">
          <AuthButton />
          <Button
            variant="icon"
            onClick={toggleUnifiedMenu}
            className="p-2"
          >
            {(isMobileMenuOpen || isNavDropdownOpen) ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </header>

      {/* Unified Menu - Medium and Mobile Screens */}
      {(isMobileMenuOpen || isNavDropdownOpen) && (
        <div ref={unifiedMenuRef} className="xl:hidden bg-card border-b border-border px-2 py-3 space-y-3 sticky top-[60px] sm:top-[72px] z-40 backdrop-blur-sm">
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

