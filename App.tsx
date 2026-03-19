
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSection, ModuleData, QuizQuestion } from './types';
import { MODULES, QUIZ_QUESTIONS } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';
import LoginOverlay from './components/LoginOverlay';
import AnimatedContent from './components/AnimatedContent';
import SulfateGame from './components/SulfateGame';
import SplitText from './components/SplitText';

import CloudStatus from './components/CloudStatus';

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
    return false;
  });

  const [userRole, setUserRole] = useState<'contestant' | 'admin' | null>(() => {
    return localStorage.getItem('app_user_role') as 'contestant' | 'admin' | null;
  });

  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [moduleRecentScores, setModuleRecentScores] = useState<Record<string, number[]>>({});
  const [fullHistory, setFullHistory] = useState<QuizHistoryEntry[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_timer_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isHighlightEnabled, setIsHighlightEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_highlight_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isHistoryAnswersEnabled, setIsHistoryAnswersEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_history_answers_enabled');
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

  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return sessionStorage.getItem('app_admin_password') || '';
  });

  const [historyFilter, setHistoryFilter] = useState<string | 'all'>('all');

  const loadData = async () => {
    setSyncStatus('syncing');
    const latestProgress: Record<string, number> = {};
    MODULES.forEach(m => latestProgress[m.id] = 0);

    let history: QuizHistoryEntry[] = [];
    
    try {
      // Fetch history
      const historyResponse = await fetch('/api/history');
      if (historyResponse.ok) {
        history = await historyResponse.json();
      } else {
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) history = JSON.parse(savedHistory);
      }

      // Fetch global config
      const configResponse = await fetch('/api/config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.isHistoryAnswersEnabled !== undefined) {
          setIsHistoryAnswersEnabled(config.isHistoryAnswersEnabled);
          localStorage.setItem('app_history_answers_enabled', String(config.isHistoryAnswersEnabled));
        }
      }
    } catch (error) {
      console.error("Error loading data from cloud:", error);
      setSyncStatus('error');
      const savedHistory = localStorage.getItem('quizHistory');
      if (savedHistory) history = JSON.parse(savedHistory);
    }

    setFullHistory(history);
    setSyncStatus('synced');
    
    const recentScoresMap: Record<string, number[]> = {};
    
    MODULES.forEach(module => {
      // Calculate progress (last result)
      const moduleEntries = history.filter((h: QuizHistoryEntry) => h.moduleId === module.id);
      const lastEntry = moduleEntries[0]; // history is usually sorted by date desc
      
      if (lastEntry && lastEntry.score) {
        const [correct, total] = lastEntry.score.split('/').map(Number);
        if (!isNaN(correct) && !isNaN(total) && total > 0) {
          latestProgress[module.id] = Math.round((correct / total) * 100);
        }
      }
      
      // Calculate last 3 scores
      const last3 = moduleEntries.slice(0, 3).reverse().map((h: QuizHistoryEntry) => {
        const [correct, total] = h.score.split('/').map(Number);
        return Math.round((correct / total) * 100);
      });
      recentScoresMap[module.id] = last3;
    });
    
    setModuleProgress(latestProgress);
    setModuleRecentScores(recentScoresMap);
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

  const handleAuthorize = (role: 'contestant' | 'admin', password?: string) => {
    setUserRole(role);
    localStorage.setItem('app_user_role', role);
    if (role === 'admin' && password) {
      setAdminPassword(password);
      sessionStorage.setItem('app_admin_password', password);
    }
    setIsAuthorized(true);
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

  const updateConfig = async (key: string, value: any) => {
    if (userRole !== 'admin') return;
    
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ key, value })
      });
    } catch (error) {
      console.error(`Failed to sync global config for ${key}:`, error);
    }
  };

  const toggleHistoryAnswers = async () => {
    const newValue = !isHistoryAnswersEnabled;
    setIsHistoryAnswersEnabled(newValue);
    localStorage.setItem('app_history_answers_enabled', String(newValue));
    
    // Sync with global config if admin
    if (userRole === 'admin') {
      updateConfig('isHistoryAnswersEnabled', newValue);
    }
  };

  const toggleLoginRequirement = () => {
    const newValue = !isLoginRequired;
    setIsLoginRequired(newValue);
    localStorage.setItem('app_login_required', String(newValue));
    if (!newValue) {
      setIsAuthorized(true);
    }
  };

  const clearGlobalHistory = async () => {
    if (userRole !== 'admin') {
      alert('У вас нет прав для очистки глобальной истории.');
      return;
    }

    if (window.confirm('Вы уверены, что хотите полностью очистить ВСЮ историю тестирования во всех аккаунтах и в облаке?')) {
      console.log("Attempting to clear global history...");
      setSyncStatus('syncing');
      try {
        const response = await fetch('/api/history', { 
          method: 'DELETE',
          headers: { 'x-admin-password': adminPassword }
        });
        const result = await response.json();
        
        if (response.ok) {
          localStorage.removeItem('quizHistory');
          MODULES.forEach(m => {
            localStorage.removeItem(`quizSessionNum_${m.id}`);
          });
          
          await loadData();
          window.dispatchEvent(new Event('storage'));
          alert(`✅ База очищена. Удалено записей: ${result.deletedCount || 0}`);
        } else {
          alert('❌ Ошибка при удалении из облака: ' + (result.error || 'Неизвестная ошибка'));
          setSyncStatus('error');
        }
      } catch (error: any) {
        console.error("Clear history error:", error);
        alert('❌ Ошибка сети: ' + error.message);
        setSyncStatus('error');
      }
    }
  };

  const isDark = theme === 'dark';

  const renderContent = () => {
    const key = `${activeTab}-${selectedModule ? 'modal' : 'main'}-${activeGame ? 'game' : 'none'}`;

    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {(() => {
            switch (activeTab) {
              case 'home':
                return (
                  <div className="flex-1 flex flex-col px-4 pb-2 gap-3 overflow-hidden">
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <AnimatedContent distance={30} delay={0.1} direction="vertical">
                        <div className={`w-full p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group flex items-center justify-between transition-all
                          ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors
                              ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-black">Раздел</span>
                              <span className="font-bold text-sm">Тестирование</span>
                            </div>
                          </div>
                        </div>
                      </AnimatedContent>
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto">
                      {MODULES.map((m, index) => (
                        <AnimatedContent
                          key={m.id}
                          distance={40}
                          delay={0.2 + index * 0.1}
                          direction="vertical"
                        >
                          <GlassButton 
                            title={m.title}
                            iconType={m.icon}
                            progress={moduleProgress[m.id] || 0}
                            recentScores={moduleRecentScores[m.id] || []}
                            onClick={() => setSelectedModule(m)}
                            theme={theme}
                          />
                        </AnimatedContent>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
                      <AnimatedContent distance={30} delay={0.8} direction="vertical">
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className={`w-full p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group flex items-center justify-between active:scale-[0.98] transition-all
                            ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors
                              ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-black">Раздел</span>
                              <span className="font-bold text-sm">Упражнения</span>
                            </div>
                          </div>
                          <svg viewBox="0 0 24 24" className={`w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </AnimatedContent>
                    </div>
                  </div>
                );
              case 'history':
                const filteredHistory = historyFilter === 'all' 
                  ? fullHistory 
                  : fullHistory.filter(h => h.moduleId === historyFilter);

                return (
                  <div className="flex-1 flex flex-col overflow-hidden px-4">
                    {/* Filter Bar */}
                    <div className="flex-shrink-0 mb-4 overflow-x-auto no-scrollbar flex gap-2 pb-2">
                      <button 
                        onClick={() => setHistoryFilter('all')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap
                          ${historyFilter === 'all' 
                            ? (isDark ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-white') 
                            : (isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400')}`}
                      >
                        Все разделы
                      </button>
                      {MODULES.map(m => (
                        <button 
                          key={m.id}
                          onClick={() => setHistoryFilter(m.id)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap
                            ${historyFilter === m.id 
                              ? (isDark ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-800 border-slate-700 text-white') 
                              : (isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400')}`}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pb-24 pr-1">
                      {filteredHistory.length === 0 ? (
                        <AnimatedContent distance={20} delay={0.2}>
                          <div className={`flex flex-col items-center justify-center py-24 italic text-sm text-center
                            ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                            <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" strokeWidth="1">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {historyFilter === 'all' ? 'История тестирований пуста' : 'В этом разделе еще нет результатов'}
                          </div>
                        </AnimatedContent>
                      ) : (
                        filteredHistory.map((entry, idx) => {
                          const module = MODULES.find(m => m.id === entry.moduleId);
                          const [correct] = entry.score.split('/').map(Number);
                          const isSuccess = correct >= 8;
                          // Show answers if user is admin OR if history answers are enabled for contestants
                          const showCorrectAnswers = userRole === 'admin' || isHistoryAnswersEnabled;
                          
                          const formattedDate = (() => {
                            try {
                              return new Date(entry.date).toLocaleString('ru-RU', { 
                                day: '2-digit', month: '2-digit', year: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              });
                            } catch (e) {
                              return entry.date;
                            }
                          })();

                          return (
                            <AnimatedContent key={idx} distance={30} delay={idx * 0.05}>
                              <div className={`p-5 rounded-2xl border relative overflow-hidden group
                                ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>}
                                
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                                      {module?.title || 'Общий тест'} • Сессия {entry.session}
                                    </span>
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{formattedDate}</span>
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
                                            {showCorrectAnswers && (
                                              <div className="flex gap-2">
                                                <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start">Верно</span>
                                                <span className={isDark ? 'text-green-300/80' : 'text-green-600'}>{err.correctAnswer}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </AnimatedContent>
                          );
                        })
                      )}
                    </div>
                    {fullHistory.length > 0 && userRole === 'admin' && (
                      <AnimatedContent distance={20} delay={0.5} direction="vertical" className="p-4 pt-0">
                        <button 
                          onClick={clearGlobalHistory}
                          className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 active:bg-red-500 active:text-white' : 'bg-red-50 border-red-100 text-red-600 active:bg-red-600 active:text-white'}`}
                        >
                          Очистить всю историю (Admin)
                        </button>
                      </AnimatedContent>
                    )}
                  </div>
                );
              case 'profile':
                return (
                  <div className="flex flex-col p-6 h-full overflow-y-auto space-y-4 pb-24">
                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
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
                    </AnimatedContent>

                    {userRole === 'admin' && (
                      <>
                        <AnimatedContent distance={30} delay={0.15} direction="vertical">
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
                        </AnimatedContent>

                        <AnimatedContent distance={20} delay={0.18} direction="vertical">
                          <p className={`text-[10px] font-black uppercase tracking-widest px-6 pt-2 pb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                            Отображение для конкурсанта
                          </p>
                        </AnimatedContent>

                        <AnimatedContent distance={30} delay={0.2} direction="vertical">
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
                        </AnimatedContent>

                        <AnimatedContent distance={30} delay={0.25} direction="vertical">
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
                        </AnimatedContent>

                        <AnimatedContent distance={30} delay={0.3} direction="vertical">
                          <div className={`p-6 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                            ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Правильный ответ в истории</span>
                            <button 
                              onClick={toggleHistoryAnswers}
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                                ${isHistoryAnswersEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                            >
                              <div 
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                                  ${isHistoryAnswersEnabled ? 'left-7' : 'left-1'}`}
                              />
                            </button>
                          </div>
                        </AnimatedContent>

                      </>
                    )}
                  </div>
                );
              case 'tasks':
                 return (
                  <div className="flex flex-col px-6 py-4 flex-1 overflow-y-auto space-y-4">
                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border transition-colors
                            ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest
                            ${isDark ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                            Мини-игра
                          </span>
                        </div>
                        
                        <h3 className={`text-xl font-black mb-2 uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Типы минеральных солей</h3>
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение на поиск минеральных солей
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('sulfate')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-200'}`}
                        >
                          Запустить упражнение
                        </button>
                      </div>
                    </AnimatedContent>
                  </div>
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const appBg = isDark ? 'bg-[#081221]' : 'bg-slate-50';

  return (
    <div className={`relative h-screen max-w-md mx-auto shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${appBg}`}>
      <div className="absolute top-4 right-4 z-[120]">
        <CloudStatus status={syncStatus} />
      </div>
      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          <motion.div
            key="login-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[100]"
          >
            <LoginOverlay 
              theme={theme} 
              onAuthorized={(role, password) => handleAuthorize(role, password)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col h-full w-full relative"
          >
            <header className="px-6 py-4 pt-10 flex-shrink-0">
              <AnimatedContent
                distance={20}
                delay={0}
                direction="vertical"
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-500 text-[12px] font-black uppercase tracking-[0.3em]">Обучение</span>
                  </div>
                  {activeTab === 'profile' ? (
                    <SplitText
                      key="profile-header"
                      text="Настройки"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  ) : activeTab === 'history' ? (
                    <SplitText
                      key="history-header"
                      text="История"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  ) : activeTab === 'tasks' ? (
                    <SplitText
                      key="tasks-header"
                      text="Упражнения"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  ) : (
                    <SplitText
                      key="home-header"
                      text="Лучший технолог"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  )}
                </div>
              </AnimatedContent>
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
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )} 
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedModule && (
          <motion.div
            key="module-detail"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50"
          >
            <ModuleDetail 
              module={selectedModule} 
              theme={theme} 
              userRole={userRole}
              isTimerEnabled={isTimerEnabled}
              isHighlightEnabled={isHighlightEnabled}
              isHistoryAnswersEnabled={isHistoryAnswersEnabled}
              syncStatus={syncStatus}
              onClose={() => { setSelectedModule(null); loadData(); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame === 'sulfate' && (
          <motion.div
            key="sulfate-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <SulfateGame isDark={isDark} syncStatus={syncStatus} onClose={() => setActiveGame(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavButton: React.FC<{ isDark: boolean; active: boolean; onClick: () => void; icon: (active: boolean) => React.ReactNode; label: string }> = ({ isDark, active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative group">
    <motion.div 
      className="flex flex-col items-center justify-center gap-1"
      animate={{ 
        scale: active ? 1.1 : 1,
        y: active ? -2 : 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className="relative">
        {icon(active)}
        {active && (
          <motion.div 
            layoutId="nav-glow"
            className="absolute inset-0 bg-indigo-500/20 blur-md rounded-full -z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      <span className={`text-[9px] font-bold tracking-wide uppercase transition-colors duration-300
        ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`}>
        {label}
      </span>
    </motion.div>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-500"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </button>
);

export default App;
