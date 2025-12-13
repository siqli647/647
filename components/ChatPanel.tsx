
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";

interface ChatPanelProps {
  apiKey: string | undefined;
}

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingLinks?: { title: string; url: string }[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({ apiKey }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initChat = () => {
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });
    return ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are a helpful study assistant. Use Google Search to find up-to-date information when users ask questions. Provide concise, accurate answers.",
        tools: [{ googleSearch: {} }],
      }
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!chatSessionRef.current) {
        chatSessionRef.current = initChat();
    }
    
    if (!chatSessionRef.current) {
        setMessages(prev => [...prev, { role: 'model', text: 'Error: API Key not found.' }]);
        return;
    }

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userText });
      
      // Extract grounding links if available
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const links: { title: string; url: string }[] = [];
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
           if (chunk.web?.uri) {
               links.push({ title: chunk.web.title || 'Source', url: chunk.web.uri });
           }
        });
      }

      setMessages(prev => [...prev, { 
          role: 'model', 
          text: result.text || 'I found some information.',
          groundingLinks: links.length > 0 ? links : undefined
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error searching for that.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Smart Search
        </h2>
        <p className="text-xs text-slate-500">Powered by Google Search & Gemini</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
                <p>Ask anything related to psychology or the exam.</p>
                <p className="text-xs mt-2">Example: "What is the difference between id, ego, and superego?"</p>
            </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-100 text-slate-800'
            }`}>
              <div className="whitespace-pre-wrap">{msg.text}</div>
              
              {/* Render Grounding Sources */}
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-200/50">
                      <p className="text-xs font-semibold mb-1 opacity-70">Sources:</p>
                      <ul className="space-y-1">
                          {msg.groundingLinks.map((link, i) => (
                              <li key={i}>
                                  <a 
                                    href={link.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 underline truncate block hover:text-blue-600"
                                  >
                                      {link.title}
                                  </a>
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-slate-100 rounded-lg p-3 flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search online..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 text-white rounded-full p-2 px-4 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
