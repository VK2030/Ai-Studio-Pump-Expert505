
import React, { useState, useEffect, useMemo } from 'react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../constants';

interface QuizModuleProps {
  onClose: () => void;
  onExitToApp?: () => void;
}

interface QuizHistoryEntry {
  date: string;
  session: number;
  score: string;
  incorrectAnswers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

const QuizModule: React.FC<QuizModuleProps> = ({ onClose, onExitToApp }) => {
  const [screen, setScreen] = useState<'menu' | 'quiz' | 'results' | 'history'>('menu');
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<QuizHistoryEntry['incorrectAnswers']>([]);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  // Load history and session from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('quizHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSession = localStorage.getItem('quizSessionNum');
    if (savedSession) setCurrentSession(parseInt(savedSession, 10));
  }, []);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startQuiz = () => {
    // Pick 10 random questions
    const selected = shuffleArray(QUIZ_QUESTIONS).slice(0, 10);
    setSessionQuestions(selected);
    setCurrentQuestionIdx(0);
    setCorrectAnswersCount(0);
    setIncorrectAnswers([]);
    setScreen('quiz');
  };

  useEffect(() => {
    if (screen === 'quiz' && sessionQuestions.length > 0) {
      setShuffledOptions(shuffleArray(sessionQuestions[currentQuestionIdx].options));
      setSelectedOption(null);
    }
  }, [currentQuestionIdx, sessionQuestions, screen]);

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(idx);
    const q = sessionQuestions[currentQuestionIdx];
    const isCorrect = shuffledOptions[idx] === q.options[q.correct];

    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => [
        ...prev,
        {
          question: q.text,
          userAnswer: shuffledOptions[idx],
          correctAnswer: q.options[q.correct]
        }
      ]);
    }

    setTimeout(() => {
      if (currentQuestionIdx < sessionQuestions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        finishQuiz();
      }
    }, 1200);
  };

  const finishQuiz = () => {
    const newEntry: QuizHistoryEntry = {
      date: new Date().toLocaleString('ru-RU'),
      session: currentSession,
      score: `${correctAnswersCount}/${sessionQuestions.length}`,
      incorrectAnswers: incorrectAnswers
    };
    
    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    
    const nextSession = currentSession + 1;
    setCurrentSession(nextSession);
    localStorage.setItem('quizSessionNum', nextSession.toString());
    
    setScreen('results');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('quizHistory');
    setCurrentSession(1);
    localStorage.setItem('quizSessionNum', '1');
  };

  const renderMenu = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-8 border border-blue-400/30">
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v20M2 12h20" />
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-white mb-4">Тестирование</h2>
      <p className="text-blue-100/60 mb-8 max-w-[280px]">
        Проверьте свои знания по эксплуатации УЭЦН и выводу скважин на режим.
      </p>
      <div className="text-sm text-blue-300 font-bold mb-10 uppercase tracking-widest">
        Текущая сессия: {currentSession}
      </div>
      
      <div className="w-full space-y-4">
        <button 
          onClick={startQuiz}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-bold text-lg active:scale-95 transition-all shadow-xl shadow-blue-900/20"
        >
          Начать тест
        </button>
        <button 
          onClick={() => setScreen('history')}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-blue-100 font-medium active:scale-95 transition-all"
        >
          История тестов
        </button>
        <button 
          onClick={onClose}
          className="w-full py-2 text-white/40 text-xs uppercase font-bold tracking-widest"
        >
          Вернуться к описанию
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const q = sessionQuestions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / sessionQuestions.length) * 100;

    return (
      <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
        {/* Header with progress */}
        <div className="p-6 border-b border-white/10 bg-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-tighter">Вопрос {currentQuestionIdx + 1} / {sessionQuestions.length}</span>
            <span className="text-white/40 text-xs">Сессия {currentSession}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 shadow-inner">
             <p className="text-white text-lg leading-snug font-medium">{q?.text}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 pb-8">
            {shuffledOptions.map((opt, i) => {
              const isSelected = selectedOption === i;
              const isCorrect = opt === q.options[q.correct];
              
              let btnClass = "w-full p-5 rounded-2xl text-left transition-all duration-200 border flex items-center gap-4 ";
              if (selectedOption === null) {
                btnClass += "bg-white/5 border-white/10 text-white/80 active:bg-blue-500/20 active:border-blue-400/40";
              } else if (isSelected) {
                btnClass += isCorrect ? "bg-green-500 border-green-400 text-white shadow-lg shadow-green-900/30 scale-[1.02]" : "bg-red-500 border-red-400 text-white shadow-lg shadow-red-900/30 scale-[0.98]";
              } else if (isCorrect) {
                btnClass += "bg-green-500/20 border-green-500/40 text-green-300";
              } else {
                btnClass += "bg-white/5 border-white/5 text-white/20 opacity-50";
              }

              return (
                <button key={i} onClick={() => handleOptionSelect(i)} className={btnClass} disabled={selectedOption !== null}>
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${isSelected ? 'border-white bg-white/20' : 'border-white/20'}`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="flex-1">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in zoom-in duration-300">
      <div className="relative w-40 h-40 mb-8">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="45" className="stroke-white/10 fill-none" strokeWidth="8" />
          <circle cx="50" cy="50" r="45" className="stroke-blue-500 fill-none" strokeWidth="8" strokeDasharray={`${(correctAnswersCount / 10) * 283} 283`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{correctAnswersCount * 10}%</span>
          <span className="text-[10px] text-blue-300 uppercase font-bold tracking-widest">Результат</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Сессия {currentSession - 1} завершена!</h2>
      <p className="text-blue-100/60 mb-10">Правильных ответов: {correctAnswersCount} из 10</p>

      <div className="w-full space-y-4">
        <button 
          onClick={startQuiz}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white font-bold active:scale-95 transition-all"
        >
          Пройти еще раз
        </button>
        <button 
          onClick={() => onExitToApp ? onExitToApp() : onClose()}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-blue-100 font-bold active:bg-white/10 active:scale-95 transition-all shadow-lg"
        >
          Главное меню
        </button>
        <button 
          onClick={() => setScreen('menu')}
          className="w-full py-3 text-white/30 text-xs uppercase font-medium tracking-widest"
        >
          Меню тестирования
        </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-white font-bold">История тестов</h3>
        <button onClick={() => setScreen('menu')} className="text-blue-400 font-bold text-sm">Назад</button>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/30 italic">
            История пуста
          </div>
        ) : (
          history.map((entry, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white font-bold">Сессия {entry.session}</span>
                <span className="text-blue-400 font-black">{entry.score}</span>
              </div>
              <div className="text-[10px] text-white/40 mb-4">{entry.date}</div>
              
              {entry.incorrectAnswers.length > 0 && (
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <span className="text-[10px] uppercase font-bold text-red-400/80">Ошибки:</span>
                  {entry.incorrectAnswers.map((err, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <p className="text-white/80 font-medium">Q: {err.question}</p>
                      <p className="text-red-400">Ваш: {err.userAnswer}</p>
                      <p className="text-green-400">Верно: {err.correctAnswer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-6">
        <button 
          onClick={clearHistory}
          className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold active:bg-red-500 active:text-white transition-all"
        >
          Очистить историю
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#081221] animate-in slide-in-from-bottom duration-300">
      {screen === 'menu' && renderMenu()}
      {screen === 'quiz' && renderQuiz()}
      {screen === 'results' && renderResults()}
      {screen === 'history' && renderHistory()}
    </div>
  );
};

export default QuizModule;
