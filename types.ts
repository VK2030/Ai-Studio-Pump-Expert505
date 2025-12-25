
export type AppSection = 'home' | 'rating' | 'profile' | 'tasks';

export interface ModuleData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}
