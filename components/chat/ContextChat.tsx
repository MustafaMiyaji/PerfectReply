import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, ChevronDown, Loader2, Paperclip, Image as ImageIcon, Globe, FileVideo, Music, Trash2, History, Save, Minus } from 'lucide-react';
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

// Simple heuristic for language detection
const detectLanguage = (text: string): string | null => {
    if (!text || text.length < 4) return null;
    
    // Check for specific script ranges
    const ranges = [
        { regex: /[\u0400-\u04FF]/, lang: "Russian/Cyrillic" },
        { regex: /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/, lang: "Japanese/Chinese" },
        { regex: /[\u0600-\u06FF]/, lang: "Arabic" },
        { regex: /[\u0900-\u097F]/, lang: "Hindi" },
        { regex: /[àáâãäåèéêëìíîïòóôõöùúûüñç]/i, lang: "European (Spanish/French/etc)" }
    ];

    for (const r of ranges) {
        if (r.regex.test(text)) return r.lang;
    }
    return null; // Default or ambiguous
};

// Helper to render formatted text (Markdown-style)
const FormattedMessage = ({ text, isUser }: { text: string, isUser: boolean }) => {
  const renderSegment = (segment: string) => {
    // Split by bold (**...**)
    const parts = segment.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      // Split by italic (*...*)
      return part.split(/(\*.*?\*)/g).map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
          return <em key={`${i}-${j}`} className="italic opacity-90">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
      });
    });
  };

  return (
    <div className={`space-y-1.5 ${isUser ? 'text-white' : 'text-gray-700 dark:text-gray-200'}`}>
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        // Handle list items
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            return (
                <div key={i} className="flex gap-2 pl-1">
                    <span className="opacity-60">•</span>
                    <span>{renderSegment(trimmed.substring(2))}</span>
                </div>
            )
        }
        return <div key={i} className="leading-relaxed">{renderSegment(line)}</div>;
      })}
    </div>
  );
};

const TypingIndicator = () => (
    <div className="flex gap-1 py-1 px-1">
        <motion.div 
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div 
            className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
    </div>
);

