import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'th' : 'en');
  };

  return (
    <Button
      variant="icon"
      onClick={toggleLanguage}
      className="p-2"
      title={t('language.switchLanguage')}
    >
      <Globe size={16} />
      <span className="ml-1 text-xs font-medium">
        {language === 'en' ? 'EN' : 'TH'}
      </span>
    </Button>
  );
};
