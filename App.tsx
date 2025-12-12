
import React, { useState, useEffect, useRef } from 'react';
import { parseRawTextToQuestions } from './utils/parser';
import { rawQuestionText } from './data/rawText';
import { Question, ChatState, ChatMessage } from './types';
import QuestionCard from './components/QuestionCard';
import ChatModal from './components/ChatModal';
import { GoogleGenAI, Chat } from "@google/genai";

// Initialize AI Client safely
const apiKey = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error("API_KEY is missing! Check your environment variables.");
}

const QUESTIONS_PER_PAGE = 5;

const App: React.FC = () => {
  // 1. Safety Check for API Key
  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl border border-red-200 max-w-md text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            The <code>API_KEY</code> environment variable is missing.
          </p>
          <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded text-left">
            <strong>Fix:</strong> Go to Vercel Dashboard &rarr; Settings &rarr; Environment Variables and add <code>API_KEY</code>.
          </p>
        </div>
      </div>
    );
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    // Load bookmarks from localStorage on init
    try {
      const saved = localStorage.getItem('bookmarks');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (e) {
      return new Set();
    }
  });

  const [chatState, setChatState] = useState<ChatState>({
    isOpen: false,
    questionId: null,
    history: [],
    isLoading: false,
  });

  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    const parsed = parseRawTextToQuestions(rawQuestionText);
    setQuestions(parsed);
  }, []);

  // Filter questions based on search and bookmarks
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmark = showBookmarksOnly ? bookmarkedIds.has(q.id) : true;
    return matchesSearch && matchesBookmark;
  });

  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  
  // Ensure we don't stay on a page that doesn't exist after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
        setCurrentPage(1);
    }
  }, [filteredQuestions.length, totalPages, currentPage]);

  const currentQuestions = filteredQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Save to localStorage
      localStorage.setItem('bookmarks', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleExplain = async (question: Question) => {
    if (!ai) return;

    setChatState({
      isOpen: true,
      questionId: question.id,
      history: [],
      isLoading: true,
    });

    try {
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a helpful and knowledgeable psychology tutor. Your goal is to explain exam questions clearly in Chinese (中文). When asked to explain a question, analyze the options, identify the correct one based on psychological theories, and explain why it is correct and why others are incorrect. Be concise but thorough.",
        }
      });

      const prompt = `Please explain this question in Chinese (中文):
      
Question: ${question.text}

Options:
${question.options.map(o => `${o.label}. ${o.content}`).join('\n')}

Correct Answer: ${question.correctAnswer.join(', ')}

Please provide a detailed explanation of why this answer is correct in Chinese.`;

      const response = await chatSessionRef.current.sendMessage({ message: prompt });
      
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        history: [{ role: 'model', text: response.text || "I couldn't generate an explanation." }]
      }));

    } catch (error) {
      console.error("Error generating explanation:", error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        history: [{ role: 'model', text: "Sorry, I encountered an error while fetching the explanation. Please check your API key and connection." }]
      }));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) return;

    setChatState(prev => ({
      ...prev,
      history: [...prev.history, { role: 'user', text }],
      isLoading: true
    }));

    try {
      const response = await chatSessionRef.current.sendMessage({ message: text });
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        history: [...prev.history, { role: 'model', text: response.text || "No response text." }]
      }));
    } catch (error) {
      console.error("Chat error:", error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        history: [...prev.history, { role: 'model', text: "Error sending message." }]
      }));
    }
  };

  const closeChat = () => {
    setChatState(prev => ({ ...prev, isOpen: false }));
    chatSessionRef.current = null;
  };

  const activeQuestionText = questions.find(q => q.id === chatState.questionId)?.text || '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-xl font-bold text-indigo-700 tracking-tight flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  Psychology Exam Prep AI
                </h1>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1); 
                            }}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        onClick={() => {
                            setShowBookmarksOnly(!showBookmarksOnly);
                            setCurrentPage(1);
                        }}
                        className={`p-2 rounded-md border transition-colors ${
                            showBookmarksOnly 
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                        title="Show bookmarks only"
                    >
                        <svg className={`w-5 h-5 ${showBookmarksOnly ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex justify-end">
                 Showing {filteredQuestions.length} of {questions.length} questions
            </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow border border-gray-100">
            <p className="text-gray-500 text-lg">Loading questions or no data available...</p>
            <p className="text-gray-400 text-sm mt-2">Check data/rawText.ts formatting.</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg shadow border border-gray-100">
                <p className="text-gray-500 text-lg">No questions found.</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter.</p>
                <button 
                    onClick={() => { setSearchQuery(''); setShowBookmarksOnly(false); }}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    Clear Filters
                </button>
            </div>
        ) : (
          <>
            {currentQuestions.map((q) => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                onExplain={handleExplain}
                isBookmarked={bookmarkedIds.has(q.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8 pt-8 border-t border-gray-200">
                    <button
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-md">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Next
                    </button>
                </div>
            )}
          </>
        )}
      </main>

      <ChatModal 
        isOpen={chatState.isOpen}
        onClose={closeChat}
        messages={chatState.history}
        onSendMessage={handleSendMessage}
        isLoading={chatState.isLoading}
        questionText={activeQuestionText}
      />
    </div>
  );
};

export default App;
