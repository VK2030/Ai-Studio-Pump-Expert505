
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, ModuleData } from './types';
import { MODULES } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';
import LoginOverlay from './components/LoginOverlay';

const App: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem('app_authorized') === 'true';
  });
  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  const calculateProgress = () => {
    const savedHistory = localStorage.getItem('quizHistory');
    const latestProgress: Record<string, number> = {};
    MODULES.forEach(m => latestProgress[m.id] = 0);

    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        MODULES.forEach(module => {
          const lastEntry = history.find((h: any) => h.moduleId === module.id);
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
    }
    setModuleProgress(latestProgress);
  };

  useEffect(() => {
    if (isAuthorized) {
      calculateProgress();
      const handleStorageChange = () => calculateProgress();
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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex-1 flex flex-col px-4 pb-2 gap-3 justify-between overflow-hidden">
            <div className="grid grid-cols-2 gap-3 flex-[3] min-h-0">
              {MODULES.map((m) => (
                <GlassButton 
                  key={m.id}
                  title={m.title}
                  subtitle={m.subtitle}
                  iconType={m.icon}
                  progress={moduleProgress[m.id] || 0}
                  onClick={() => setSelectedModule(m)}
                />
              ))}
            </div>

            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group mb-2 flex-shrink-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-blue-400 font-black">Общий прогресс</span>
                  <span className="text-white/90 font-bold text-sm">Выполнено: {totalCourseProgress}%</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center text-[9px] font-black text-blue-400">
                   {totalCourseProgress}%
                </div>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all duration-1000" 
                  style={{ width: `${totalCourseProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      case 'rating':
        return (
          <div className="flex flex-col p-6 items-center justify-center h-full text-white">
            <svg viewBox="0 0 24 24" className="w-20 h-20 mb-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 15l-2 5L9 9l11-1-5 2 5 11z" />
            </svg>
            <h2 className="text-xl font-bold mb-1">Рейтинг</h2>
            <p className="text-blue-100/50 text-center text-sm">Скоро здесь появятся лидеры</p>
          </div>
        );
      case 'profile':
        return (
          <div className="flex flex-col p-6 text-white h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20 text-xl font-bold">
                ТВ
              </div>
              <div>
                <h2 className="text-lg font-bold">В. Технолог</h2>
                <p className="text-blue-100/50 text-xs">ID: 449210</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-sm text-white/80">Модули</span>
                {/* Fix: Operator '>' cannot be applied to types 'unknown' and 'number'. Cast to number. */}
                <span className="font-bold text-blue-400">{Object.values(moduleProgress).filter((p: unknown) => (p as number) > 0).length}/{MODULES.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-sm text-white/80">Результат</span>
                <span className="font-bold text-orange-500">{totalCourseProgress}%</span>
              </div>
            </div>
          </div>
        );
      case 'tasks':
         return (
          <div className="flex flex-col p-6 items-center justify-center h-full text-white">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
               <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <h2 className="text-xl font-bold mb-1">Задания</h2>
            <p className="text-blue-100/50 text-center text-sm">Будут доступны позже</p>
          </div>
        );
    }
  };

  return (
    <div className="relative h-screen max-w-md mx-auto bg-gradient-to-b from-[#0a1b3a] to-[#081221] shadow-2xl flex flex-col overflow-hidden">
      
      <header className="px-6 py-4 pt-10 flex-shrink-0">
        <div className="flex flex-col">
          <span className="text-blue-400 text-[9px] font-black uppercase tracking-[0.3em]">Обучение</span>
          <h1 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Лучший технолог</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>

      <nav className="h-20 bg-[#0c1e3a]/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-40 flex-shrink-0">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} label="Главная" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? 'text-blue-400' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )} 
        />
        <NavButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Задания" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? 'text-blue-400' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )} 
        />
        <NavButton active={activeTab === 'rating'} onClick={() => setActiveTab('rating')} label="Рейтинг" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? 'text-blue-400' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138" />
            </svg>
          )} 
        />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Профиль" 
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? 'text-blue-400' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )} 
        />
      </nav>

      {selectedModule && (
        <ModuleDetail module={selectedModule} onClose={() => { setSelectedModule(null); calculateProgress(); }} />
      )}

      {!isAuthorized && <LoginOverlay onAuthorized={handleAuthorize} />}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: (active: boolean) => React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all active:scale-95">
    {icon(active)}
    <span className={`text-[9px] font-bold tracking-wide uppercase ${active ? 'text-blue-400' : 'text-blue-100/30'}`}>{label}</span>
  </button>
);

export default App;
