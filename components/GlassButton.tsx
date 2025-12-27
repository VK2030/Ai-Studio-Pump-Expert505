
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
    const iconWrapperClass = "relative w-16 h-16 mb-4 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110";
    
    switch (iconType) {
      case 'calc':
        return (
          <div className={iconWrapperClass}>
             <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse group-hover:bg-blue-400/40 transition-colors"></div>
             <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.5)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4M12 16h.01" />
             </svg>
          </div>
        );
      case 'pump':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-blue-300/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM21 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM10 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM4 14v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M12 6v12" />
            </svg>
          </div>
        );
      case 'search':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-blue-400/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        );
      case 'corrosion':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-red-400/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.3)]" fill="none" stroke="currentColor" strokeWidth="1.5">
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
      className="group relative flex flex-col items-start p-5 pb-12 rounded-[2rem] border border-white/10 overflow-hidden transition-all duration-500
                 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]
                 hover:scale-[1.04] hover:bg-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]
                 active:scale-[0.96] active:bg-white/15 active:border-white/30 h-full"
    >
      {/* 3D Dynamic Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none transition-opacity duration-500 opacity-50 group-hover:opacity-100"></div>
      
      {/* Background Animated Glow */}
      <div className="absolute -inset-24 bg-blue-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
      
      {renderIcon()}
      
      <div className="text-left flex-1 mb-4 relative z-10">
        <h3 className="text-[15px] font-bold text-white/90 leading-tight transition-colors duration-300 group-hover:text-white group-active:text-blue-100">
          {title}
        </h3>
      </div>
      
      {/* Progress Bar Container */}
      <div className="absolute bottom-4 left-5 right-5 z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[9px] uppercase font-black text-blue-400/60 tracking-[0.2em] transition-colors group-hover:text-blue-400">Прогресс</span>
          <span className="text-[10px] font-black text-white/40 group-hover:text-white/80 transition-colors">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-400 rounded-full shadow-[0_0_12px_rgba(96,165,250,0.5)] transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </button>
  );
};

export default GlassButton;
