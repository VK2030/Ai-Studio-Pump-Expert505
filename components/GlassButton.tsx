
import React from 'react';

interface GlassButtonProps {
  title: string;
  subtitle: string;
  iconType: string;
  progress?: number;
  onClick: () => void;
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, subtitle, iconType, progress = 0, onClick }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'calc':
        return (
          <div className="relative w-16 h-16 mb-4">
             <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
             <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4M12 16h.01" />
             </svg>
          </div>
        );
      case 'pump':
        return (
          <div className="relative w-16 h-16 mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM21 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM10 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM4 14v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M12 6v12" />
            </svg>
          </div>
        );
      case 'search':
        return (
          <div className="relative w-16 h-16 mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        );
      case 'corrosion':
        return (
          <div className="relative w-16 h-16 mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-red-400" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 18h12M6 6h12M6 12h12M6 6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3M18 6a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <button 
      onClick={onClick}
      className="group relative flex flex-col items-start p-5 pb-12 rounded-3xl border border-white/10 overflow-hidden transition-all duration-300
                 bg-white/5 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
                 active:scale-[0.98] active:bg-white/15 active:border-white/25 h-full"
    >
      {/* 3D Highlight Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none group-active:from-white/10"></div>
      
      {renderIcon()}
      
      <div className="text-left flex-1 mb-4">
        <h3 className="text-base font-bold text-white leading-tight group-active:text-blue-100">{title}</h3>
        {/* Subtitle removed as requested */}
      </div>
      
      {/* Progress Bar Container */}
      <div className="absolute bottom-4 left-5 right-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] uppercase font-bold text-blue-400/80 tracking-widest">Прогресс</span>
          <span className="text-xs font-bold text-white/80">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.3)] transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </button>
  );
};

export default GlassButton;
