
import React from 'react';

interface GlassButtonProps {
  title: string;
  subtitle: string;
  iconType: string;
  progress?: number;
  onClick: () => void;
  theme?: 'dark' | 'light';
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, subtitle, iconType, progress = 0, onClick, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const renderIcon = () => {
    const iconWrapperClass = "relative w-12 h-12 mb-3 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105";
    
    switch (iconType) {
      case 'calc':
        return (
          <div className={iconWrapperClass}>
             <div className="absolute inset-0 bg-slate-400/10 rounded-full blur-xl group-hover:bg-slate-400/20"></div>
             <svg viewBox="0 0 24 24" className="w-full h-full text-slate-600 drop-shadow-[0_0_8px_rgba(71,85,105,0.2)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Ноутбук */}
                <rect x="3" y="5" width="18" height="11" rx="1" />
                <path d="M2 18h20" />
                
                {/* Импеллер (крыльчатка насоса) */}
                <circle cx="8" cy="10.5" r="2.2" />
                <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                <path d="M6.5 9l3 3M9.5 9l-3 3" />
                
                {/* Графики и стрелка */}
                <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                <path d="M12.5 10l3.5-3.5 3 2" />
                
                {/* Текстовые линии-заглушки */}
                <path d="M6 14h3" opacity="0.5" />
             </svg>
          </div>
        );
      case 'pump':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-slate-300/10 rounded-full blur-lg"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM21 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM10 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM4 14v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M12 6v12" />
            </svg>
          </div>
        );
      case 'search':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-slate-400/10 rounded-full blur-lg"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        );
      case 'corrosion':
        return (
          <div className={iconWrapperClass}>
            <div className="absolute inset-0 bg-slate-400/10 rounded-full blur-lg"></div>
            <svg viewBox="0 0 24 24" className="w-full h-full text-slate-700 drop-shadow-[0_0_8px_rgba(51,65,85,0.2)]" fill="none" stroke="currentColor" strokeWidth="1.8">
              {/* Предупреждающий треугольник с восклицательным знаком */}
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round" />
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
      className={`flex flex-col items-start p-4 pb-10 rounded-3xl border backdrop-blur-md relative overflow-hidden group w-full h-full transition-all duration-300 active:scale-95
        ${isDark 
          ? 'bg-white/5 border-white/10 hover:bg-white/[0.08]' 
          : 'bg-white border-slate-200 shadow-sm hover:bg-slate-50'}`}
    >
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none
        ${isDark ? 'bg-gradient-to-br from-white/5 to-transparent' : 'bg-gradient-to-br from-slate-50/10 to-transparent'}`}></div>
      
      {renderIcon()}
      
      <div className="text-left flex-1 relative z-10 w-full">
        <h3 className={`text-[13px] font-bold leading-tight transition-colors line-clamp-2
          ${isDark ? 'text-white/90' : 'text-slate-900'}`}>
          {title}
        </h3>
        <p className={`text-[9px] mt-1 leading-tight line-clamp-2 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
          {subtitle}
        </p>
      </div>
      
      <div className="absolute bottom-3 left-4 right-4 z-10">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] uppercase font-black text-slate-500/60 tracking-wider">Прогресс</span>
          <span className={`text-[9px] font-black ${isDark ? 'text-white/40' : 'text-slate-400'}`}>{progress}%</span>
        </div>
        <div className={`w-full h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          <div 
            className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full shadow-[0_0_8px_rgba(71,85,105,0.2)] transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </button>
  );
};

export default GlassButton;
