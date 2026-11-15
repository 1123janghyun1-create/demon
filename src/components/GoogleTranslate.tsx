import React from 'react';
import { LanguageSelector } from './LanguageSelector';

// Re-export modern searchable LanguageSelector as GoogleTranslate for backwards compatibility
export const GoogleTranslate: React.FC = () => {
  return <LanguageSelector />;
};

export { LanguageSelector };
