import React, { useEffect } from 'react';
import { Globe } from 'lucide-react';

export const GoogleTranslate: React.FC = () => {
  useEffect(() => {
    const initTranslate = () => {
      const container = document.getElementById('google_translate_element');
      if (container && container.children.length === 0 && (window as any).google?.translate?.TranslateElement) {
        try {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: 'ko',
              layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        } catch {
          // ignore
        }
      }
    };

    initTranslate();
    const t1 = setTimeout(initTranslate, 400);
    const t2 = setTimeout(initTranslate, 1200);
    const t3 = setTimeout(initTranslate, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5" title="Google 자동 번역">
      <Globe className="w-3.5 h-3.5 text-fg-muted shrink-0 hidden sm:inline" />
      <div id="google_translate_element" className="inline-flex items-center min-h-[26px]" />
    </div>
  );
};
