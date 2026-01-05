
import React, { useState, useEffect, useRef } from 'react';
import { QUIZ_QUESTIONS, MODULES } from '../constants';
import { QuizQuestion } from '../types';

interface QuizModuleProps {
  moduleId?: string;
  theme?: 'dark' | 'light';
  onClose: () => void;
  onExitToApp?: () => void;
}

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

const QuizModule: React.FC<QuizModuleProps> = ({ moduleId, theme = 'dark', onClose, onExitToApp }) => {
  const isDark = theme === 'dark';
  const [screen, setScreen] = useState<'menu' | 'quiz' | 'results' | 'history'>('menu');
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState<QuizHistoryEntry['incorrectAnswers']>([]);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<any | null>(null);
  
  const isTimerEnabled = (() => {
    const saved = localStorage.getItem('app_timer_enabled');
    return saved === null ? true : saved === 'true';
  })();

  const isHighlightEnabled = (() => {
    const saved = localStorage.getItem('app_highlight_enabled');
    return saved === null ? true : saved === 'true';
  })();

  const currentModule = MODULES.find(m => m.id === moduleId);
  const moduleTitle = currentModule?.title || 'Тестирование';

  useEffect(() => {
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSession = localStorage.getItem(`quizSessionNum_${moduleId || 'global'}`);
    if (savedSession) setCurrentSession(parseInt(savedSession, 10));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moduleId]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startQuiz = () => {
    const questionsForModule = (moduleId && QUIZ_QUESTIONS[moduleId]) || [];
    const selected = shuffleArray(questionsForModule).slice(0, Math.min(10, questionsForModule.length));
    setSessionQuestions(selected);
    setCurrentQuestionIdx(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswers([]);
    setScreen('quiz');
  };

  useEffect(() => {
    if (screen === 'quiz' && !isAnswerConfirmed && isTimerEnabled) {
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestionIdx, screen, isAnswerConfirmed, isTimerEnabled]);

  const handleTimeOut = () => { confirmAnswer(true); };

  useEffect(() => {
    if (screen === 'quiz' && sessionQuestions.length > 0) {
      setShuffledOptions(shuffleArray(sessionQuestions[currentQuestionIdx].options));
      setSelectedOptions([]);
      setIsAnswerConfirmed(false);
    }
  }, [currentQuestionIdx, sessionQuestions, screen]);

  const toggleOption = (idx: number) => {
    if (isAnswerConfirmed) return;
    setSelectedOptions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const confirmAnswer = (isTimeout = false) => {
    if (isAnswerConfirmed) return;
    if (!isTimeout && selectedOptions.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswerConfirmed(true);
    
    const q = sessionQuestions[currentQuestionIdx];
    const correctOptionTexts = q.correct.map(idx => q.options[idx]);
    const selectedOptionTexts = selectedOptions.map(idx => shuffledOptions[idx]);
    const isFullyCorrect = !isTimeout && correctOptionTexts.length === selectedOptionTexts.length && correctOptionTexts.every(text => selectedOptionTexts.includes(text));

    if (isFullyCorrect) setCorrectAnswersCount(prev => prev + 1);
    else setIncorrectAnswers(prev => [...prev, { question: q.text, userAnswer: isTimeout ? "Время истекло" : (selectedOptionTexts.join(', ') || "Нет ответа"), correctAnswer: correctOptionTexts.join(', ') }]);

    setTimeout(() => {
      if (currentQuestionIdx < sessionQuestions.length - 1) setCurrentQuestionIdx(prev => prev + 1);
      else finishQuiz();
    }, 1500);
  };

  const finishQuiz = () => {
    const newEntry: QuizHistoryEntry = {
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      session: currentSession, score: `${correctAnswersCount}/${sessionQuestions.length}`, moduleId: moduleId, incorrectAnswers: incorrectAnswers
    };
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    localStorage.setItem(`quizSessionNum_${moduleId || 'global'}`, (currentSession + 1).toString());
    setCurrentSession(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
    setScreen('results');
  };

  const clearModuleHistory = () => {
    const filteredHistory = history.filter(h => h.moduleId !== moduleId);
    setHistory(filteredHistory);
    localStorage.setItem('quizHistory', JSON.stringify(filteredHistory));
    setCurrentSession(1);
    localStorage.setItem(`quizSessionNum_${moduleId || 'global'}`, '1');
    window.dispatchEvent(new Event('storage'));
  };

  const moduleHistory = history.filter(h => h.moduleId === moduleId);

  const renderModuleIcon = () => {
    const iconType = currentModule?.icon;
    const containerClass = `w-24 h-24 relative mb-10 flex items-center justify-center rounded-3xl border overflow-hidden group shadow-2xl ${isDark ? 'bg-white/5 border-indigo-500/20 shadow-indigo-500/10' : 'bg-white border-indigo-100 shadow-indigo-200/50'}`;
    const iconClass = "w-12 h-12 text-indigo-500 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3";

    switch (iconType) {
      case 'calc': return ( <div className={containerClass}> <div className="absolute inset-0 bg-indigo-400/5 blur-xl group-hover:bg-indigo-400/10 transition-colors"></div> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> <path d="M12 8v4M12 16h.01" /> </svg> </div> );
      case 'pump': return ( <div className={containerClass}> <div className="absolute inset-0 bg-indigo-400/5 blur-xl"></div> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <path d="M4 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM21 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM10 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM4 14v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M12 6v12" /> </svg> </div> );
      case 'search': return ( <div className={containerClass}> <div className="absolute inset-0 bg-indigo-400/5 blur-xl"></div> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" /> </svg> </div> );
      case 'corrosion': return ( <div className={containerClass}> <div className="absolute inset-0 bg-red-400/5 blur-xl"></div> <svg viewBox="0 0 24 24" className={`${iconClass} text-red-500`} fill="none" stroke="currentColor" strokeWidth="1.5"> <path d="M6 18h12M6 6h12M6 12h12M6 6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3M18 6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3" /> </svg> </div> );
      default: return ( <div className={containerClass}> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <path d="M12 2v20M2 12h20" /> </svg> </div> );
    }
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      {renderModuleIcon()}
      <h2 className={`text-3xl font-black mb-2 uppercase tracking-tight leading-none drop-shadow-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{moduleTitle}</h2>
      <p className={`mb-10 text-sm leading-relaxed max-w-[280px] ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Проверьте уровень своей подготовки. Может быть несколько вариантов ответа.</p>
      <div className="w-full space-y-3">
        <button onClick={startQuiz} className={`w-full py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-xl border
          ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-indigo-500/30 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 shadow-slate-200'}`}>Начать тест</button>
        <button onClick={() => setScreen('history')} className={`w-full py-4 rounded-2xl font-bold active:scale-[0.98] transition-all border
          ${isDark ? 'bg-white/5 border-white/10 text-indigo-100' : 'bg-white border-slate-200 text-slate-700'}`}>История тестирования</button>
        <div className="pt-4">
          <button onClick={onClose} className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] border
            ${isDark ? 'bg-white/5 border-white/10 text-white/40 active:text-white' : 'bg-white border-slate-200 text-slate-400 active:text-slate-900'}`}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Вернуться назад
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const q = sessionQuestions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / sessionQuestions.length) * 100;
    const timeProgress = (timeLeft / 30) * 100;
    const isCriticalTime = timeLeft <= 10;
    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className={`p-4 pt-8 border-b relative overflow-hidden ${isDark ? 'bg-[#0c1e3a] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Вопрос {currentQuestionIdx + 1} / {sessionQuestions.length}</span>
               {isTimerEnabled && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors duration-300
                  ${isCriticalTime ? 'bg-red-500/20 border-red-500/50 text-red-500' : (isDark ? 'bg-white/10 border-white/30 text-white' : 'bg-slate-100 border-slate-200 text-slate-600')}`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="text-[10px] font-black">{timeLeft}с</span>
                </div>
               )}
            </div>
            <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{moduleTitle}</div>
          </div>
          <div className={`w-full h-[2px] rounded-full overflow-hidden mb-1 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <div className={`h-full transition-all duration-500 ${isDark ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]'}`} style={{ width: `${progress}%` }}></div>
          </div>
          {isTimerEnabled && (
            <div className={`w-full h-[2px] rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
              <div className={`h-full transition-all duration-1000 linear ${isCriticalTime ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-indigo-500'}`} style={{ width: `${timeProgress}%` }}></div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          <div className={`p-5 rounded-2xl border shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
             <p className={`text-base leading-snug font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{q?.text}</p>
          </div>
          <div className="space-y-2">
            <p className={`text-[9px] uppercase font-black tracking-widest pl-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Может быть несколько вариантов ответа</p>
            <div className="grid grid-cols-1 gap-2">
              {shuffledOptions.map((opt, i) => {
                const isSelected = selectedOptions.includes(i);
                const qCorrectTexts = q.correct.map(idx => q.options[idx]);
                const isCorrect = qCorrectTexts.includes(opt);
                let btnClass = "w-full p-3.5 rounded-xl text-left transition-all duration-200 border flex items-center gap-3 ";
                if (!isAnswerConfirmed) {
                  // Стиль при выборе: графитовый фон, белая рамка, белый текст
                  btnClass += isSelected 
                    ? "bg-[#383838] border-white text-white shadow-lg scale-[1.01]" 
                    : (isDark 
                        ? "bg-white/5 border-white/10 text-white/80 active:bg-white/10" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300");
                } else {
                  if (isHighlightEnabled) {
                    if (isSelected) btnClass += isCorrect ? "bg-green-500 border-green-400 text-white shadow-lg" : "bg-red-500 border-red-400 text-white shadow-lg";
                    else btnClass += (isDark ? "bg-white/5 border-white/5 text-white/20 opacity-50" : "bg-slate-50 border-slate-100 text-slate-300 opacity-50");
                  } else {
                    if (isSelected) btnClass += "bg-[#383838] border-white text-white opacity-90";
                    else btnClass += (isDark ? "bg-white/5 border-white/5 text-white/10 opacity-30" : "bg-slate-50 border-slate-50 text-slate-200 opacity-30");
                  }
                }
                return ( <button key={i} onClick={() => toggleOption(i)} className={btnClass} disabled={isAnswerConfirmed}> <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 text-[10px] font-black transition-colors ${isSelected ? 'border-current bg-current/10' : 'border-current/20'}`}> {isSelected ? ( <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> ) : ( String.fromCharCode(65 + i) )} </div> <span className="flex-1 text-sm font-medium leading-tight">{opt}</span> </button> );
              })}
            </div>
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-1.5 ${isDark ? 'bg-gradient-to-t from-[#081221] via-[#081221] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
          {!isAnswerConfirmed ? (
            <button onClick={() => confirmAnswer()} disabled={selectedOptions.length === 0} className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl
                ${selectedOptions.length > 0 ? (isDark ? 'bg-slate-800 border-white text-white' : 'bg-slate-800 border-slate-700 text-white shadow-slate-200') : (isDark ? 'bg-white/5 text-white/20 border-white/20' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed')}`}>Принять ответ</button>
          ) : ( <div className="w-full h-14 flex items-center justify-center"><span className={`text-[10px] uppercase font-black tracking-widest animate-pulse ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Переход к следующему вопросу...</span></div> )}
          <button onClick={() => setScreen('menu')} className={`w-full py-2 bg-transparent font-bold uppercase text-[9px] tracking-widest transition-all ${isDark ? 'text-white/30 active:text-white/60' : 'text-slate-400 active:text-slate-900'}`}>Прервать тест</button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const total = sessionQuestions.length;
    const percentage = total > 0 ? (correctAnswersCount / total) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in duration-300">
        <div className="relative w-48 h-48 mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="44" className={`${isDark ? 'stroke-white/5' : 'stroke-slate-100'} fill-none`} strokeWidth="6" />
            <circle cx="50" cy="50" r="44" className="stroke-indigo-500 fill-none" strokeWidth="8" strokeDasharray={`${total > 0 ? (correctAnswersCount / total) * 276 : 0} 276`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.round(percentage)}%</span>
            <span className="text-[10px] text-indigo-500 uppercase font-black tracking-[0.2em] mt-1">Уровень</span>
          </div>
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Сессия #{currentSession - 1}</h2>
        <p className={`mb-10 font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Верных ответов: <span className={isDark ? 'text-white' : 'text-slate-900'}>{correctAnswersCount}</span> из {total}</p>
        <div className="w-full space-y-3">
          <button onClick={startQuiz} className={`w-full py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition-all border ${isDark ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-800 border-slate-700'}`}>Повторить тест</button>
          <button onClick={() => setScreen('history')} className={`w-full py-4 rounded-2xl font-bold active:scale-[0.98] transition-all border ${isDark ? 'bg-white/5 border-white/10 text-indigo-100' : 'bg-white border-slate-200 text-slate-700'}`}>История тестирования</button>
          <button onClick={() => onExitToApp ? onExitToApp() : onClose()} className={`w-full py-4 rounded-2xl font-bold active:scale-[0.98] transition-all opacity-60 border ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}>В главное меню</button>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
      <header className={`p-6 pt-10 border-b flex justify-between items-center ${isDark ? 'bg-[#0c1e3a] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col">
          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>История тестирования</span>
          <h3 className={`font-bold text-sm truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{moduleTitle}</h3>
        </div>
        <button onClick={() => setScreen('menu')} className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>Назад</button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {moduleHistory.length === 0 ? ( <div className={`flex flex-col items-center justify-center py-24 italic text-sm ${isDark ? 'text-white/20' : 'text-slate-300'}`}> <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Попыток еще не было </div> ) : (
          moduleHistory.map((entry, idx) => {
             const [correct] = entry.score.split('/').map(Number);
             const isSuccess = correct >= 8;
             return ( <div key={idx} className={`p-5 rounded-2xl border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}> {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>} <div className="flex justify-between items-start mb-3"> <div className="flex flex-col"> <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Сессия {entry.session}</span> <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{entry.date}</span> </div> <div className="flex flex-col items-end"> <span className={`text-xl font-black ${isSuccess ? 'text-green-500' : 'text-indigo-500'}`}>{entry.score}</span> <span className={`text-[8px] font-black uppercase tracking-tighter ${isSuccess ? 'text-green-600/50' : 'text-indigo-500/50'}`}> {isSuccess ? 'Успешно' : 'Нужна практика'} </span> </div> </div> {entry.incorrectAnswers.length > 0 && ( <div className={`mt-4 pt-4 border-t space-y-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}> <span className="text-[9px] uppercase font-black text-red-500/60 tracking-widest">Разбор ошибок ({entry.incorrectAnswers.length}):</span> {entry.incorrectAnswers.map((err, i) => ( <div key={i} className={`text-[11px] space-y-1 p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}> <p className={`font-bold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>«{err.question}»</p> <div className="flex flex-col gap-1 mt-2"> <div className="flex gap-2"> <span className="text-red-500/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start">Ваш выбор</span> <span className={isDark ? 'text-white/40' : 'text-slate-500'}>{err.userAnswer || '(пусто)'}</span> </div> <div className="flex gap-2"> <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start">Верно</span> <span className={isDark ? 'text-green-300/80' : 'text-green-600'}>{err.correctAnswer}</span> </div> </div> </div> ))} </div> )} </div> );
          })
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDark ? 'bg-gradient-to-t from-[#081221] via-[#081221]/90 to-transparent' : 'bg-gradient-to-t from-white via-white/90 to-transparent'}`}>
        <button onClick={clearModuleHistory} className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 active:bg-red-500 active:text-white' : 'bg-red-50 border-red-100 text-red-500 active:bg-red-500 active:text-white'}`}>Удалить историю этого модуля</button>
      </div>
    </div>
  );

  const mainBg = isDark ? 'bg-[#081221]' : 'bg-slate-50';
  return ( <div className={`fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom duration-300 ${mainBg}`}> {screen === 'menu' && renderMenu()} {screen === 'quiz' && renderQuiz()} {screen === 'results' && renderResults()} {screen === 'history' && renderHistory()} </div> );
};

export default QuizModule;
