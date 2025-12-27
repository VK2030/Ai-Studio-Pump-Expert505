
import React, { useState, useEffect, useRef } from 'react';

interface LoginOverlayProps {
  onAuthorized: () => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onAuthorized }) => {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // SHA-256 hash of "2026"
  const TARGET_HASH = "7862f928e08d132626e2794025d05051648a733734007908b8b981600115e4f8";

  const hashString = async (str: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(value);
    setIsError(false);

    if (value.length === 4) {
      const hash = await hashString(value);
      if (hash === TARGET_HASH) {
        onAuthorized();
      } else {
        setIsError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#081221]/40 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className={`w-full max-w-[280px] p-8 flex flex-col items-center transition-transform ${isError ? 'animate-bounce' : ''}`}>
        <div className="w-16 h-16 mb-8 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="text-white text-lg font-bold mb-2 uppercase tracking-widest">Вход в систему</h2>
        <p className="text-blue-100/40 text-[10px] font-medium mb-8 text-center leading-relaxed">Введите четырехзначный код доступа для продолжения работы</p>

        <div className="relative flex gap-3 mb-4">
          <input
            ref={inputRef}
            type="tel"
            pattern="[0-9]*"
            inputMode="numeric"
            value={pin}
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-default"
            autoFocus
          />
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300 
                ${pin.length > index ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10 bg-white/5'}
                ${isError ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}
              `}
            >
              {pin.length > index && (
                <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-200"></div>
              )}
            </div>
          ))}
        </div>
        
        {isError && (
          <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-4 animate-in fade-in duration-300">
            Неверный код доступа
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginOverlay;
