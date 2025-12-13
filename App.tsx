
import React, { useState, useEffect } from 'react';
import { parseRawTextToQuestions } from './utils/parser';
import { rawQuestionText } from './data/rawText';
import { Question } from './types';
import QuestionCard from './components/QuestionCard';
import ChatPanel from './components/ChatPanel';

// Show 3 questions per group as requested
const QUESTIONS_PER_GROUP = 3;

const App: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Fisher-Yates Shuffle
  const shuffleArray = (array: Question[]) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  useEffect(() => {
    // 1. Parse all questions
    const parsed = parseRawTextToQuestions(rawQuestionText);
    // 2. Randomly shuffle them
    const shuffled = shuffleArray(parsed);
    setQuestions(shuffled);
    setLoading(false);
  }, []);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_GROUP);
  
  const currentQuestions = questions.slice(
    (currentPage - 1) * QUESTIONS_PER_GROUP,
    currentPage * QUESTIONS_PER_GROUP
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const scrollContainer = document.getElementById('question-container');
    if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">Preparing Exam...</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      
      {/* LEFT PANEL: Questions (2/3 height on mobile, full height on desktop) */}
      <div className="w-full md:w-1/2 flex flex-col h-2/3 md:h-full border-r border-slate-200 bg-slate-50/50">
        {/* Header for Questions */}
        <header className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex justify-between items-center shrink-0">
             <h1 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>📚</span> Exam Questions
             </h1>
             <span className="text-xs font-mono text-slate-400">
                 {questions.length} Total
             </span>
        </header>

        {/* Scrollable List */}
        <div id="question-container" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {currentQuestions.map((q, idx) => (
                <QuestionCard 
                    key={q.id} 
                    question={q} 
                    index={(currentPage - 1) * QUESTIONS_PER_GROUP + idx}
                />
            ))}
        </div>

        {/* Pagination Footer */}
        <footer className="bg-white p-4 border-t border-slate-200 shrink-0">
            <div className="flex items-center justify-between max-w-md mx-auto gap-4">
                <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                    Previous
                </button>
                <span className="text-sm font-medium text-slate-500">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                >
                    Next
                </button>
            </div>
        </footer>
      </div>

      {/* RIGHT PANEL: Search / Chat (1/3 height on mobile, full height on desktop) */}
      <div className="w-full md:w-1/2 h-1/3 md:h-full relative z-10 shadow-xl md:shadow-none">
        <ChatPanel apiKey={process.env.API_KEY} />
      </div>

    </div>
  );
};

export default App;
