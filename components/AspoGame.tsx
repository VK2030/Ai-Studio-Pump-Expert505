import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ASPO_DATA = [
  { asfalten: 2, smoli: 2, parafin: 3, temp: 60, ansGroup: "СА", ansAspo: "АСПО1", ansType: "Тип1" },
  { asfalten: 1, smoli: 4, parafin: 4, temp: 80, ansGroup: "СА", ansAspo: "АСПО1", ansType: "Тип2" },
  { asfalten: 2.5, smoli: 3, parafin: 4.5, temp: 110, ansGroup: "СА", ansAspo: "АСПО1", ansType: "Тип3" },
  { asfalten: 2, smoli: 5, parafin: 3, temp: 111, ansGroup: "СА", ansAspo: "АСПО1", ansType: "Тип4" },
  { asfalten: 1, smoli: 6, parafin: 5, temp: 59, ansGroup: "СА", ansAspo: "АСПО2", ansType: "Тип1" },
  { asfalten: 2, smoli: 5, parafin: 6, temp: 79, ansGroup: "СА", ansAspo: "АСПО2", ansType: "Тип2" },
  { asfalten: 1.5, smoli: 7, parafin: 5, temp: 111, ansGroup: "СА", ansAspo: "АСПО2", ansType: "Тип4" },
  { asfalten: 2.5, smoli: 6, parafin: 4, temp: 115, ansGroup: "СА", ansAspo: "АСПО2", ansType: "Тип4" },
  { asfalten: 3, smoli: 10, parafin: 8, temp: 58, ansGroup: "СА", ansAspo: "АСПО3", ansType: "Тип1" },
  { asfalten: 2, smoli: 11, parafin: 9, temp: 78, ansGroup: "СА", ansAspo: "АСПО3", ansType: "Тип2" },
  { asfalten: 3.5, smoli: 10.5, parafin: 8.5, temp: 109, ansGroup: "СА", ansAspo: "АСПО3", ansType: "Тип3" },
  { asfalten: 2.5, smoli: 9.5, parafin: 9.5, temp: 120, ansGroup: "СА", ansAspo: "АСПО3", ansType: "Тип4" },
  { asfalten: 1, smoli: 1, parafin: 8, temp: 57, ansGroup: "П", ansAspo: "АСПО1", ansType: "Тип1" },
  { asfalten: 1.5, smoli: 0.5, parafin: 7.5, temp: 77, ansGroup: "П", ansAspo: "АСПО1", ansType: "Тип2" },
  { asfalten: 0.5, smoli: 1.5, parafin: 8, temp: 108, ansGroup: "П", ansAspo: "АСПО1", ansType: "Тип3" },
  { asfalten: 1.5, smoli: 1, parafin: 7.5, temp: 115, ansGroup: "П", ansAspo: "АСПО1", ansType: "Тип4" },
  { asfalten: 2, smoli: 2, parafin: 12, temp: 56, ansGroup: "П", ansAspo: "АСПО2", ansType: "Тип1" },
  { asfalten: 1, smoli: 3, parafin: 13, temp: 76, ansGroup: "П", ansAspo: "АСПО2", ansType: "Тип2" },
  { asfalten: 2.5, smoli: 1.5, parafin: 12.5, temp: 107, ansGroup: "П", ansAspo: "АСПО2", ansType: "Тип3" },
  { asfalten: 1.5, smoli: 2.5, parafin: 13.5, temp: 120, ansGroup: "П", ansAspo: "АСПО2", ansType: "Тип4" },
  { asfalten: 2, smoli: 3, parafin: 22, temp: 55, ansGroup: "П", ansAspo: "АСПО3", ansType: "Тип1" },
  { asfalten: 1, smoli: 4, parafin: 23, temp: 106, ansGroup: "П", ansAspo: "АСПО3", ansType: "Тип3" },
  { asfalten: 2.5, smoli: 3.5, parafin: 22.5, temp: 105, ansGroup: "П", ansAspo: "АСПО3", ansType: "Тип3" },
  { asfalten: 1.5, smoli: 2.5, parafin: 23.5, temp: 120, ansGroup: "П", ansAspo: "АСПО3", ansType: "Тип4" },
  { asfalten: 3, smoli: 4, parafin: 35, temp: 104, ansGroup: "П", ansAspo: "АСПО4", ansType: "Тип3" },
  { asfalten: 1, smoli: 3.5, parafin: 4.5, temp: 54, ansGroup: "С", ansAspo: "АСПО1", ansType: "Тип1" },
  { asfalten: 1.5, smoli: 2.5, parafin: 4, temp: 74, ansGroup: "С", ansAspo: "АСПО1", ansType: "Тип2" },
  { asfalten: 2, smoli: 3, parafin: 4.5, temp: 103, ansGroup: "С", ansAspo: "АСПО1", ansType: "Тип3" },
  { asfalten: 1, smoli: 2, parafin: 3, temp: 120, ansGroup: "С", ansAspo: "АСПО1", ansType: "Тип4" },
  { asfalten: 3, smoli: 4, parafin: 7, temp: 53, ansGroup: "С", ansAspo: "АСПО2", ansType: "Тип1" },
  { asfalten: 2, smoli: 3.5, parafin: 6, temp: 73, ansGroup: "С", ansAspo: "АСПО2", ansType: "Тип2" },
  { asfalten: 3, smoli: 3, parafin: 6.5, temp: 102, ansGroup: "С", ansAspo: "АСПО2", ansType: "Тип3" },
  { asfalten: 2, smoli: 4, parafin: 6, temp: 120, ansGroup: "С", ansAspo: "АСПО2", ansType: "Тип4" },
  { asfalten: 5, smoli: 6, parafin: 11, temp: 52, ansGroup: "С", ansAspo: "АСПО3", ansType: "Тип1" },
  { asfalten: 4, smoli: 7, parafin: 10.5, temp: 72, ansGroup: "С", ansAspo: "АСПО3", ansType: "Тип2" },
  { asfalten: 5.5, smoli: 6.5, parafin: 11.5, temp: 101, ansGroup: "С", ansAspo: "АСПО3", ansType: "Тип3" },
  { asfalten: 5, smoli: 10, parafin: 15, temp: 111, ansGroup: "С", ansAspo: "АСПО3", ansType: "Тип4" }
];

