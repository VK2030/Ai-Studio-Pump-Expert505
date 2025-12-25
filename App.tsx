
import React, { useState } from 'react';
import { AppSection, ModuleData } from './types';
import { MODULES } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex flex-col p-4 pb-24 gap-6">
            {/* Hero Image Section */}
            <div className="relative w-full h-56 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover brightness-50"
                alt="Схема установки УЭЦН"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#081221] via-transparent to-transparent"></div>
              
              <div className="absolute bottom-6 left-6">
                <h2 className="text-white font-bold text-2xl mb-1">Схема установки УЭЦН</h2>
                <p className="text-blue-100/70 text-sm">Устройство и принцип работы комплекса</p>
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
                  onClick={() => setSelectedModule(m)}
                />
              ))}
            </div>

            {/* Progress Bar */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white/90 font-medium">Прогресс курса: 15%</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)]" 
                  style={{ width: '15%' }}
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
                <span className="font-bold text-blue-400">2/12</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-white/80">Баллы конкурса</span>
                <span className="font-bold text-orange-500">450 XP</span>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                <span className="text-white/80">Место в рейтинге</span>
                <span className="font-bold text-yellow-500">#42</span>
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
          <span className="text-[10px] uppercase tracking-[0.2em] text-blue-400/80 font-bold mb-0.5">Личный кабинет</span>
          <h1 className="text-white text-lg font-bold leading-tight">Проф. Технолог</h1>
        </div>
        <div className="flex gap-3">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-blue-100/60 hover:text-white active:scale-95 transition-all">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-blue-100/60 hover:text-white active:scale-95 transition-all">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
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
