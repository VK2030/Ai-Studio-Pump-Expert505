
import React from 'react';
import { ModuleData } from '../types';
import QuizModule from './QuizModule';

interface ModuleDetailProps {
  module: ModuleData;
  theme?: 'dark' | 'light';
  userRole?: 'contestant' | 'admin' | null;
  isTimerEnabled: boolean;
  isHighlightEnabled: boolean;
  isHistoryAnswersEnabled: boolean;
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ 
  module, 
  theme = 'dark', 
  userRole,
  isTimerEnabled, 
  isHighlightEnabled, 
  isHistoryAnswersEnabled,
  onClose 
}) => {
  return (
    <QuizModule 
      moduleId={module.id} 
      theme={theme} 
      userRole={userRole}
      isTimerEnabled={isTimerEnabled}
      isHighlightEnabled={isHighlightEnabled}
      isHistoryAnswersEnabled={isHistoryAnswersEnabled}
      onClose={onClose} 
      onExitToApp={onClose} 
    />
  );
};

export default ModuleDetail;
