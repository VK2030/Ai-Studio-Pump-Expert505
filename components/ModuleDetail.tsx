
import React from 'react';
import { ModuleData } from '../types';
import QuizModule from './QuizModule';

interface ModuleDetailProps {
  module: ModuleData;
  theme?: 'dark' | 'light';
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, theme = 'dark', onClose }) => {
  return <QuizModule moduleId={module.id} theme={theme} onClose={onClose} onExitToApp={onClose} />;
};

export default ModuleDetail;
