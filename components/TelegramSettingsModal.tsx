
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedContent from './AnimatedContent';

interface TelegramSchedule {
  enabled: boolean;
  days: number[]; // 0-6 (Sun-Sat)
  time: string; // HH:MM
}

interface TelegramSettingsModalProps {
  isDark: boolean;
  onClose: () => void;
  onSendNow: () => void;
  telegramStatus: 'idle' | 'sending' | 'success' | 'error';
  adminPassword?: string;
}

const DAYS = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Вс' },
];

const TelegramSettingsModal: React.FC<TelegramSettingsModalProps> = ({ 
  isDark, 
  onClose, 
  onSendNow, 
  telegramStatus,
  adminPassword 
}) => {
  const [schedule, setSchedule] = useState<TelegramSchedule>({
    enabled: false,
    days: [],
    time: '09:00'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          if (config.telegram_schedule) {
            setSchedule({
              enabled: config.telegram_schedule.enabled ?? false,
              days: Array.isArray(config.telegram_schedule.days) ? config.telegram_schedule.days : [],
              time: config.telegram_schedule.time ?? '09:00'
            });
          }
        }
      } catch (error) {
        console.error("Failed to load telegram schedule:", error);
      }
    };
    loadSchedule();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword || ''
        },
        body: JSON.stringify({ key: 'telegram_schedule', value: schedule })
      });
      if (response.ok) {
        alert('Настройки сохранены');
      } else {
        const err = await response.json();
        alert('Ошибка сохранения: ' + (err.error || 'Неизвестная ошибка'));
      }
    } catch (error: any) {
      alert('Ошибка сети: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSchedule(prev => {
      const currentDays = Array.isArray(prev.days) ? prev.days : [];
      return {
        ...prev,
        days: currentDays.includes(dayId) 
          ? currentDays.filter(d => d !== dayId)
          : [...currentDays, dayId]
      };
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`w-full max-w-md mx-auto mt-auto sm:my-auto rounded-[2.5rem] border overflow-hidden flex flex-col max-h-[90vh]
          ${isDark ? 'bg-[#0c1e3a] border-white/10' : 'bg-white border-slate-200 shadow-2xl'}`}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
              ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
              </svg>
            </div>
            <h2 className={`text-lg font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Отчет в Telegram
            </h2>
          </div>
          <button 
            onClick={onClose}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
              ${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Manual Send */}
          <section className="space-y-4">
            <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
              Мгновенная отправка
            </h3>
            <button 
              onClick={onSendNow}
              disabled={telegramStatus === 'sending'}
              className={`w-full p-4 rounded-2xl border flex justify-between items-center transition-all active:scale-[0.98]
                ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}
            >
              <span className="text-sm font-bold">
                {telegramStatus === 'sending' ? 'Отправка...' : 
                 telegramStatus === 'success' ? 'Отправлено!' : 
                 telegramStatus === 'error' ? 'Ошибка' : 'Отправить отчет сейчас'}
              </span>
              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </section>

          {/* Automatic Schedule */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                  Автоматическая отправка
                </h3>
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isDark ? 'text-indigo-400/60' : 'text-indigo-500/60'}`}>
                  Время Екатеринбурга (UTC+5)
                </span>
              </div>
              <button 
                onClick={() => setSchedule(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 outline-none
                  ${schedule.enabled ? (isDark ? 'bg-indigo-500' : 'bg-indigo-600') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
              >
                <div 
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                    ${schedule.enabled ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            <div className="space-y-6">
              {schedule.enabled && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Days of Week */}
                  <div className="space-y-3">
                    <p className={`text-xs font-bold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Выберите дни недели:</p>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map(day => (
                        <button
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase transition-all border
                            ${(Array.isArray(schedule.days) && schedule.days.includes(day.id))
                              ? (isDark ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-indigo-600 border-indigo-500 text-white')
                              : (isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400')}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Picker */}
                  <div className="space-y-3">
                    <p className={`text-xs font-bold ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Выберите время:</p>
                    <input 
                      type="time" 
                      value={schedule.time}
                      onChange={(e) => setSchedule(prev => ({ ...prev, time: e.target.value }))}
                      className={`w-full p-4 rounded-2xl border text-lg font-black outline-none transition-all
                        ${isDark 
                          ? 'bg-white/5 border-white/10 text-white focus:border-indigo-500/50' 
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500/50'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 mt-auto">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-[0.98] transition-all
              ${isDark 
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить расписание'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default TelegramSettingsModal;
