
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSection, ModuleData, QuizQuestion } from './types';
import { MODULES, QUIZ_QUESTIONS } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';
import LoginOverlay from './components/LoginOverlay';
import AnimatedContent from './components/AnimatedContent';
import SulfateGame from './components/SulfateGame';
import FruitNinjaGame from './components/FruitNinjaGame';
import SplitText from './components/SplitText';

import CloudStatus from './components/CloudStatus';

const GLOBAL_QUESTION_COUNTS: Record<string, number> = {
  'esp-selection-startup': 110,
  'failure-investigation': 96,
  'operating-factors': 96,
  'pbotos-general': 139,
  'pbotos-siz': 241,
  'pbotos-harmful': 221,
  'pbotos-firstaid': 70,
  'pbotos-a1': 211,
  'pbotos-b21': 405,
};

const PBOTOS_SUBMODULES: Record<string, string> = {
  'pbotos-general': 'Общие вопросы ОТ',
  'pbotos-siz': 'СИЗ',
  'pbotos-harmful': 'Вредные и опасные ПФ',
  'pbotos-firstaid': 'Оказание первой помощи',
  'pbotos-a1': 'А1. Основы ПБ',
  'pbotos-b21': 'Б.2.1 Для объектов нефтяной промышленности',
};

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

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'contestant' | 'admin' | null>(null);

  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [isTasksPressed, setIsTasksPressed] = useState<boolean>(false);

  const handleTasksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isTasksPressed) return;
    setIsTasksPressed(true);
    setTimeout(() => {
      setIsTasksPressed(false);
      setActiveTab('tasks');
    }, 180);
  };

  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [moduleRecentScores, setModuleRecentScores] = useState<Record<string, number[]>>({});
  const [fullHistory, setFullHistory] = useState<QuizHistoryEntry[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  
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
  const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);

  // Гарантируем чистоту сессии и сброс сохраненной авторизации при каждой загрузке страницы
  useEffect(() => {
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_remember_me');
  }, []);

  const sendHistoryToTelegram = async () => {
    if (fullHistory.length === 0) {
      alert("История пуста. Нечего отправлять.");
      return;
    }

    const escapeHTML = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    setTelegramStatus('sending');
    try {
      // Группируем результаты по модулям
      const statsByModule: Record<string, { count: number, totalScore: number, latestEntry?: QuizHistoryEntry }> = {};
      fullHistory.forEach(entry => {
        const modId = entry.moduleId || 'unknown';
        if (!statsByModule[modId]) {
          statsByModule[modId] = { count: 0, totalScore: 0, latestEntry: entry };
        }
        
        const scoreParts = entry.score.split('/');
        const score = parseInt(scoreParts[0]) || 0;
        statsByModule[modId].count += 1;
        statsByModule[modId].totalScore += score;
      });

      const today = new Date().toLocaleDateString('ru-RU');
      const summaries: string[] = [];
      let currentSummary = `<b>📊 Сводный отчет о результатах тестирования на ${today}</b>\n\n`;

      const getRecentScoresWithDates = (modId: string, isPbotosAggregated = false) => {
        let entries: QuizHistoryEntry[] = [];
        if (isPbotosAggregated) {
          const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
          entries = fullHistory.filter(h => h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId)));
        } else {
          entries = fullHistory.filter(h => h.moduleId === modId);
        }
        
        if (entries.length === 0) return '';
        // fullHistory is sorted desc (newest first). last 3 entries = top 3.
        // We want to display oldest of the 3 first, so we reverse it.
        const last3 = entries.slice(0, 3).reverse();
        const scores = last3.map(h => {
          const [correct, total] = h.score.split('/').map(Number);
          if (isNaN(correct) || isNaN(total) || total === 0) return '0%';
          return Math.round((correct / total) * 100) + '%';
        });
        const dates = last3.map(h => {
          const d = new Date(h.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = String(d.getFullYear()).slice(-2);
          return `${day}.${month}.${year}г.`;
        });
        return `${scores.join(', ')} (${dates.join(', ')})`;
      };

      // Проходим по модулям в заданном порядке (из constants.tsx)
      for (const module of MODULES) {
        const modId = module.id;
        let section = '';
        
        if (modId === 'pbotos') {
          // Сначала выводим основной ПБОТОС если есть
          if (statsByModule['pbotos']) {
            const stats = statsByModule['pbotos'];
            const recentScoresStr = getRecentScoresWithDates('pbotos', true);
            section += `🔹 <b>ПБОТОС</b>\n`;
            if (recentScoresStr) {
              section += `   Последние результаты: ${recentScoresStr}\n`;
            }
            section += `\n`;
          }

          // Затем подразделы ПБОТОС
          for (const [subId, subTitle] of Object.entries(PBOTOS_SUBMODULES)) {
            if (statsByModule[subId]) {
              const stats = statsByModule[subId];
              const recentScoresStr = getRecentScoresWithDates(subId);
              section += `🔹 <b>ПБОТОС/${subTitle}</b>\n`;
              if (recentScoresStr) {
                section += `   Последние результаты: ${recentScoresStr}\n`;
              }
              
              // Получаем количество вопросов из последнего теста
              const lastEntry = stats.latestEntry;
              if (lastEntry) {
                const scoreParts = lastEntry.score.split('/');
                const questionsInTest = parseInt(scoreParts[1]) || 0;
                const totalInDb = GLOBAL_QUESTION_COUNTS[subId] || 0;
                section += `   Пройдено вопросов с начала подготовки: ${questionsInTest} из ${totalInDb}\n`;
              }
              section += `\n`;
            }
          }
        } else {
          // Обычные модули
          if (statsByModule[modId]) {
            const stats = statsByModule[modId];
            const recentScoresStr = getRecentScoresWithDates(modId);
            
            section += `🔹 <b>${module.title}</b>\n`;
            if (recentScoresStr) {
              section += `   Последние результаты: ${recentScoresStr}\n`;
            }

            // Добавляем информацию о количестве вопросов
            const lastEntry = stats.latestEntry;
            if (lastEntry) {
              const scoreParts = lastEntry.score.split('/');
              const questionsInTest = parseInt(scoreParts[1]) || 0;
              const totalInDb = GLOBAL_QUESTION_COUNTS[modId] || 0;
              if (totalInDb > 0) {
                section += `   Пройдено вопросов с начала подготовки: ${questionsInTest} из ${totalInDb}\n`;
              }
            }

            if (stats.latestEntry?.incorrectAnswers && stats.latestEntry.incorrectAnswers.length > 0) {
              section += `<blockquote expandable>`;
              section += `<b>Ошибки в последнем тесте:</b>\n\n`;
              stats.latestEntry.incorrectAnswers.forEach((ans, idx) => {
                section += `<b>${idx + 1}. ${escapeHTML(ans.question)}</b>\n`;
                section += `❌ Ваш ответ: ${escapeHTML(ans.userAnswer)}\n`;
                section += `✅ Правильный: ${escapeHTML(ans.correctAnswer)}\n\n`;
              });
              section += `</blockquote>`;
            }
            section += `\n`;
          }
        }

        // Проверяем лимит перед добавлением секции
        if (currentSummary.length + section.length > 3900) {
          summaries.push(currentSummary);
          currentSummary = section;
        } else {
          currentSummary += section;
        }
      }

      currentSummary += `🕒 <i>Последнее обновление: ${new Date().toLocaleString()}</i>`;
      summaries.push(currentSummary);

      for (const summaryPart of summaries) {
        if (!summaryPart.trim()) continue;
        
        const response = await fetch('/api/telegram/send-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: summaryPart }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to send');
        }
        
        // Небольшая пауза между отправкой сообщений
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      setTelegramStatus('success');
      setTimeout(() => setTelegramStatus('idle'), 3000);
    } catch (error: any) {
      console.error(error);
      alert(`Ошибка отправки: ${error.message}`);
      setTelegramStatus('error');
      setTimeout(() => setTelegramStatus('idle'), 3000);
    }
  };

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
      console.warn("Error loading data from cloud:", error);
      setSyncStatus('error');
      const savedHistory = localStorage.getItem('quizHistory');
      if (savedHistory) history = JSON.parse(savedHistory);
    }

    setFullHistory(history);
    setSyncStatus('synced');
    
    const recentScoresMap: Record<string, number[]> = {};
    
    MODULES.forEach(module => {
      // For pbotos, we want to consider all submodules too
      let moduleEntries: QuizHistoryEntry[] = [];
      if (module.id === 'pbotos') {
        const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
        moduleEntries = history.filter((h: QuizHistoryEntry) => 
          h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId))
        );
      } else {
        moduleEntries = history.filter((h: QuizHistoryEntry) => h.moduleId === module.id);
      }

      const lastEntry = moduleEntries[0]; // history is sorted by date desc
      
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

  const handleLogout = () => {
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_remember_me');
    sessionStorage.removeItem('app_admin_password');
    setUserRole(null);
    setIsAuthorized(false);
    setAdminPassword('');
    setActiveTab('home');
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

  const [showAdminOnlyAlert, setShowAdminOnlyAlert] = useState(false);

  const handleAdminOnlyClick = () => {
    setShowAdminOnlyAlert(true);
  };

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
                            title={m.id === 'failure-investigation' ? 'Расследование отказов' : m.title}
                            iconType={m.icon}
                            progress={moduleProgress[m.id] || 0}
                            recentScores={moduleRecentScores[m.id] || []}
                            questionCount={GLOBAL_QUESTION_COUNTS[m.id]}
                            onClick={() => setSelectedModule(m)}
                            theme={theme}
                          />
                        </AnimatedContent>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
                      <AnimatedContent distance={30} delay={0.8} direction="vertical">
                        <motion.button 
                          onClick={handleTasksClick}
                          animate={{ scale: isTasksPressed ? 0.95 : 1 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className={`w-full p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group flex items-center justify-between transition-all
                            ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 shadow-sm text-slate-900'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors
                              ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="5" width="18" height="11" rx="1" />
                                <path d="M2 18h20" />
                                <circle cx="8" cy="10.5" r="2.2" />
                                <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                                <path d="M6.5 9l3 3M9.5 9l-3 3" />
                                <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                                <path d="M12.5 10l3.5-3.5 3 2" />
                                <path d="M6 14h3" opacity="0.5" />
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
                        </motion.button>
                      </AnimatedContent>
                    </div>
                  </div>
                );
              case 'history':
                const getFilterLabel = (filterVal: string) => {
                  if (filterVal === 'all') return 'Все разделы';
                  if (filterVal === 'matrix-tz') return 'Матрица ТЗ';
                  if (filterVal === 'pbotos-all' || filterVal === 'pbotos') return 'ПБОТОС';
                  const matchedModule = MODULES.find(m => m.id === filterVal);
                  if (matchedModule) {
                    return matchedModule.id === 'failure-investigation' ? 'Расследование отказов' : (matchedModule.id === 'esp-selection-startup' ? 'Подбор УЭЦН и ВНР' : matchedModule.title);
                  }
                  const pbotosTitle = PBOTOS_SUBMODULES[filterVal];
                  if (pbotosTitle) {
                    return `ПБОТОС / ${filterVal === 'pbotos-b21' ? 'Б.2.1' : pbotosTitle}`;
                  }
                  return filterVal;
                };

                const filteredHistory = (() => {
                  if (historyFilter === 'all') return fullHistory;
                  if (historyFilter === 'pbotos-all' || historyFilter === 'pbotos') {
                    const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
                    return fullHistory.filter(h => h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId)));
                  }
                  return fullHistory.filter(h => h.moduleId === historyFilter);
                })();

                return (
                  <div className="flex-1 flex flex-col overflow-hidden px-4">
                    {/* Vertical Filter Dropdown */}
                    <div className="flex-shrink-0 mb-4 relative z-40">
                      <button
                        onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-sm active:scale-[0.99]
                          ${isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 border-white/10 text-white' 
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        <span className="flex items-center gap-3">
                          <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <span className="text-[11px]">Фильтр: {getFilterLabel(historyFilter)}</span>
                        </span>
                        <motion.svg
                          animate={{ rotate: isHistoryFilterOpen ? 180 : 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="w-4 h-4 opacity-60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </motion.svg>
                      </button>

                      <AnimatePresence>
                        {isHistoryFilterOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className={`overflow-hidden rounded-2xl border absolute left-0 right-0 shadow-2xl max-h-80 overflow-y-auto no-scrollbar
                              ${isDark ? 'bg-slate-900 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 backdrop-blur-md'}`}
                          >
                            <div className="p-2 flex flex-col gap-1">
                              {/* Option All */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('all');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between
                                  ${historyFilter === 'all'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Все разделы</span>
                                {historyFilter === 'all' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Header: Раздел "Тестирование" (underlined, informative, not clickable) */}
                              <div className={`px-4 pt-3 pb-1 text-[11px] font-black uppercase tracking-wider underline
                                ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Раздел &ldquo;Тестирование&rdquo;
                              </div>

                              {/* Option: Подбор УЭЦН и ВНР */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('esp-selection-startup');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'esp-selection-startup'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Подбор УЭЦН и ВНР</span>
                                {historyFilter === 'esp-selection-startup' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: Расследование отказов */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('failure-investigation');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'failure-investigation'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Расследование отказов</span>
                                {historyFilter === 'failure-investigation' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: Осложняющие факторы */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('operating-factors');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'operating-factors'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Осложняющие факторы</span>
                                {historyFilter === 'operating-factors' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: ПБОТОС */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('pbotos-all');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'pbotos-all' || historyFilter === 'pbotos'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>ПБОТОС</span>
                                {(historyFilter === 'pbotos-all' || historyFilter === 'pbotos') && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Header: Раздел "Упражнения" (underlined, informative, not clickable) */}
                              <div className={`px-4 pt-3 pb-1 text-[11px] font-black uppercase tracking-wider underline
                                ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Раздел &ldquo;Упражнения&rdquo;
                              </div>

                              {/* Option: Матрица ТЗ */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('matrix-tz');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'matrix-tz'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Матрица ТЗ</span>
                                {historyFilter === 'matrix-tz' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div key={historyFilter} className="flex-1 overflow-y-auto space-y-3 pb-24 pr-1">
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
                          const LEGACY_MODULE_MAPPING: Record<string, string> = {
                            'esp-selection': 'Подбор УЭЦН и ВНР',
                            'esp-startup': 'Подбор УЭЦН и ВНР',
                            'vnr': 'Подбор УЭЦН и ВНР',
                            'esp-selection-startup': 'Подбор УЭЦН и ВНР'
                          };

                          const module = MODULES.find(m => m.id === entry.moduleId);
                          
                          let displayTitle = module?.title?.replace('\n', ' ') || entry.moduleId || 'Общий тест';
                          if (entry.moduleId === 'matrix-tz') {
                            displayTitle = 'Матрица ТЗ';
                          }
                          
                          if (entry.moduleId && PBOTOS_SUBMODULES[entry.moduleId]) {
                            displayTitle = `ПБОТОС / ${PBOTOS_SUBMODULES[entry.moduleId]}`;
                          } else if (entry.moduleId && LEGACY_MODULE_MAPPING[entry.moduleId]) {
                            displayTitle = LEGACY_MODULE_MAPPING[entry.moduleId];
                          } else if (entry.moduleId === 'pbotos') {
                            displayTitle = 'ПБОТОС';
                          }

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
                                      {displayTitle} • Сессия {entry.session}
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
                  <div className="flex flex-col p-4 h-full overflow-y-auto space-y-3 pb-24">
                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Светлая тема</span>
                        <button 
                          onClick={toggleTheme}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${!isDark ? 'bg-slate-800' : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${!isDark ? 'left-7' : 'left-1'}`}
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
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
                        ${userRole !== 'admin' ? 'opacity-40' : ''}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Таймер ответа 30 сек.</span>
                        <button 
                          onClick={userRole === 'admin' ? toggleTimer : handleAdminOnlyClick}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
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
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
                        ${userRole !== 'admin' ? 'opacity-40' : ''}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Подсвечивать корректность после ответа</span>
                        <button 
                          onClick={userRole === 'admin' ? toggleHighlight : handleAdminOnlyClick}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
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
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}
                        ${userRole !== 'admin' ? 'opacity-40' : ''}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Правильный ответ в истории</span>
                        <button 
                          onClick={userRole === 'admin' ? toggleHistoryAnswers : handleAdminOnlyClick}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${isHistoryAnswersEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${isHistoryAnswersEnabled ? 'left-7' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.35} direction="vertical">
                      <button 
                        onClick={sendHistoryToTelegram}
                        disabled={telegramStatus === 'sending'}
                        className={`w-full p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md transition-all active:scale-[0.98]
                          ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}
                          ${telegramStatus === 'sending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
                            ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                            {telegramStatus === 'sending' ? (
                              <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : telegramStatus === 'success' ? (
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : telegramStatus === 'error' ? (
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
                              </svg>
                            )}
                          </div>
                          <span className="text-base font-semibold">
                            {telegramStatus === 'sending' ? 'Отправка...' : 
                             telegramStatus === 'success' ? 'Отправлено!' : 
                             telegramStatus === 'error' ? 'Ошибка!' : 'Отправить отчет в Telegram'}
                          </span>
                        </div>
                        <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.4} direction="vertical">
                      <button 
                        onClick={handleLogout}
                        className={`w-full p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md transition-all active:scale-[0.98]
                          ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
                            ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                            </svg>
                          </div>
                          <span className="text-base font-semibold">Выйти из аккаунта</span>
                        </div>
                      </button>
                    </AnimatedContent>
                  </div>
                );
              case 'tasks':
                 return (
                  <div className="flex flex-col px-6 py-4 flex-1 overflow-y-auto space-y-4">
                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Минеральные соли при эксплуатации</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('sulfate')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-200'}`}
                        >
                          Запустить
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.2} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Критерии матрицы применимости технологий защиты</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('ninja')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-200'}`}
                        >
                          Запустить
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
      <AnimatePresence>
        {showAdminOnlyAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-xs p-8 rounded-[2.5rem] border text-center shadow-2xl
                ${isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6
                ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Доступ ограничен
              </h3>
              <p className={`text-xs font-medium leading-relaxed mb-8 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                Доступ к настройкам у администратора
              </p>
              <button 
                onClick={() => setShowAdminOnlyAlert(false)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${isDark ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
              >
                ОК
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                    <div className="flex items-center justify-between">
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
                        display="inline-block"
                        tag="h1"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 1.25, 
                          delay: 0,
                          ease: [0.22, 1, 0.36, 1] // Smooth easeOut (similar to power3.out)
                        }}
                        className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-colors
                        ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="5" width="18" height="11" rx="1" />
                          <path d="M2 18h20" />
                          <circle cx="8" cy="10.5" r="2.2" />
                          <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                          <path d="M6.5 9l3 3M9.5 9l-3 3" />
                          <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                          <path d="M12.5 10l3.5-3.5 3 2" />
                          <path d="M6 14h3" opacity="0.5" />
                        </svg>
                      </motion.div>
                    </div>
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
              <NavButton isDark={isDark} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Упражнения" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="11" rx="1" />
                    <path d="M2 18h20" />
                    <circle cx="8" cy="10.5" r="2.2" />
                    <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                    <path d="M6.5 9l3 3M9.5 9l-3 3" />
                    <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                    <path d="M12.5 10l3.5-3.5 3 2" />
                    <path d="M6 14h3" opacity="0.5" />
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
        {activeGame === 'ninja' && (
          <motion.div
            key="ninja-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <FruitNinjaGame 
              isDark={isDark} 
              onClose={() => setActiveGame(null)} 
              userRole={userRole} 
              onShowHistory={() => {
                setActiveTab('history');
                setHistoryFilter('matrix-tz');
                setActiveGame(null);
              }}
            />
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
