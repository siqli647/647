export interface Option {
  label: string;
  content: string;
}

export enum QuestionType {
  SingleChoice = '单选题',
  MultipleChoice = '多选题',
  TrueFalse = '判断题',
  Unknown = '未知题型'
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  correctAnswer: string[]; // Array to handle multiple choice letters [A, B]
  explanation?: string; // Original static explanation if available
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatState {
  isOpen: boolean;
  questionId: string | null;
  history: ChatMessage[];
  isLoading: boolean;
}