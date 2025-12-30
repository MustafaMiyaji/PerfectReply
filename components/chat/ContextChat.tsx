import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { askRelationshipCoach } from '../../services/geminiService';

interface ContextChatProps {
  files: any[];
  textContext: string;
  language: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const ContextChat: React.FC<ContextChatProps> = ({ files, textContext, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: "Hi! I'm your relationship coach. Upload your conversation context, then ask me anything about the vibe, hidden meanings, or what they *really* meant." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    // Check if context exists when user tries to really ask something (beyond simple greetings maybe, but let's enforce context for utility)
    if (files.length === 0 && !textContext.trim()) {
        const errorMsg: Message = { id: Date.now().toString(), role: 'model', text: "I need a little more to go on! Please upload some screenshots, audio, or paste some text first so I can analyze the situation." };
        setMessages(prev => [...prev, errorMsg]);
        return;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Prepare history for API (exclude the welcome message if you want, or keep it as context, usually better to exclude 'welcome' if it's static)
    // We filter out the fake welcome message for the API call to avoid confusing the model with hardcoded text, 
    // unless we want it to know it introduced itself. Let's exclude for cleaner context.
    const apiHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

    try {
        const responseText = await askRelationshipCoach(files.map(f => f.file), textContext, language, apiHistory, userMsg.text);
        
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error("Chat error", error);
        const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: "Sorry, I lost my train of thought. Can you ask that again?" };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 bg-white dark:bg-gray-800 w-[90vw] md:w-[380px] h-[500px] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col pointer-events-auto ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 flex justify-between items-center text-white shadow-md z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Sparkles size={16} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">Coach Chat</h3>
                    <p className="text-[10px] text-white/80 font-medium">Ask about context & intent</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <ChevronDown size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 custom-scrollbar scroll-smooth">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                    }
                  `}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                       <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the conversation..."
                className="flex-grow bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent dark:border-gray-700 transition-all placeholder:text-gray-400"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-full transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          pointer-events-auto p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center relative
          ${isOpen 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rotate-90' 
            : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30'
          }
        `}
      >
        {isOpen ? <X size={24} /> : (
            <>
                <MessageCircle size={28} />
                {/* Notification dot if needed */}
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
            </>
        )}
      </motion.button>
    </div>
  );
};