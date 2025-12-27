
import React, { useState, useEffect, useMemo } from 'react';
import { AppSection, ModuleData } from './types';
import { MODULES } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});

  // Function to calculate progress from localStorage history
  const calculateProgress = () => {
    const savedHistory = localStorage.getItem('quizHistory');
    
    const latestProgress: Record<string, number> = {};
    
    // Default all modules to 0
    MODULES.forEach(m => latestProgress[m.id] = 0);

    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        // We iterate through history and pick the first entry found for each moduleId
        // because history is saved in descending order (latest first)
        MODULES.forEach(module => {
          const lastEntry = history.find((h: any) => h.moduleId === module.id);
          if (lastEntry && lastEntry.score) {
            // score format is "X/Y"
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

  // Update progress on mount and when localStorage changes
  useEffect(() => {
    calculateProgress();
    
    // Listen for custom events and storage events
    const handleStorageChange = () => calculateProgress();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Calculate overall course progress as the average of the last successful session of each module
  const totalCourseProgress = useMemo(() => {
    // We sum all the latest percentages (even if 0) and divide by the total number of modules
    const values = Object.values(moduleProgress);
    if (values.length === 0) return 0;
    
    // Ensure we account for all modules defined in constants
    const sum = MODULES.reduce((acc, module) => acc + (moduleProgress[module.id] || 0), 0);
    return Math.round(sum / MODULES.length);
  }, [moduleProgress]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col p-4 pb-24 gap-6">
            {/* Hero Image Section */}
            <div className="relative w-full h-56 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-[#0a1b3a]">
              <img 
                src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover brightness-[0.4]"
                alt="Техническая схема УЭЦН"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081221] via-transparent to-black/30"></div>
              
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-white font-bold text-2xl mb-1 drop-shadow-md">Схема установки УЭЦН</h2>
                <p className="text-blue-200/80 text-sm font-medium">Геологический разрез и ствол скважины</p>
              </div>
            </div>

            {/* Grid Menu */}
            <div className="grid grid-cols-2 gap-4">
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

            {/* Overall Course Progress Bar */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-blue-400 font-black mb-1">Общий прогресс курса</span>
                  <span className="text-white/90 font-bold text-lg">Успешное выполнение: {totalCourseProgress}%</span>
                </div>
                <div className="w-12 h-12 rounded-full border-2 border-blue-500/30 flex items-center justify-center text-[10px] font-black text-blue-400">
                   {totalCourseProgress}%
                </div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${totalCourseProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      case 'rating':
        return (
          <div className="flex flex-col p-6 items-center justify-center h-full text-white">
            <svg viewBox="0 0 24 24" className="w-24 h-24 mb-6 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 15l-2 5L9 9l11-1-5 2 5 11z" />
            </svg>
            <h2 className="text-2xl font-bold mb-2">Рейтинг участников</h2>
            <p className="text-blue-100/50 text-center max-w-[250px]">Пройдите первый тест, чтобы появиться в списке лидеров</p>
          </div>
        );
      case 'profile':
        return (
          <div className="flex flex-col p-6 text-white h-full">
            <div className="flex items-center gap-6 mb-8 mt-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/20 text-2xl font-bold shadow-lg">
                ТВ
              </div>
              <div>
                <h2 className="text-xl font-bold">Технолог Василий</h2>
                <p className="text-blue-100/50 text-sm">ID: 449210 • 4 разряд</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-white/80">Пройдено модулей</span>
                <span className="font-bold text-blue-400">
                  {Object.values(moduleProgress).filter(p => p > 0).length}/{MODULES.length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-white/80">Средний результат</span>
                <span className="font-bold text-orange-500">{totalCourseProgress}%</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-white/80">Баллы (XP)</span>
                <span className="font-bold text-yellow-500">{totalCourseProgress * 10}</span>
              </div>
            </div>
          </div>
        );
      case 'tasks':
         return (
          <div className="flex flex-col p-6 items-center justify-center h-full text-white">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
               <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Задания</h2>
            <p className="text-blue-100/50 text-center max-w-[280px]">Список практических кейсов будет доступен после завершения теории.</p>
          </div>
        );
    }
  };

  return (
    <div className="relative min-h-screen max-w-md mx-auto bg-gradient-to-b from-[#0a1b3a] to-[#081221] shadow-2xl flex flex-col overflow-hidden">
      
      {/* App Header */}
      <header className="flex items-center justify-between px-6 py-6 pt-10">
        <div className="flex flex-col">
          <h1 className="text-white text-lg font-bold leading-tight uppercase tracking-wider">Обучение: Технолог</h1>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-[#0c1e3a]/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-2 z-40">
        <NavButton 
          active={activeTab === 'home'} 
          onClick={() => setActiveTab('home')}
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-all duration-300 ${active ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )}
          label="Главная"
        />
        <NavButton 
          active={activeTab === 'tasks'} 
          onClick={() => setActiveTab('tasks')}
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-all duration-300 ${active ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          label="Задания"
        />
        <NavButton 
          active={activeTab === 'rating'} 
          onClick={() => setActiveTab('rating')}
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-all duration-300 ${active ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
            </svg>
          )}
          label="Рейтинг"
        />
        <NavButton 
          active={activeTab === 'profile'} 
          onClick={() => setActiveTab('profile')}
          icon={(active) => (
            <svg viewBox="0 0 24 24" className={`w-6 h-6 transition-all duration-300 ${active ? 'text-blue-400 scale-110 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-blue-100/30'}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          label="Профиль"
        />
      </nav>

      {/* Module Detail Overlay */}
      {selectedModule && (
        <ModuleDetail 
          module={selectedModule} 
          onClose={() => setSelectedModule(null)} 
        />
      )}
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: (active: boolean) => React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-1.5 transition-all duration-300 active:scale-90 px-4 py-2"
  >
    {icon(active)}
    <span className={`text-[10px] font-bold tracking-wide uppercase transition-colors duration-300 ${active ? 'text-blue-400' : 'text-blue-100/30'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]"></div>
    )}
  </button>
);

export default App;
