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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
        
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="secondary" onClick={handleImportClick} className="hidden sm:flex">
          <Upload size={16} />
          <span className="hidden md:inline">Import JSON</span>
        </Button>

        {/* Mobile menu button - simplified actions */}
        <div className="flex sm:hidden gap-1">
          <Button
            variant="icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            size="sm"
            className="px-2"
          >
            {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
          </Button>
          
          <Button variant="secondary" onClick={onExport} size="sm" className="px-2">
            <Download size={12} />
          </Button>
          
          <Button variant="secondary" onClick={handleImportClick} size="sm" className="px-2">
            <Upload size={12} />
          </Button>
        </div>
      </div>
    </header>
  );
};

