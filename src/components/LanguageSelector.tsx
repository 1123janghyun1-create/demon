import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Globe, Search, Check, X, RotateCcw, ChevronDown, Sparkles } from 'lucide-react';

export interface LanguageItem {
  code: string;
  name: string;        // 한국어 명칭
  nativeName: string;  // 현지어 명칭
  englishName: string; // 영문 명칭
  flag: string;        // 국기 이모지
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageItem[] = [
  { code: 'ko', name: '한국어 (원문)', nativeName: '한국어', englishName: 'Korean', flag: '🇰🇷', popular: true },
  { code: 'en', name: '영어', nativeName: 'English', englishName: 'English', flag: '🇺🇸', popular: true },
  { code: 'ja', name: '일본어', nativeName: '日本語', englishName: 'Japanese', flag: '🇯🇵', popular: true },
  { code: 'zh-CN', name: '중국어 (간체)', nativeName: '简体中文', englishName: 'Chinese (Simplified)', flag: '🇨🇳', popular: true },
  { code: 'zh-TW', name: '중국어 (번체)', nativeName: '繁體中文', englishName: 'Chinese (Traditional)', flag: '🇹🇼' },
  { code: 'es', name: '스페인어', nativeName: 'Español', englishName: 'Spanish', flag: '🇪🇸', popular: true },
  { code: 'fr', name: '프랑스어', nativeName: 'Français', englishName: 'French', flag: '🇫🇷', popular: true },
  { code: 'de', name: '독일어', nativeName: 'Deutsch', englishName: 'German', flag: '🇩🇪', popular: true },
  { code: 'vi', name: '베트남어', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', flag: '🇻🇳', popular: true },
  { code: 'id', name: '인도네시아어', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', flag: '🇮🇩' },
  { code: 'th', name: '태국어', nativeName: 'ไทย', englishName: 'Thai', flag: '🇹🇭' },
  { code: 'ru', name: '러시아어', nativeName: 'Русский', englishName: 'Russian', flag: '🇷🇺' },
  { code: 'pt', name: '포르투갈어', nativeName: 'Português', englishName: 'Portuguese', flag: '🇧🇷' },
  { code: 'it', name: '이탈리아어', nativeName: 'Italiano', englishName: 'Italian', flag: '🇮🇹' },
  { code: 'hi', name: '힌디어', nativeName: 'हिन्दी', englishName: 'Hindi', flag: '🇮🇳' },
  { code: 'ar', name: '아랍어', nativeName: 'العربية', englishName: 'Arabic', flag: '🇸🇦' },
  { code: 'nl', name: '네덜란드어', nativeName: 'Nederlands', englishName: 'Dutch', flag: '🇳🇱' },
  { code: 'tr', name: '튀르키예어', nativeName: 'Türkçe', englishName: 'Turkish', flag: '🇹🇷' },
  { code: 'pl', name: '폴란드어', nativeName: 'Polski', englishName: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: '스웨덴어', nativeName: 'Svenska', englishName: 'Swedish', flag: '🇸🇪' },
  { code: 'tl', name: '필리핀어 / 타갈로그어', nativeName: 'Filipino', englishName: 'Tagalog / Filipino', flag: '🇵🇭' },
  { code: 'uk', name: '우크라이나어', nativeName: 'Українська', englishName: 'Ukrainian', flag: '🇺🇦' },
  { code: 'ms', name: '말레이어', nativeName: 'Bahasa Melayu', englishName: 'Malay', flag: '🇲🇾' },
  { code: 'fa', name: '페르시아어', nativeName: 'فارسی', englishName: 'Persian', flag: '🇮🇷' },
  { code: 'el', name: '그리스어', nativeName: 'Ελληνικά', englishName: 'Greek', flag: '🇬🇷' },
  { code: 'cs', name: '체코어', nativeName: 'Čeština', englishName: 'Czech', flag: '🇨🇿' },
  { code: 'ro', name: '루마니아어', nativeName: 'Română', englishName: 'Romanian', flag: '🇷🇴' },
  { code: 'hu', name: '헝가리어', nativeName: 'Magyar', englishName: 'Hungarian', flag: '🇭🇺' },
  { code: 'he', name: '히브리어', nativeName: 'עברית', englishName: 'Hebrew', flag: '🇮🇱' },
  { code: 'da', name: '덴마크어', nativeName: 'Dansk', englishName: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: '핀란드어', nativeName: 'Suomi', englishName: 'Finnish', flag: '🇫🇮' },
  { code: 'no', name: '노르웨이어', nativeName: 'Norsk', englishName: 'Norwegian', flag: '🇳🇴' },
  { code: 'bn', name: '벵골어', nativeName: 'বাংলা', englishName: 'Bengali', flag: '🇧🇩' },
  { code: 'mn', name: '몽골어', nativeName: 'Монгол', englishName: 'Mongolian', flag: '🇲🇳' },
  { code: 'kk', name: '카자흐어', nativeName: 'Қазақша', englishName: 'Kazakh', flag: '🇰🇿' },
  { code: 'uz', name: '우즈베크어', nativeName: 'Oʻzbekcha', englishName: 'Uzbek', flag: '🇺🇿' },
  { code: 'my', name: '미얀마어', nativeName: 'မြန်မာ', englishName: 'Burmese', flag: '🇲🇲' },
  { code: 'km', name: '크메르어', nativeName: 'ភាសាខ្មែរ', englishName: 'Khmer', flag: '🇰🇭' },
  { code: 'lo', name: '라오어', nativeName: 'ພາສາລາວ', englishName: 'Lao', flag: '🇱🇦' },
  { code: 'ta', name: '타밀어', nativeName: 'தமிழ்', englishName: 'Tamil', flag: '🇮🇳' },
  { code: 'te', name: '텔루구어', nativeName: 'తెలుగు', englishName: 'Telugu', flag: '🇮🇳' },
  { code: 'ur', name: '우르두어', nativeName: 'اردو', englishName: 'Urdu', flag: '🇵🇰' },
  { code: 'sw', name: '스와힐리어', nativeName: 'Kiswahili', englishName: 'Swahili', flag: '🇰🇪' },
  { code: 'af', name: '아프리칸스어', nativeName: 'Afrikaans', englishName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sk', name: '슬로바키아어', nativeName: 'Slovenčina', englishName: 'Slovak', flag: '🇸🇰' },
  { code: 'hr', name: '크로아티아어', nativeName: 'Hrvatski', englishName: 'Croatian', flag: '🇭🇷' },
  { code: 'sr', name: '세르비아어', nativeName: 'Српски', englishName: 'Serbian', flag: '🇷🇸' },
  { code: 'bg', name: '불가리아어', nativeName: 'Български', englishName: 'Bulgarian', flag: '🇧🇬' },
  { code: 'lt', name: '리투아니아어', nativeName: 'Lietuvių', englishName: 'Lithuanian', flag: '🇱🇹' },
  { code: 'lv', name: '라트비아어', nativeName: 'Latviešu', englishName: 'Latvian', flag: '🇱🇻' },
  { code: 'et', name: '에스토니아어', nativeName: 'Eesti', englishName: 'Estonian', flag: '🇪🇪' },
  { code: 'is', name: '아이슬란드어', nativeName: 'Íslenska', englishName: 'Icelandic', flag: '🇮🇸' },
  { code: 'ga', name: '아일랜드어', nativeName: 'Gaeilge', englishName: 'Irish', flag: '🇮🇪' },
];

function getInitialLanguage(): string {
  try {
    const saved = localStorage.getItem('demonst_lang');
    if (saved) return saved;

    // Check googtrans cookie: format is usually /ko/en or /auto/en
    const match = document.cookie.match(/googtrans=\/([^/]+)\/([^;]+)/);
    if (match && match[2]) {
      return match[2];
    }
  } catch {}
  return 'ko';
}

function setGoogleTranslateLanguage(targetCode: string) {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  try {
    localStorage.setItem('demonst_lang', targetCode);

    if (targetCode === 'ko') {
      // Clear translation cookie for all potential domain paths
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      if (!isLocal) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname};`;
      }

      // Trigger select box reset or cleanly reload page to restore original Korean text
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        select.value = 'ko';
        select.dispatchEvent(new Event('change'));
      }
      window.location.reload();
      return;
    }

    // Set cookie: /ko/{code}
    const cookieVal = `/ko/${targetCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/;`;
    if (!isLocal) {
      document.cookie = `googtrans=${cookieVal}; path=/; domain=${hostname};`;
      document.cookie = `googtrans=${cookieVal}; path=/; domain=.${hostname};`;
    }

    // Attempt live trigger via hidden Google select
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = targetCode;
      select.dispatchEvent(new Event('change'));
    } else {
      // If widget element is still initializing, reload so Google Translate boots with cookie
      window.location.reload();
    }
  } catch (err) {
    console.warn('Failed to switch language:', err);
    window.location.reload();
  }
}

export const LanguageSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentLang, setCurrentLang] = useState<string>(getInitialLanguage);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync current language with cookie on mount
  useEffect(() => {
    setCurrentLang(getInitialLanguage());
  }, []);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Current language details
  const activeLanguageItem = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];
  }, [currentLang]);

  // Filtered languages based on search query
  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SUPPORTED_LANGUAGES;

    return SUPPORTED_LANGUAGES.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.englishName.toLowerCase().includes(q) ||
        item.code.toLowerCase() === q
      );
    });
  }, [search]);

  // Popular languages (top chips)
  const popularLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((l) => l.popular);
  }, []);

  const handleSelectLanguage = (code: string) => {
    setCurrentLang(code);
    setIsOpen(false);
    setGoogleTranslateLanguage(code);
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-xs font-semibold text-fg hover:border-accent hover:bg-surface-3 transition-all cursor-pointer shadow-2xs"
        title="언어 검색 및 자동 번역 선택"
        aria-label="언어 선택 메뉴 열기"
      >
        <span className="text-sm leading-none">{activeLanguageItem.flag}</span>
        <span className="hidden sm:inline max-w-[70px] sm:max-w-[100px] truncate">
          {activeLanguageItem.nativeName}
        </span>
        <ChevronDown className={`w-3 h-3 text-fg-muted transition-transform duration-150 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
      </button>

      {/* Searchable Modal / Dropdown Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div
            ref={modalRef}
            className="w-full max-w-[480px] max-h-[85vh] rounded-card border border-border bg-surface p-4 sm:p-5 shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-fg flex items-center gap-1.5">
                    <span>언어 직접 검색 &amp; 번역</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-accent text-white">
                      50+개국
                    </span>
                  </h2>
                  <p className="text-[11px] text-fg-muted">
                    원하는 언어를 검색하거나 아래 목록에서 선택하세요.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-btn p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Search Input */}
            <div className="my-3">
              <div className="relative flex items-center rounded-btn border border-border bg-surface-2 px-3 py-2 text-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
                <Search className="w-4 h-4 text-fg-muted mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="언어 검색 (예: English, 일본어, 중국어, es, de, vi...)"
                  className="w-full bg-transparent text-xs text-fg placeholder:text-fg-muted focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredLanguages.length > 0) {
                      handleSelectLanguage(filteredLanguages[0].code);
                    }
                  }}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-fg-muted hover:text-fg p-0.5 rounded-full hover:bg-surface-3"
                    title="검색어 지우기"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Popular Languages (Quick Pills) - shown when not actively searching */}
            {!search && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-fg-secondary flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>자주 찾는 언어</span>
                  </span>
                  {currentLang !== 'ko' && (
                    <button
                      type="button"
                      onClick={() => handleSelectLanguage('ko')}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>한국어 원문 복원</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularLanguages.map((lang) => {
                    const isSelected = currentLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent text-white shadow-xs'
                            : 'bg-surface-2 text-fg-secondary hover:bg-surface-3 hover:text-fg border border-border'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                        {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Language List */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[220px] max-h-[340px] divide-y divide-border/50">
              <div className="text-[11px] font-semibold text-fg-muted pb-1 px-1">
                {search ? `검색 결과: ${filteredLanguages.length}개 언어` : '모든 언어 목록 (가나다순 / 알파벳순)'}
              </div>

              {filteredLanguages.length === 0 ? (
                <div className="py-8 text-center text-fg-muted">
                  <p className="text-xs font-medium">검색 결과가 없습니다.</p>
                  <p className="text-[11px] mt-1 text-fg-muted">
                    &apos;{search}&apos;에 해당하는 언어를 찾을 수 없습니다. 철자를 확인해보세요.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-3 px-3 py-1 rounded-pill bg-surface-2 border border-border text-xs text-fg hover:border-accent"
                  >
                    검색 초기화
                  </button>
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = currentLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-btn text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent/10 text-accent font-bold'
                          : 'text-fg hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0 leading-none">{lang.flag}</span>
                        <div className="min-w-0 truncate">
                          <span className="font-semibold text-fg text-xs">{lang.nativeName}</span>
                          <span className="text-fg-muted text-[11px] ml-1.5 truncate">
                            {lang.name} · {lang.englishName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-3 text-fg-muted border border-border/50">
                          {lang.code}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-accent" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer with Reset to Original Korean */}
            <div className="pt-3 mt-2 border-t border-border flex items-center justify-between text-[11px] text-fg-muted">
              <span>Google 자동 번역 엔진 연동</span>
              {currentLang !== 'ko' ? (
                <button
                  type="button"
                  onClick={() => handleSelectLanguage('ko')}
                  className="font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>한국어 원문으로 복원하기</span>
                </button>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ 현재 한국어 원문 표시 중
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
