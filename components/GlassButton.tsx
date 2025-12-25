
import React from 'react';

interface GlassButtonProps {
  title: string;
  subtitle: string;
  iconType: string;
  onClick: () => void;
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, subtitle, iconType, onClick }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'calc':
        return (
          <div className="relative w-20 h-20 mb-4">
             <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
             <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M12 8v4M12 16h.01" />
             </svg>
          </div>
        );
      case 'pump':
        return (
          <div className="relative w-20 h-20 mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-200" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM21 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM10 11a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1zM4 14v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1M4 11V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v2M12 6v12" />
            </svg>
          </div>
        );
      case 'search':
        return (
          <div className="relative w-20 h-20 mb-4">
            <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        );
      case 'corrosion':
        return (
          <div className="relative w-20 h-20 mb-4">
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
      className="group relative flex flex-col items-start p-5 rounded-3xl border border-white/10 overflow-hidden transition-all duration-300
                 bg-white/5 backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
                 active:scale-[0.98] active:bg-white/20 active:border-white/30"
    >
      {/* 3D Highlight Shine Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none group-active:from-white/20"></div>
      
      {renderIcon()}
      
      <div className="text-left">
        <h3 className="text-lg font-bold text-white mb-1 group-active:text-blue-100">{title}</h3>
        <p className="text-xs text-blue-100/60 leading-tight">{subtitle}</p>
      </div>
      
      {/* Decorative arrow */}
      <div className="absolute bottom-4 right-4 text-white/30 group-active:text-white/60">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </button>
  );
};

export default GlassButton;
