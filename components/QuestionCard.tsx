
import React, { useState } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper to resolve answer text from options if possible
  const answerTexts = question.correctAnswer.map((ans) => {
    const matchedOption = question.options.find(opt => opt.label === ans);
    // If we find a matching option (e.g., "A"), display "A. Option Content"
    // Otherwise just display the answer string (e.g., "正确" for True/False)
    return matchedOption ? `${ans}. ${matchedOption.content}` : ans;
  });

  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
            <span className="bg-slate-100 text-slate-500 text-xs font-mono py-1 px-2 rounded">
                #{index + 1}
            </span>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide rounded-full border border-indigo-100">
            {question.type}
            </span>
        </div>
      </div>
      
      {/* Question Text */}
      <h3 className="text-lg font-medium text-slate-900 mb-4 leading-relaxed">
        {question.text}
      </h3>

      {/* Correct Answer Display (Always Visible) */}
      <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md">
        <span className="text-xs font-bold text-green-700 uppercase tracking-wider block mb-1">
            Correct Answer
        </span>
        <div className="text-green-900 font-semibold text-lg">
            {answerTexts.map((text, i) => (
                <div key={i} className="mb-1 last:mb-0">
                    {text}
                </div>
            ))}
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 focus:outline-none mb-2"
      >
        {isExpanded ? (
            <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                Hide Options
            </>
        ) : (
            <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                Show All Options
            </>
        )}
      </button>

      {/* Full Options List (Collapsible) */}
      {isExpanded && (
        <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 animate-fadeIn">
          {question.options.map((option) => {
            const isCorrect = question.correctAnswer.includes(option.label);
            return (
                <div
                    key={option.label}
                    className={`p-3 rounded-md flex items-start gap-3 border ${
                        isCorrect 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-slate-200'
                    }`}
                >
                    <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        isCorrect ? 'bg-green-200 text-green-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {option.label}
                    </span>
                    <span className={`text-sm ${isCorrect ? 'text-green-900 font-medium' : 'text-slate-600'}`}>
                        {option.content}
                    </span>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
