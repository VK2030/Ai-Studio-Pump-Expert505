
import React, { useState, useEffect, useRef } from 'react';

interface LoginOverlayProps {
  onAuthorized: () => void;
  theme?: 'dark' | 'light';
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onAuthorized, theme = 'dark' }) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const checkPin = (value: string) => {
    const num = parseInt(value, 10);
    return (num + 123) * 2 === 4298;
  };

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();
    window.addEventListener('click', focusInput);
    return () => window.removeEventListener('click', focusInput);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(value);
    setIsError(false);
    if (value.length === 4) {
      if (checkPin(value)) onAuthorized();
      else {
        setIsError(true);
        setTimeout(() => { setPin(''); setIsError(false); }, 600);
      }
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-xl animate-in fade-in duration-500
      ${isDark ? 'bg-[#081221]/20' : 'bg-white/40'}`}>
      <div className={`w-full max-w-[280px] p-8 flex flex-col items-center transition-transform duration-300 ${isError ? 'animate-shake' : ''}`} onClick={() => inputRef.current?.focus()}>
        <style>{` @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } } .animate-shake { animation: shake 0.4s ease-in-out; } `}</style>
        
        <div className={`w-16 h-16 mb-8 rounded-2xl flex items-center justify-center border shadow-[0_0_30px_rgba(59,130,246,0.2)]
          ${isDark ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-50 border-blue-100 shadow-blue-100'}`}>
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </div>

        <h2 className={`text-lg font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Вход в систему</h2>
        <p className={`text-[10px] font-medium mb-8 text-center leading-relaxed ${isDark ? 'text-blue-100/40' : 'text-slate-400'}`}>Введите четырехзначный код доступа для продолжения работы</p>

        <div className="relative flex gap-3 mb-4">
          <input ref={inputRef} type="tel" pattern="[0-9]*" inputMode="numeric" value={pin} onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-default" autoFocus />
          {[0, 1, 2, 3].map((index) => (
            <div key={index} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300 
                ${pin.length > index ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : (isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50')}
                ${isError ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}>
              {pin.length > index && <div className={`w-2 h-2 rounded-full animate-in zoom-in duration-200 ${isDark ? 'bg-white' : 'bg-blue-600'}`}></div>}
            </div>
          ))}
        </div>
        {isError ? <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-4 animate-in fade-in duration-300">Неверный код доступа</p> : <p className={`text-[9px] mt-4 font-mono ${isDark ? 'text-white/10' : 'text-slate-200'}`}>****</p>}
      </div>
    </div>
  );
};

export default LoginOverlay;
