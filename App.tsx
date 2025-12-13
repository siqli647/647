
import React, { useState, useEffect, useMemo } from 'react';
import { parseRawTextToQuestions } from './utils/parser';
import { rawQuestionText } from './data/rawText';
import { Question } from './types';
import QuestionCard from './components/QuestionCard';
import ChatPanel from './components/ChatPanel';

const VISIBLE_QUEUE_SIZE = 3;
const STORAGE_KEY = 'psych_exam_learned_ids_v1';

const App: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize state from localStorage
  const [learnedIds, setLearnedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      console.warn('Failed to load progress from storage:', e);
      return new Set();
    }
  });

  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 1. Load Data
  useEffect(() => {
    const parsed = parseRawTextToQuestions(rawQuestionText);
    setAllQuestions(parsed);
    setLoading(false);
  }, []);

  // 2. Persist Learned IDs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(learnedIds)));
    } catch (e) {
      console.warn('Failed to save progress to storage:', e);
    }
  }, [learnedIds]);

  // 3. Filter Lists
  const unlearnedQuestions = useMemo(() => 
    allQuestions.filter(q => !learnedIds.has(q.id)), 
  [allQuestions, learnedIds]);

  const learnedQuestions = useMemo(() => 
    allQuestions.filter(q => learnedIds.has(q.id)), 
  [allQuestions, learnedIds]);

  // 4. Queue Logic (Always show top 3 of unlearned)
  const displayedQueue = unlearnedQuestions.slice(0, VISIBLE_QUEUE_SIZE);

  const handleMarkAsLearned = (id: string) => {
    setLearnedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setLearnedIds(new Set());
    setActiveTab('todo');
    setShowResetConfirm(false);
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Preparing Exam...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      
      {/* LEFT PANEL: Questions */}
      <div className="w-full md:w-1/2 flex flex-col h-2/3 md:h-full border-r border-slate-200 bg-slate-50/50">
        
        {/* Header & Tabs */}
        <header className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0 z-20">
             <div className="flex justify-between items-center mb-4">
                <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <span>📖 题库浏览</span>
                </h1>
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-500">
                    Total: {allQuestions.length}
                </span>
             </div>

             <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                    onClick={() => setActiveTab('todo')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'todo' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    未学 (Unlearned) <span className="ml-1 text-xs opacity-70">({unlearnedQuestions.length})</span>
                </button>
                <button
                    onClick={() => setActiveTab('done')}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                        activeTab === 'done' 
                        ? 'bg-white text-green-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    已学 (Learned) <span className="ml-1 text-xs opacity-70">({learnedQuestions.length})</span>
                </button>
             </div>
        </header>

        {/* Scrollable List */}
        <div id="question-container" className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 space-y-6 relative">
            
            {/* TODO TAB */}
            {activeTab === 'todo' && (
                <>
                    {displayedQueue.length > 0 ? (
                        <>
                            <div className="flex items-center justify-center mb-2 text-xs text-slate-400 font-medium tracking-wide uppercase">
                                <span className="bg-slate-200/50 px-2 py-1 rounded">Swipe Left to Mark as Learned</span>
                            </div>
                            {displayedQueue.map((q) => (
                                <QuestionCard 
                                    key={q.id} 
                                    question={q} 
                                    onSwipeLeft={() => handleMarkAsLearned(q.id)}
                                />
                            ))}
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <svg className="w-16 h-16 mb-4 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium text-slate-600">All caught up!</p>
                            <p className="text-sm">You have learned all questions.</p>
                        </div>
                    )}
                </>
            )}

            {/* DONE TAB */}
            {activeTab === 'done' && (
                <div className="space-y-6">
                    {learnedQuestions.length > 0 ? (
                        <>
                            <div className="flex justify-end sticky top-0 z-10 bg-slate-50/95 py-2 -mt-2">
                                {showResetConfirm ? (
                                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-red-100 animate-fadeIn">
                                        <span className="text-sm text-red-600 font-medium">Confirm reset all progress?</span>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={confirmReset}
                                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                            >
                                                Yes, Reset
                                            </button>
                                            <button 
                                                onClick={cancelReset}
                                                className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded hover:bg-slate-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleResetClick}
                                        className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors border border-red-200 flex items-center gap-1 shadow-sm"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        重新学习 (Reset All)
                                    </button>
                                )}
                            </div>
                            {learnedQuestions.map((q) => (
                                <div key={q.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                     <QuestionCard question={q} isLearnedView={true} />
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p>No questions learned yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* RIGHT PANEL: Search / Chat */}
      <div className="w-full md:w-1/2 h-1/3 md:h-full relative z-10 shadow-xl md:shadow-none bg-white">
        <ChatPanel apiKey={process.env.API_KEY} />
      </div>

    </div>
  );
};

export default App;
