import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Bot, RefreshCw, Mic, Volume2, MessageSquare, Phone, Paperclip, ImageIcon, Film, File as FileIcon } from 'lucide-react';
import { ChatAnalysis } from '../../types';
import { simulatePartnerReply } from '../../services/geminiService';
import { playSound } from '../ui/Visuals';
import { LiveVoiceSession } from './LiveVoiceSession';

interface RoleplayModalProps {
  onClose: () => void;
  analysis: ChatAnalysis;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const RoleplayModal: React.FC<RoleplayModalProps> = ({ onClose, analysis }) => {
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  
  const [messages, setMessages] = useState<Message[]>(() => {
      // Try to load persisted session first
      const savedSession = localStorage.getItem('perfectReplyRoleplaySession');
      if (savedSession) {
          try {
              return JSON.parse(savedSession);
          } catch(e) {
              console.error("Failed to parse saved roleplay session");
          }
      }

      // Parse extracted history into chat format
      const history = analysis.lastMessages?.map(m => ({
          role: m.sender === 'Me' ? 'user' as const : 'model' as const,
          text: m.text
      })) || [];
      
      // If empty, start with default greeting
      if (history.length === 0) {
          return [{ role: 'model', text: "Ready to practice? I'll act as your partner based on the analysis. Say something!" }];
      }
      return history;
  });
  
  const [input, setInput] = useState('');
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Scroll to bottom on mount and new messages
    if (mode === 'text') {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
    
    // Save to local storage
    if (messages.length > 0) {
        localStorage.setItem('perfectReplyRoleplaySession', JSON.stringify(messages));
    }
  }, [messages, isTyping, mode]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setChatFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const removeFile = (index: number) => {
      setChatFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && chatFiles.length === 0) return;
    playSound('click');
    
    const userMsgText = input;
    const currentFiles = [...chatFiles];
    
    // Optimistic UI Update
    setInput('');
    setChatFiles([]); // Clear immediately for UI
    
    const displayText = userMsgText + (currentFiles.length > 0 ? ` [Sent ${currentFiles.length} file(s)]` : "");
    setMessages(prev => [...prev, { role: 'user', text: displayText }]);
    setIsTyping(true);

    try {
        const reply = await simulatePartnerReply(messages, analysis, userMsgText, currentFiles);
        setMessages(prev => [...prev, { role: 'model', text: reply }]);
        playSound('success');
    } catch (e) {
        setMessages(prev => [...prev, { role: 'model', text: "(Connection error in roleplay engine)" }]);
    } finally {
        setIsTyping(false);
    }
  };

  const handleLiveTranscript = (role: 'user' | 'model', text: string) => {
      setMessages(prev => {
          // Avoid duplicates if rapid firing updates (basic check)
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.role === role && lastMsg.text === text) return prev;
          return [...prev, { role, text }];
      });
  };

  const clearSession = () => {
      if(window.confirm("Start a fresh roleplay session?")) {
          setMessages([{ role: 'model', text: "Reset complete. Let's start over." }]);
          localStorage.removeItem('perfectReplyRoleplaySession');
      }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
        <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col h-[85vh] relative"
        >
            {/* Mode Toggle Header */}
            {mode === 'text' && (
            <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Practice Mode</h3>
                        <p className="text-xs text-gray-400">Simulating: {analysis.partnerStyle}</p>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <div className="flex bg-gray-700 rounded-lg p-1 mr-2">
                        <button 
                            onClick={() => setMode('text')} 
                            className={`p-1.5 rounded-md transition-all ${mode === 'text' ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            title="Text Chat"
                        >
                            <MessageSquare size={16} />
                        </button>
                        <button 
                            onClick={() => setMode('voice')} 
                            className={`p-1.5 rounded-md transition-all ${mode === 'voice' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                            title="Live Call"
                        >
                            <Phone size={16} />
                        </button>
                    </div>
                    
                    <button onClick={clearSession} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors" title="Reset Session">
                        <RefreshCw size={18} />
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </div>
            )}

            {/* Content Switcher */}
            <div className="flex-grow flex flex-col overflow-hidden relative">
                {mode === 'voice' ? (
                    <LiveVoiceSession 
                        analysis={analysis} 
                        onEndCall={() => setMode('text')}
                        onTranscript={handleLiveTranscript}
                    />
                ) : (
                    <>
                        {/* Chat Area */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-900/50">
                            {/* Visual Separator if history exists */}
                            {analysis.lastMessages && analysis.lastMessages.length > 0 && (
                                <div className="flex items-center gap-4 opacity-50 py-2">
                                    <div className="h-px bg-gray-600 flex-grow"></div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Context from upload</span>
                                    <div className="h-px bg-gray-600 flex-grow"></div>
                                </div>
                            )}

                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-pink-600' : 'bg-indigo-600'}`}>
                                        {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                                    </div>
                                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-pink-600/20 text-pink-100 border border-pink-500/30' : 'bg-gray-800 text-gray-200 border border-gray-700'}`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            
                            {isTyping && (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 flex gap-1">
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                                        <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Spacer to allow scrolling past bottom */}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* File Preview Area */}
                        {chatFiles.length > 0 && (
                            <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex gap-2 overflow-x-auto">
                                {chatFiles.map((file, idx) => (
                                    <div key={idx} className="relative w-16 h-16 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-600">
                                        {file.type.startsWith('image/') ? (
                                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-lg opacity-80" />
                                        ) : (
                                            <div className="text-gray-400">
                                                {file.type.startsWith('video/') ? <Film size={20} /> : file.type.startsWith('audio/') ? <Mic size={20} /> : <FileIcon size={20} />}
                                            </div>
                                        )}
                                        <button 
                                            onClick={() => removeFile(idx)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        <div className="p-4 bg-gray-800 border-t border-gray-700">
                            <div className="relative flex items-center gap-2">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2.5 text-gray-400 hover:text-indigo-400 hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <Paperclip size={20} />
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    multiple 
                                    accept="image/*,video/*,audio/*"
                                    onChange={handleFileSelect}
                                />

                                <input 
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={chatFiles.length > 0 ? "Add a message..." : "Type your practice reply..."}
                                    className="flex-grow bg-gray-900 border border-gray-700 rounded-full px-6 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={(!input.trim() && chatFiles.length === 0) || isTyping}
                                    className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    </motion.div>
  );
};