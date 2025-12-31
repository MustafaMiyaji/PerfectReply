import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, ChevronDown, Loader2, Paperclip, Image as ImageIcon, Globe, FileVideo, Music } from 'lucide-react';
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
        
        // Handle headers / bold lines explicitly if needed, but regex covers it.
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

export const ContextChat: React.FC<ContextChatProps> = ({ files, textContext, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'model', text: "Hi! I'm your relationship coach. Upload context, then ask me about the vibe, hidden meanings, or what they *really* meant." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [chatLanguage, setChatLanguage] = useState(language || '');
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Sync initial language if props change and state is empty
  useEffect(() => {
      if (!chatLanguage && language) {
          setChatLanguage(language);
      }
  }, [language]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setChatFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setChatFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && chatFiles.length === 0) || isLoading) return;
    
    // Determine effective language to use
    const effectiveLanguage = chatLanguage || language || "English";
    
    const userMsgText = input;
    const currentFiles = [...chatFiles]; // Snapshot current files
    
    // Optimistic UI update
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: userMsgText };
    setMessages(prev => [...prev, userMsg]);
    
    // Reset inputs
    setInput('');
    setChatFiles([]);
    setIsLoading(true);

    // Filter history
    const apiHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, text: m.text }));

    try {
        const responseText = await askRelationshipCoach(
            files.map(f => f.file), 
            textContext, 
            effectiveLanguage, 
            apiHistory, 
            userMsg.text || (currentFiles.length > 0 ? "[Sent files]" : ""),
            currentFiles
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 bg-white dark:bg-gray-800 w-[calc(100vw-32px)] md:w-[380px] h-[60vh] md:h-[500px] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col pointer-events-auto ring-1 ring-black/5"
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
                    max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                    ${msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                    }
                  `}>
                    <FormattedMessage text={msg.text} isUser={msg.role === 'user'} />
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

            {/* File Previews */}
            {chatFiles.length > 0 && (
                <div className="px-3 pb-2 bg-white dark:bg-gray-800 flex gap-2 overflow-x-auto custom-scrollbar">
                    {chatFiles.map((file, idx) => (
                        <div key={idx} className="relative group flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900">
                             {file.type.startsWith('image/') ? (
                                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                   {file.type.startsWith('video/') ? <FileVideo size={20} /> : file.type.startsWith('audio/') ? <Music size={20} /> : <ImageIcon size={20} />}
                                </div>
                             )}
                             <button 
                                onClick={() => removeFile(idx)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                                 <X size={16} className="text-white" />
                             </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Language Input Bar (Conditional) */}
            <AnimatePresence>
                {showLanguageInput && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 overflow-hidden"
                    >
                         <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg px-2 py-1.5">
                            <Globe size={14} className="text-gray-400" />
                            <input 
                                type="text"
                                value={chatLanguage}
                                onChange={(e) => setChatLanguage(e.target.value)}
                                placeholder="E.g. English, Spanish..."
                                className="bg-transparent text-xs w-full focus:outline-none text-gray-700 dark:text-gray-200"
                            />
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 items-center">
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
                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Attach files"
                   >
                        <Paperclip size={18} />
                   </button>
                   <button 
                        onClick={() => setShowLanguageInput(!showLanguageInput)}
                        className={`p-2 rounded-full transition-colors ${showLanguageInput ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
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
                placeholder={chatFiles.length > 0 ? "Describe these files..." : "Ask the coach..."}
                className="flex-grow bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-transparent dark:border-gray-700 transition-all placeholder:text-gray-400"
              />
              
              <button 
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && chatFiles.length === 0)}
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
          pointer-events-auto p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center relative
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