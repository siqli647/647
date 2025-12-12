
import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  onExplain: (question: Question) => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  onExplain,
  isBookmarked,
  onToggleBookmark
}) => {
  // Filter options to ONLY include correct ones
  const correctOptions = question.options.filter(option => 
    question.correctAnswer.includes(option.label)
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50 transition-all relative min-h-[300px] flex flex-col">
      <button
        onClick={() => onToggleBookmark(question.id)}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none z-10"
        title={isBookmarked ? "Remove from favorites" : "Add to favorites"}
      >
        <svg 
          className={`w-6 h-6 ${isBookmarked ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wide rounded-full">
          {question.type}
        </span>
        <span className="text-gray-400 text-xs font-mono">#{question.id.replace('q-', '')}</span>
      </div>
      
      <h3 className="text-xl font-medium text-gray-900 mb-6 leading-relaxed flex-1">
        {question.text}
      </h3>

      <div className="space-y-3 mb-6">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Correct Answer</div>
        {correctOptions.map((option) => (
          <div
            key={option.label}
            className="p-4 rounded-lg border border-green-200 bg-green-50 text-green-900 flex items-start gap-3 shadow-sm"
          >
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold bg-green-200 text-green-800">
              {option.label}
            </span>
            <span className="font-medium text-base">{option.content}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onExplain(question)}
          className="w-full flex items-center justify-center px-4 py-3 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Why is this correct? (Ask AI)
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
