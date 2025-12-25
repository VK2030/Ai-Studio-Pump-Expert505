
import React, { useState, useEffect } from 'react';
import { ModuleData } from '../types';
import { getEducationalResponse } from '../services/geminiService';
import QuizModule from './QuizModule';

interface ModuleDetailProps {
  module: ModuleData;
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onClose }) => {
  // Bypass description page for "Вывод скважины на режим"
  if (module.id === 'well-startup') {
    return <QuizModule onClose={onClose} onExitToApp={onClose} />;
  }

  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(module.description);
  const [question, setQuestion] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [isAiResponse, setIsAiResponse] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const res = await getEducationalResponse(module.title, question);
    setExplanation(res || '');
    setQuestion('');
    setLoading(false);
    setIsAiResponse(true);
  };

  if (showQuiz) {
    return <QuizModule onClose={() => setShowQuiz(false)} onExitToApp={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#081221] animate-in fade-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between p-6 bg-blue-900/20 border-b border-white/10">
        <button onClick={onClose} className="text-white">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-white">{module.title}</h2>
        <div className="w-8"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-blue-100/90 italic">
          {module.subtitle}
        </div>

        <section className="p-6 rounded-2xl bg-blue-900/10 border border-blue-500/20 min-h-[200px]">
          <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isAiResponse ? 'bg-blue-400 animate-pulse' : 'bg-white/30'}`}></span>
            {isAiResponse ? 'Ответ эксперта:' : 'Описание модуля:'}
          </h3>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-blue-100/50 text-sm">Эксперт готовит ответ...</p>
            </div>
          ) : (
            <div className="text-white leading-relaxed whitespace-pre-wrap text-sm">
              {explanation}
            </div>
          )}
        </section>

        <div className="relative">
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Задайте вопрос эксперту..."
            className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-4 text-white placeholder-blue-100/30 focus:outline-none focus:border-blue-400"
          />
          <button 
            onClick={handleAsk}
            disabled={loading}
            className="absolute right-2 top-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </main>

      <div className="p-6">
        <button 
          onClick={() => setShowQuiz(true)}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl text-white font-bold text-lg active:scale-95 transition-transform"
        >
          Начать тест по теме
        </button>
      </div>
    </div>
  );
};

export default ModuleDetail;
