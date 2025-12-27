
import React from 'react';
import { ModuleData } from '../types';
import QuizModule from './QuizModule';

interface ModuleDetailProps {
  module: ModuleData;
  onClose: () => void;
}

const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onClose }) => {
  // Все модули теперь ведут себя одинаково: сразу открывают меню тестирования
  return <QuizModule moduleId={module.id} onClose={onClose} onExitToApp={onClose} />;
};

export default ModuleDetail;
