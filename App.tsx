
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, ModuleData } from './types';
import { MODULES } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';
import LoginOverlay from './components/LoginOverlay';

interface QuizHistoryEntry {
  date: string;
  session: number;
  score: string;
  moduleId?: string;
  incorrectAnswers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'dark' | 'light') || 'light';
  });

  const [isLoginRequired, setIsLoginRequired] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_login_required');
    return saved === null ? true : saved === 'true';
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    const savedReq = localStorage.getItem('app_login_required');
    const req = savedReq === null ? true : savedReq === 'true';
    if (!req) return true;
    return sessionStorage.getItem('app_authorized') === 'true';
  });

  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [fullHistory, setFullHistory] = useState<QuizHistoryEntry[]>([]);
  
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_timer_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isHighlightEnabled, setIsHighlightEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_highlight_enabled');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.classList.add('light-theme');
    } else {
      document.body.style.backgroundColor = '#081221';
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const loadData = () => {
    const savedHistory = localStorage.getItem('quizHistory');
    const latestProgress: Record<string, number> = {};
    MODULES.forEach(m => latestProgress[m.id] = 0);

    if (savedHistory) {
      try {
        const history: QuizHistoryEntry[] = JSON.parse(savedHistory);
        setFullHistory(history);
        MODULES.forEach(module => {
          const lastEntry = history.find((h: QuizHistoryEntry) => h.moduleId === module.id);
          if (lastEntry && lastEntry.score) {
            const [correct, total] = lastEntry.score.split('/').map(Number);
            if (!isNaN(correct) && !isNaN(total) && total > 0) {
              latestProgress[module.id] = Math.round((correct / total) * 100);
            }
          }
        });
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    } else {
      setFullHistory([]);
    }
    setModuleProgress(latestProgress);
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
      const handleStorageChange = () => loadData();
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isAuthorized]);

  const totalCourseProgress = useMemo(() => {
    const sum = MODULES.reduce((acc, module) => acc + (moduleProgress[module.id] || 0), 0);
    return Math.round(sum / MODULES.length);
  }, [moduleProgress]);

  const handleAuthorize = () => {
    setIsAuthorized(true);
    sessionStorage.setItem('app_authorized', 'true');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleTimer = () => {
    const newValue = !isTimerEnabled;
    setIsTimerEnabled(newValue);
    localStorage.setItem('app_timer_enabled', String(newValue));
  };

  const toggleHighlight = () => {
    const newValue = !isHighlightEnabled;
    setIsHighlightEnabled(newValue);
    localStorage.setItem('app_highlight_enabled', String(newValue));
  };

  const toggleLoginRequirement = () => {
    const newValue = !isLoginRequired;
    setIsLoginRequired(newValue);
    localStorage.setItem('app_login_required', String(newValue));
    if (!newValue) {
      setIsAuthorized(true);
    }
  };

  const clearGlobalHistory = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить всю историю тестирования?')) {
      localStorage.removeItem('quizHistory');
      MODULES.forEach(m => {
        localStorage.removeItem(`quizSessionNum_${m.id}`);
      });
      loadData();
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isDark = theme === 'dark';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex-1 flex flex-col px-4 pb-2 gap-3 justify-between overflow-hidden">
            <div className="grid grid-cols-2 gap-3 flex-[3] min-h-0 overflow-y-auto pr-1">
              {MODULES.map((m) => (
                <GlassButton 
                  key={m.id}
                  title={m.title}
                  subtitle={m.subtitle}
                  iconType={m.icon}
                  progress={moduleProgress[m.id] || 0}
                  onClick={() => setSelectedModule(m)}
                  theme={theme}
                />
              ))}
            </div>

            <div className={`p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group mb-2 flex-shrink-0
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-black">Общий прогресс</span>
                  <span className={`${isDark ? 'text-white/90' : 'text-slate-900'} font-bold text-sm`}>Выполнено: {totalCourseProgress}%</span>
                </div>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-[9px] font-black text-indigo-500
                  ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
                   {totalCourseProgress}%
                </div>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-slate-400 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all duration-1000" 
                  style={{ width: `${totalCourseProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
              {fullHistory.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-24 italic text-sm text-center
                  ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                  <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  История тестирований пуста
                </div>
              ) : (
                fullHistory.map((entry, idx) => {
                  const module = MODULES.find(m => m.id === entry.moduleId);
                  const [correct] = entry.score.split('/').map(Number);
                  const isSuccess = correct >= 8;
                  
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border relative overflow-hidden group
                      ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                      {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>}
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                            {module?.title || 'Общий тест'} • Сессия {entry.session}
                          </span>
                          <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{entry.date}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xl font-black ${isSuccess ? 'text-green-500' : 'text-indigo-500'}`}>{entry.score}</span>
                        </div>
                      </div>
                      
                      {entry.incorrectAnswers && entry.incorrectAnswers.length > 0 && (
                        <details className="mt-2 group/err">
                          <summary className="list-none flex items-center gap-1 text-[9px] uppercase font-black text-red-400/60 tracking-widest cursor-pointer active:text-red-400">
                            Разбор ошибок ({entry.incorrectAnswers.length})
                            <svg viewBox="0 0 24 24" className="w-3 h-3 transition-transform group-open/err:rotate-180" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="mt-3 space-y-3">
                            {entry.incorrectAnswers.map((err, i) => (
                              <div key={i} className={`text-[11px] space-y-1 p-3 rounded-xl border
                                ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                <p className={`font-bold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>«{err.question}»</p>
                                <div className="flex flex-col gap-1 mt-2">
                                  <div className="flex gap-2">
                                    <span className="text-red-400/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start">Ваш выбор</span>
                                    <span className={isDark ? 'text-white/40' : 'text-slate-500'}>{err.userAnswer || '(пусто)'}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start">Верно</span>
                                    <span className={isDark ? 'text-green-300/80' : 'text-green-600'}>{err.correctAnswer}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {fullHistory.length > 0 && (
              <div className="p-4 pt-0">
                <button 
                  onClick={clearGlobalHistory}
                  className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 active:bg-red-500 active:text-white' : 'bg-red-50 border-red-100 text-red-600 active:bg-red-600 active:text-white'}`}
                >
                  Очистить всю историю
                </button>
              </div>
            )}
          </div>
        );
      case 'profile':
        return (
          <div className="flex flex-col p-6 h-full overflow-hidden space-y-4">
            <div className={`p-6 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Светлая тема</span>
              <button 
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                  ${!isDark ? 'bg-slate-800' : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                    ${!isDark ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            <div className={`p-6 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Таймер ответа 30 сек.</span>
              <button 
                onClick={toggleTimer}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                  ${isTimerEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                    ${isTimerEnabled ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            <div className={`p-6 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Подсвечивать корректность</span>
              <button 
                onClick={toggleHighlight}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                  ${isHighlightEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                    ${isHighlightEnabled ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            <div className={`p-6 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
              ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
              <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Вход по паролю</span>
              <button 
                onClick={toggleLoginRequirement}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                  ${isLoginRequired ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                    ${isLoginRequired ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>
          </div>
        );
      case 'tasks':
         return (
          <div className="flex flex-col p-6 items-center justify-center h-full">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 border
              ${isDark ? 'bg-white/5 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
               <svg viewBox="0 0 24 24" className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <h2 className={`text-xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>Задания</h2>
            <p className={`text-center text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Будут доступны позже</p>
          </div>
        );
    }
  };

  const appBg = isDark 
    ? 'bg-gradient-to-b from-[#0a1b3a] to-[#081221]' 
    : 'bg-gradient-to-b from-white to-slate-50';

  return (
    <div className={`relative h-screen max-w-md mx-auto shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${appBg}`}>
      
      <header className="px-6 py-4 pt-10 flex-shrink-0">
        <div className="flex flex-col">
          {activeTab === 'profile' ? (
            <h1 className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-none`}>Настройки</h1>
          ) : activeTab === 'history' ? (
            <h1 className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-none`}>История</h1>
          ) : (
            <>
              <span className="text-indigo-500 text-[9px] font-black uppercase tracking-[0.3em]">Обучение</span>
              <h1 className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-none`}>Лучший технолог</h1>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>

      <nav className={`h-20 backdrop-blur-2xl border-t flex items-center justify-around px-2 z-40 flex-shrink-0 transition-colors duration-300
        ${isDark ? 'bg-[#0c1e3a]/80 border-white/10' : 'bg-white/90 border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]'}`}>
        <NavButton isDark={isDark} active={activeTab === 'home'} onClick={() => setActiveTab('home')} label="Главная" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )} 
        />
        <NavButton isDark={isDark} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Задания" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )} 
        />
        <NavButton isDark={isDark} active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="История" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )} 
        />
        <NavButton isDark={isDark} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Настройки" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )} 
        />
      </nav>

      {selectedModule && (
        <ModuleDetail module={selectedModule} theme={theme} onClose={() => { setSelectedModule(null); loadData(); }} />
      )}

      {!isAuthorized && <LoginOverlay theme={theme} onAuthorized={handleAuthorize} />}
    </div>
  );
};

const NavButton: React.FC<{ isDark: boolean; active: boolean; onClick: () => void; icon: (active: boolean) => React.ReactNode; label: string }> = ({ isDark, active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all active:scale-95">
    {icon(active)}
    <span className={`text-[9px] font-bold tracking-wide uppercase transition-colors duration-300
      ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`}>
      {label}
    </span>
  </button>
);

export default App;
