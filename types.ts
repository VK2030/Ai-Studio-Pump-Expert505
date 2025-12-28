
export type AppSection = 'home' | 'rating' | 'profile' | 'tasks';

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  progress?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface QuizQuestion {
  text: string;
  options: string[];
  correct: number[]; // Changed from number to number[]
}