interface AspoGameProps {
  onClose: () => void;
  isDark?: boolean;
}

const AspoGame: React.FC<AspoGameProps> = ({ onClose, isDark = true }) => {
  const [gameState, setGameState] = useState<'playing' | 'result'>('playing');
  const [taskIndex, setTaskIndex] = useState(0);
  
  const [selectedGroup, setSelectedGroup] = useState('СА');
  const [selectedAspo, setSelectedAspo] = useState('АСПО1');
  const [selectedType, setSelectedType] = useState('Тип1');
  
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    setTaskIndex(Math.floor(Math.random() * ASPO_DATA.length));
  }, []);

  const currentTask = ASPO_DATA[taskIndex];

  const handleSubmit = () => {
    const correct = 
      selectedGroup === currentTask.ansGroup && 
      selectedAspo === currentTask.ansAspo && 
      selectedType === currentTask.ansType;
      
    setIsCorrect(correct);
    setGameState('result');
  };

  const handleRestart = () => {
    setTaskIndex(Math.floor(Math.random() * ASPO_DATA.length));
    setSelectedGroup('СА');
    setSelectedAspo('АСПО1');
    setSelectedType('Тип1');
    setIsCorrect(null);
    setGameState('playing');
  };

  return (
    <div className={`fixed inset-0 z-[70] flex flex-col justify-between items-center overflow-hidden
      ${isDark ? 'bg-[#0B1120]' : 'bg-slate-50'}`}
    >
      <div className={`w-full px-6 py-4 flex justify-between items-center z-10 
        ${isDark ? 'bg-[#0f172a]/90' : 'bg-white/90'} backdrop-blur-md border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-500 font-bold text-sm">A</span>
          </div>
          <div>
            <h1 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Код АСПО
            </h1>
            <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              Интерактивное упражнение
            </p>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors
            ${isDark ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:text-black hover:bg-slate-300'}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
        {gameState === 'playing' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-8"
          >
            <div className={`w-full rounded-2xl overflow-hidden shadow-xl border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <th className="p-4 text-xs font-bold leading-tight">Содержание асфальтенов, %</th>
                      <th className="p-4 text-xs font-bold leading-tight border-l border-slate-700/50">Содержание смол, %</th>
                      <th className="p-4 text-xs font-bold leading-tight border-l border-slate-700/50">Содержание парафинов, %</th>
                      <th className="p-4 text-xs font-bold leading-tight border-l border-slate-700/50">Температура пласта, °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={`border-b last:border-0 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <td className={`p-6 font-mono text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{currentTask?.asfalten}</td>
                      <td className={`p-6 font-mono text-xl font-bold border-l ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>{currentTask?.smoli}</td>
                      <td className={`p-6 font-mono text-xl font-bold border-l ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>{currentTask?.parafin}</td>
                      <td className={`p-6 font-mono text-xl font-bold border-l ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-900'}`}>{currentTask?.temp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4 w-full mt-4">
              <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}
              >
                <option value="СА">СА</option>
                <option value="П">П</option>
                <option value="С">С</option>
              </select>
              <span className={`text-2xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>-</span>
              <select 
                value={selectedAspo} 
                onChange={(e) => setSelectedAspo(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}
              >
                <option value="АСПО1">АСПО1</option>
                <option value="АСПО2">АСПО2</option>
                <option value="АСПО3">АСПО3</option>
                <option value="АСПО4">АСПО4</option>
              </select>
              <span className={`text-2xl font-bold ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>-</span>
              <select 
                value={selectedType} 
                onChange={(e) => setSelectedType(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}
              >
                <option value="Тип1">Тип1</option>
                <option value="Тип2">Тип2</option>
                <option value="Тип3">Тип3</option>
                <option value="Тип4">Тип4</option>
              </select>
            </div>

            <button 
              onClick={handleSubmit}
              className="mt-8 px-12 py-4 rounded-xl font-black uppercase tracking-widest text-white shadow-xl hover:-translate-y-0.5 active:scale-[0.98] transition-all bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25"
            >
              Принять ответ
            </button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
          >
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6
              ${isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {isCorrect ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </>
                )}
              </svg>
            </div>
            
            <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {isCorrect ? 'Верно!' : 'Ошибка'}
            </h2>
            
            {!isCorrect && (
              <p className={`text-sm mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                Правильный ответ: <br/>
                <span className="font-bold text-lg mt-2 inline-block">
                  {currentTask?.ansGroup} - {currentTask?.ansAspo} - {currentTask?.ansType}
                </span>
              </p>
            )}

            <button 
              onClick={handleRestart}
              className={`w-full py-4 rounded-xl font-bold transition-transform active:scale-[0.98] mt-4
                ${isDark ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            >
              Завершить сессию
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AspoGame;
