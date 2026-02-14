
import React from 'react';
import { ModuleData } from '../types';
import QuizModule from './QuizModule';

interface ModuleDetailProps {
  module: ModuleData;
  theme?: 'dark' | 'light';
  isTimerEnabled: boolean;
  isHighlightEnabled: boolean;
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, theme = 'dark', isTimerEnabled, isHighlightEnabled, onClose }) => {
  return (
    <QuizModule 
      moduleId={module.id} 
      theme={theme} 
      isTimerEnabled={isTimerEnabled}
      isHighlightEnabled={isHighlightEnabled}
      onClose={onClose} 
      onExitToApp={onClose} 
    />
  );
};

export default ModuleDetail;