export const ContextChat: React.FC<ContextChatProps> = ({ files, textContext, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: "Hi! I'm your relationship coach. Upload context, then ask me about the vibe, hidden meanings, or what they *really* meant." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [selectedFileIndices, setSelectedFileIndices] = useState<Set<number>>(new Set());
  const [chatLanguage, setChatLanguage] = useState(language || '');
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-Save Logic
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only welcome message
        localStorage.setItem('perfectReplyChatHistory', JSON.stringify({
            messages,
            language: chatLanguage
        }));
    }
  }, [messages, chatLanguage]);

  // Load Logic
  const loadHistory = () => {
      const saved = localStorage.getItem('perfectReplyChatHistory');
      if (saved) {
          try {
              const data = JSON.parse(saved);
              setMessages(data.messages);
              if (data.language) setChatLanguage(data.language);
          } catch (e) { console.error("Failed to load chat history"); }
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
        scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Auto-detect language on input change
  useEffect(() => {
      const detected = detectLanguage(input);
      if (detected && !chatLanguage) {
          setChatLanguage(detected);
      }
  }, [input, chatLanguage]);

  // Sync initial language if props change and state is empty
  useEffect(() => {
      if (!chatLanguage && language) {
          setChatLanguage(language);
      }
  }, [language]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files || []);
      setChatFiles(prev => {
          const updated = [...prev, ...newFiles];
          // Auto-select newly added files
          const newIndices = new Set(selectedFileIndices);
          for(let i = prev.length; i < updated.length; i++) newIndices.add(i);
          setSelectedFileIndices(newIndices);
          return updated;
      });
    }
  };

  const toggleFileSelection = (index: number) => {
      const newSet = new Set(selectedFileIndices);
      if (newSet.has(index)) {
          newSet.delete(index);
      } else {
          newSet.add(index);
      }
      setSelectedFileIndices(newSet);
  };

  const clearAllFiles = () => {
      setChatFiles([]);
      setSelectedFileIndices(new Set());
  };

  const clearChat = () => {
      if (window.confirm("Are you sure you want to clear the entire chat history?")) {
          setMessages([{ id: 'welcome', role: 'model', text: "Hi! I'm your relationship coach. Upload context, then ask me about the vibe, hidden meanings, or what they *really* meant." }]);
          setChatFiles([]);
          setSelectedFileIndices(new Set());
          localStorage.removeItem('perfectReplyChatHistory');
      }
  };

  const handleSend = async () => {
    // Determine files to send
    const filesToSend = chatFiles.filter((_, i) => selectedFileIndices.has(i));

    if ((!input.trim() && filesToSend.length === 0) || isLoading) return;
    
    // Determine effective language to use
    const effectiveLanguage = chatLanguage || language || "English";
    
    const userMsgText = input;
    
    // Optimistic UI update
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userMsgText };
    setMessages(prev => [...prev, userMsg]);
    
    // Reset inputs
    setInput('');
    setChatFiles(prev => prev.filter((_, i) => !selectedFileIndices.has(i)));
    setSelectedFileIndices(new Set());
    
    setIsLoading(true);

    // Filter history for API
    const apiHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

    try {
        // Pass Global Files (files prop) AND Current Turn Files
        const responseText = await askRelationshipCoach(
            files.map(f => f.file), 
            textContext, 
            effectiveLanguage, 
            apiHistory, 
            userMsg.text || (filesToSend.length > 0 ? "[Sent files]" : ""),
            filesToSend
        );
        
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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90] flex flex-col items-end pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-[calc(100vw-32px)] md:w-[380px] h-[70vh] md:h-[600px] rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 overflow-hidden flex flex-col pointer-events-auto ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-500/90 to-purple-600/90 dark:from-indigo-600/80 dark:to-purple-700/80 backdrop-blur-md flex justify-between items-center text-white shadow-md z-10 cursor-pointer border-b border-white/10" onClick={() => setIsMinimized(true)}>
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shadow-inner relative">
                    <Sparkles size={16} className="text-white" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-purple-600"></span>
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight tracking-wide">Coach Chat</h3>
                    <p className="text-[10px] text-white/80 font-medium">Online & Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); loadHistory(); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" title="Load Previous Chat">
                      <History size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); clearChat(); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" title="Clear Chat">
                      <Trash2 size={18} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                    <Minus size={20} />
                  </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar scroll-smooth">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                    <div className={`
                        max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur-sm
                        ${msg.role === 'user' 
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-none shadow-lg border border-white/10' 
                        : 'bg-white/70 dark:bg-gray-800/60 border border-white/50 dark:border-white/10 rounded-bl-none text-gray-700 dark:text-gray-200 shadow-sm'
                        }
                    `}>
                        <FormattedMessage text={msg.text} isUser={msg.role === 'user'} />
                    </div>
                    </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                >
                   <div className="bg-white/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2 backdrop-blur-sm">
                       <TypingIndicator />
                   </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* File Previews / Selection Area */}
            {chatFiles.length > 0 && (
                <div className="px-3 pb-2 bg-white/60 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 pt-2 backdrop-blur-md">
                    <div className="flex justify-between items-center mb-1 px-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Attached Files</span>
                        <button onClick={clearAllFiles} className="text-[10px] text-red-500 hover:underline">Clear All</button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        {chatFiles.map((file, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => toggleFileSelection(idx)}
                                className={`
                                    relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border cursor-pointer transition-all
                                    ${selectedFileIndices.has(idx) 
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/20' 
                                        : 'border-gray-200 dark:border-gray-600 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                    }
                                `}
                            >
                                 {file.type.startsWith('image/') ? (
                                    <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                 ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400">
                                       {file.type.startsWith('video/') ? <FileVideo size={20} /> : file.type.startsWith('audio/') ? <Music size={20} /> : <ImageIcon size={20} />}
                                    </div>
                                 )}
                                 
                                 {selectedFileIndices.has(idx) && (
                                     <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                         <Sparkles size={8} className="text-white" />
                                     </div>
                                 )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Language Input Bar (Conditional) */}
            <AnimatePresence>
                {showLanguageInput && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-2 bg-white/60 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-700 overflow-hidden backdrop-blur-md"
                    >
                         <div className="flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg px-2 py-1.5 border border-white/20">
                            <Globe size={14} className="text-gray-400" />
                            <input 
                                type="text"
                                value={chatLanguage}
                                onChange={(e) => setChatLanguage(e.target.value)}
                                placeholder="Auto-detecting... or type language"
                                className="bg-transparent text-xs w-full focus:outline-none text-gray-700 dark:text-gray-200"
                            />
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 bg-white/80 dark:bg-gray-800/80 border-t border-white/40 dark:border-white/5 flex gap-2 items-center backdrop-blur-md">
               {/* File Input Hidden */}
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*,video/*,audio/*,text/plain"
                  onChange={handleFileSelect}
               />
               
               {/* Left Controls */}
               <div className="flex gap-1">
                   <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
                        title="Attach files"
                   >
                        <Paperclip size={18} />
                   </button>
                   <button 
                        onClick={() => setShowLanguageInput(!showLanguageInput)}
                        className={`p-2 rounded-full transition-colors ${showLanguageInput ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'}`}
                        title="Set Language"
                   >
                        <Globe size={18} />
                   </button>
               </div>

              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={selectedFileIndices.size > 0 ? "Ask about these files..." : "Ask the coach..."}
                className="flex-grow bg-gray-100/50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-100 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border border-transparent dark:border-gray-700 transition-all placeholder:text-gray-400 backdrop-blur-sm"
              />
              
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && selectedFileIndices.size === 0)}
                className="p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:shadow-lg disabled:opacity-50 text-white rounded-full transition-all active:scale-95 flex-shrink-0 shadow-indigo-500/20"
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
        onClick={() => {
            if(isMinimized) setIsMinimized(false);
            setIsOpen(!isOpen && !isMinimized);
        }}
        className={`
          pointer-events-auto p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center relative
          ${isOpen && !isMinimized
            ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-600 dark:text-gray-300 rotate-90 border border-white/20' 
            : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/40 ring-4 ring-white/20 dark:ring-black/20'
          }
        `}
      >
        {isOpen && !isMinimized ? <X size={24} /> : (
            <>
                <MessageCircle size={28} />
                {/* Notification dot */}
                {!isOpen && (
                     <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                )}
            </>
        )}
      </motion.button>
    </div>
  );
};
