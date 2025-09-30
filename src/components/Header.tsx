import React from 'react';
import { Moon, Sun, Upload, Download } from 'lucide-react';
import { Button } from './ui/Button';
import { AuthButton } from './AuthButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onExport,
  onImport
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  return (
    <header className="header">
      <h1 className="header__title">💰 Money Tracker</h1>
      <div className="header__actions">
        <AuthButton />
        
        <Button
          variant="icon"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          className="hidden sm:flex"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </Button>
        
        <Button variant="secondary" onClick={onExport} className="hidden sm:flex">
          <Download size={16} />
          <span className="hidden md:inline">Export JSON</span>
        </Button>
        
        <label className="import-label">
          <input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="secondary" className="hidden sm:flex">
            <Upload size={16} />
            <span className="hidden md:inline">Import JSON</span>
          </Button>
        </label>

        {/* Mobile menu button - simplified actions */}
        <div className="flex sm:hidden gap-2">
          <Button
            variant="icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            size="sm"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </Button>
          
          <Button variant="secondary" onClick={onExport} size="sm">
            <Download size={14} />
          </Button>
          
          <label className="import-label">
            <input
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="secondary" size="sm">
              <Upload size={14} />
            </Button>
          </label>
        </div>
      </div>
    </header>
  );
};

