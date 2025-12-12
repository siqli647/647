
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
  const isCorrect = (label: string) => question.correctAnswer.includes(label);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all hover:shadow-lg relative">
      <button
        onClick={() => onToggleBookmark(question.id)}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
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

      <div className="flex items-center gap-2 mb-4 pr-10">
        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded">
          {question.type}
        </span>
        <span className="text-gray-400 text-xs">ID: {question.id}</span>
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-4 leading-relaxed">
        {question.text}
      </h3>

      <div className="space-y-3">
        {question.options.map((option) => {
          const correct = isCorrect(option.label);
          return (
            <div
              key={option.label}
              className={`p-3 rounded-md border text-sm flex items-start gap-3 ${
                correct
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-gray-50 border-gray-100 text-gray-600'
              }`}
            >
              <span
                className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                  correct ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {option.label}
              </span>
              <span>{option.content}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t pt-4 border-gray-100">
        <div className="text-sm">
            <span className="font-semibold text-gray-700">Correct Answer: </span>
            <span className="font-bold text-green-600">{question.correctAnswer.join(', ')}</span>
        </div>
        <button
          onClick={() => onExplain(question)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Why is this correct?
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
