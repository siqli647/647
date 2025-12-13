
import React, { useState, useRef } from 'react';
import { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  index?: number;
  onSwipeLeft?: () => void;
  isLearnedView?: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, onSwipeLeft, isLearnedView = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const startXRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Helper to resolve answer text from options
  const answerTexts = question.correctAnswer.map((ans) => {
    const matchedOption = question.options.find(opt => opt.label === ans);
    return matchedOption ? `${ans}. ${matchedOption.content}` : ans;
  });

  const handleStart = (clientX: number) => {
    if (isLearnedView) return; // Disable swipe in learned view
    startXRef.current = clientX;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (startXRef.current === null || !isDragging || isLearnedView) return;
    const diff = clientX - startXRef.current;
    // Only allow swiping left (negative diff)
    if (diff < 0) {
      setSwipeOffset(diff);
    }
  };

  const handleEnd = () => {
    if (isLearnedView) return;
    setIsDragging(false);
    startXRef.current = null;

    if (swipeOffset < -100) {
      // Threshold passed
      setSwipeOffset(-500); // Animate out
      setTimeout(() => {
        if (onSwipeLeft) onSwipeLeft();
        setSwipeOffset(0); // Reset for next usage if component reused
      }, 300);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
  };

  // Touch Events
  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse Events (for desktop testing)
  const onMouseDown = (e: React.MouseEvent) => handleStart(e.clientX);
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging) handleEnd(); };

  return (
    <div className="relative select-none group">
       {/* Background Action Layer */}
       {!isLearnedView && (
           <div className="absolute inset-0 bg-green-500 rounded-lg flex items-center justify-end px-6 z-0">
                <div className="flex items-center text-white font-bold gap-2">
                    <span>已学 (Learned)</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
           </div>
       )}

      {/* Swipeable Card */}
      <div 
        ref={cardRef}
        className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative z-10 transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
              {typeof index === 'number' && (
                <span className="bg-slate-100 text-slate-500 text-xs font-mono py-1 px-2 rounded">
                    #{index + 1}
                </span>
              )}
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide rounded-full border border-indigo-100">
                {question.type}
              </span>
          </div>
          {isLearnedView && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                  Learned
              </span>
          )}
        </div>
        
        {/* Question Text */}
        <h3 className="text-lg font-medium text-slate-900 mb-4 leading-relaxed select-text">
            {question.text}
        </h3>

        {/* Correct Answer Display (Always Visible) */}
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md select-text">
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

        {/* Expand/Collapse Toggle - Stop Propagation to prevent swipe issues */}
        <button 
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
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
            <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 animate-fadeIn select-text"
                 onMouseDown={(e) => e.stopPropagation()}
                 onTouchStart={(e) => e.stopPropagation()}
            >
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
    </div>
  );
};

export default QuestionCard;
