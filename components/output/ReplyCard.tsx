import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GeneratedReply } from '../../types';
import { Sparkles, Copy, CheckCircle2, ChevronDown, ChevronUp, BrainCircuit, ThumbsUp, ThumbsDown, RefreshCw, Wand2, Edit3, Check, Info, MessageSquarePlus, Play, Square, MessageCircle, Send, Loader2, Share2 } from 'lucide-react';
import { SpotlightCard, HolographicOverlay, MiniAudioVisualizer, playSound } from '../ui/Visuals';
import { generateSpeech, pcmToAudioBuffer } from '../../services/geminiService';

interface ReplyCardProps {
  reply: GeneratedReply;
  index: number;
  onRegenerateSpecific?: (index: number) => void;
  onRegenerateAll?: () => void;
  isFocused?: boolean;
  onSelectForContinuation?: (text: string) => void; 
}

// Confetti Component for Copy Action
const ButtonConfetti = ({ active }: { active: boolean }) => {
    if (!active) return null;
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(12)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ 
                        x: (Math.random() - 0.5) * 100, 
                        y: (Math.random() - 0.5) * 100 - 20, 
                        opacity: 0,
                        scale: 0 
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: ['#FF6B6B', '#4F46E5', '#10B981', '#F59E0B'][Math.floor(Math.random() * 4)] }}
                />
            ))}
        </div>
    )
}

const TypewriterText = ({ text }: { text: string }) => {
  const characters = Array.from(text);
  return (
    <span className="inline-block">
      {characters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.01, delay: i * 0.008 }} // Faster typing
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};

// Friction-Free Share Menu
const ShareMenu = ({ text, onAction }: { text: string, onAction: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<any>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // 300ms hover bridge to prevent "rage clicking" when mouse slips
    timeoutRef.current = setTimeout(() => setIsOpen(false), 300);
  };

  const openLink = (platform: 'whatsapp' | 'sms') => {
      onAction();
      const encoded = encodeURIComponent(text);
      if (platform === 'whatsapp') {
          window.open(`https://wa.me/?text=${encoded}`, '_blank');
      } else {
          window.open(`sms:&body=${encoded}`, '_self');
      }
  };

  return (
    <div 
      className="relative z-20"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
        <button 
            className={`p-3.5 rounded-xl transition-all duration-300 border flex items-center justify-center gap-2 ${isOpen ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-700' : 'bg-white/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'}`}
            title="Share"
        >
            <Share2 size={18} />
        </button>

        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-2 right-0 flex flex-col gap-1 p-1.5 bg-white/90 dark:bg-gray-800/90 shadow-xl rounded-xl border border-gray-100 dark:border-gray-700 backdrop-blur-xl min-w-[140px]"
                >
                    {/* Invisible Bridge Element to maintain hover state during transit */}
                    <div className="absolute h-4 w-full -bottom-4 left-0 pointer-events-auto" />
                    
                    <button onClick={() => openLink('whatsapp')} className="flex items-center gap-2 px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors group/item w-full">
                        <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-md text-green-600 dark:text-green-400"><MessageCircle size={14} /></div>
                        WhatsApp
                    </button>
                    <button onClick={() => openLink('sms')} className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors group/item w-full">
                        <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded-md text-blue-600 dark:text-blue-400"><Send size={14} /></div>
                        Message
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  )
}

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, index, onRegenerateSpecific, onRegenerateAll, isFocused, onSelectForContinuation }) => {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // TTS State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<AudioBufferSourceNode | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  // Helper to clean quotes
  const cleanText = (t: string) => t.replace(/^["']|["']$/g, '');
  const [currentText, setCurrentText] = useState(cleanText(reply.text));
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [2, -2]); // Subtle tilt
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-2, 2]);

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width - 0.5;
    const yPct = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
    setShowTooltip(false);
    setIsHovered(false);
  }

  useEffect(() => {
      setCurrentText(cleanText(reply.text));
  }, [reply.text]);
  
  // Stop audio if unmounting
  useEffect(() => {
      return () => {
          if (sourceNode) sourceNode.stop();
          if (audioContext && audioContext.state !== 'closed') audioContext.close();
      };
  }, []);

  // Scroll to focus
  useEffect(() => {
      if (isFocused && cardRef.current) {
          cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  }, [isFocused]);

  useEffect(() => {
      if (isEditing && textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      }
  }, [isEditing]);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('success');
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTTS = async (e: React.MouseEvent) => {
      e.stopPropagation();
      playSound('click');

      // Stop if currently speaking
      if (isSpeaking) {
          if (sourceNode) {
              sourceNode.stop();
              setSourceNode(null);
          }
          setIsSpeaking(false);
          return;
      }

      setIsAudioLoading(true);

      try {
          // 1. Get raw bytes using Gemini 2.5 Flash TTS
          const audioData = await generateSpeech(currentText, reply.tone);

          // 2. Setup Audio Context
          let ctx = audioContext;
          if (!ctx) {
              ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
              setAudioContext(ctx);
          }
          if (ctx.state === 'suspended') await ctx.resume();

          // 3. Decode PCM
          const audioBuffer = await pcmToAudioBuffer(audioData, ctx);

          // 4. Play
          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
              setIsSpeaking(false);
              setSourceNode(null);
          };

          source.start();
          setSourceNode(source);
          setIsSpeaking(true);

      } catch (err) {
          console.error("TTS playback failed", err);
      } finally {
          setIsAudioLoading(false);
      }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    playSound('click');
    setFeedback(prev => prev === type ? null : type);
  };

  // Tone color mapping
  const getToneColor = (tone: string) => {
    const t = tone.toLowerCase();
    if (t.includes('playful') || t.includes('flirty')) return 'bg-pink-100/50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200/50 dark:border-pink-800';
    if (t.includes('direct') || t.includes('bold')) return 'bg-orange-100/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800';
    if (t.includes('calm') || t.includes('cool')) return 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-800';
    if (t.includes('apologetic') || t.includes('warm')) return 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800';
    return 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-600';
  };

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ 
          opacity: 1, 
          y: 0, 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 20px 40px -10px rgba(0,0,0,0.15)' 
            : '0 8px 30px -5px rgba(0, 0, 0, 0.05)'
      }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 20 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseEnter={() => { setIsHovered(true); playSound('hover'); }}
      onMouseLeave={onMouseLeave}
      className="h-full"
      onClick={() => playSound('glass-tap')}
    >
      <SpotlightCard 
        className={`glass-panel glass-panel-hover rounded-[2rem] p-6 md:p-8 flex flex-col h-full relative group border border-white/40 dark:border-white/10 ${isFocused ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 z-10' : ''}`} 
        spotlightColor="rgba(99, 102, 241, 0.15)"
      >
      
      {/* 3D Depth Elements */}
      <div style={{ transform: "translateZ(0px)" }} className="absolute inset-0 z-0">
          <HolographicOverlay />
      </div>
      
      <div style={{ transform: "translateZ(20px)" }} className="relative z-10 flex-grow flex flex-col">
          <div className="mb-6 flex flex-wrap justify-between items-start gap-2">
            <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-1.5 transition-transform duration-300 hover:scale-105 backdrop-blur-md ${getToneColor(reply.tone)}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse"></span>
              {reply.tone}
            </span>
            
            <div className={`flex gap-1 -mr-2 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
                {/* TTS Button */}
                <button
                  onClick={handleTTS}
                  disabled={isAudioLoading}
                  className={`p-2 rounded-full transition-all duration-300 flex items-center gap-2 ${isSpeaking ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50'}`}
                  title={isSpeaking ? "Stop listening" : "Hear tone"}
                >
                    {isAudioLoading ? (
                        <Loader2 size={14} className="animate-spin text-indigo-500" />
                    ) : isSpeaking ? (
                        <Square size={14} className="fill-current" />
                    ) : (
                        <Play size={14} className="ml-0.5" />
                    )}
                    {(isSpeaking || isAudioLoading) && <MiniAudioVisualizer isPlaying={isSpeaking && !isAudioLoading} />}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); playSound('click'); }}
                  className={`p-2 rounded-full transition-all duration-300 ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700/50'}`}
                  title="Edit reply"
                >
                    {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
                </button>
                {onRegenerateSpecific && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onRegenerateSpecific(index); playSound('click'); }}
                      className="p-2 text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full transition-all active:rotate-180 duration-500"
                      title="Regenerate this specific reply"
                    >
                      <RefreshCw size={14} />
                    </button>
                )}
            </div>
          </div>

          <div className="flex-grow mb-8 relative">
            {isEditing ? (
                <textarea
                    ref={textareaRef}
                    value={currentText}
                    onChange={(e) => {
                        setCurrentText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    className="w-full bg-transparent border-none p-0 resize-none focus:ring-0 text-[1.25rem] font-serif text-slate-800 dark:text-gray-100 leading-[1.6] font-medium"
                />
            ) : (
                <p className="font-serif text-lg md:text-[1.25rem] text-slate-800 dark:text-gray-100 leading-[1.6] select-all cursor-text selection:bg-heartbeat-red/20 dark:selection:bg-heartbeat-red/40 font-medium tracking-tight">
                    <TypewriterText text={currentText} />
                </p>
            )}
          </div>

          <div className="mb-6 relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowReasoning(!showReasoning); playSound('click'); }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="group/btn flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-heartbeat-red dark:hover:text-heartbeat-red transition-colors mb-2 focus:outline-none w-full text-left"
            >
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-gray-700/50 group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-900/20 transition-colors">
                <BrainCircuit size={14} className={`transition-transform duration-700 ${showReasoning ? 'rotate-180 text-heartbeat-red' : 'group-hover/btn:rotate-12'}`} />
              </div>
              <span className="border-b border-transparent group-hover/btn:border-red-200 dark:group-hover/btn:border-red-800 transition-colors uppercase tracking-wide text-[10px]">
                Psychology breakdown
              </span>
              {showReasoning ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
            </button>

            {/* Hover Tooltip */}
            <AnimatePresence>
                {!showReasoning && showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800/90 dark:bg-gray-700/90 backdrop-blur-xl text-white text-xs rounded-xl shadow-xl z-20 pointer-events-none border border-white/10"
                    >
                        <div className="flex items-center gap-2 mb-1 text-gray-400">
                            <Info size={10} />
                            <span className="font-bold uppercase tracking-wider text-[10px]">Why this works</span>
                        </div>
                        <p>Understanding the "why" helps you learn effective communication patterns for future conversations.</p>
                        <div className="absolute bottom-0 left-6 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800 dark:bg-gray-700"></div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showReasoning && (
                <motion.div
                  initial={{ height: 0, opacity: 0, rotateX: -90 }}
                  animate={{ height: 'auto', opacity: 1, rotateX: 0 }}
                  exit={{ height: 0, opacity: 0, rotateX: -90 }}
                  transition={{ duration: 0.4, type: "spring" }}
                  className="overflow-hidden perspective-1000"
                >
                  <div className="bg-gradient-to-br from-indigo-50/50 to-white/80 dark:from-indigo-900/30 dark:to-gray-800/80 rounded-xl p-5 text-sm text-slate-600 dark:text-gray-300 italic border border-indigo-100/60 dark:border-indigo-800/60 shadow-inner mt-2 backdrop-blur-sm relative overflow-hidden group/box">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-heartbeat-red to-purple-400 opacity-60"></div>
                    
                    <div className="flex gap-2">
                      <Sparkles size={16} className="text-heartbeat-red flex-shrink-0 mt-0.5 animate-pulse" />
                      <span className="leading-relaxed">{reply.reasoning}</span>
                    </div>
                    
                    {/* Feedback Mechanism */}
                    <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-slate-400 dark:text-gray-500 font-normal not-italic">
                        <div className="flex items-center gap-2">
                            <span>Helpful?</span>
                            <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleFeedback('up'); }}
                            className={`p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors ${feedback === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-800' : ''}`}
                            >
                                <ThumbsUp size={14} className={feedback === 'up' ? 'fill-current' : ''} />
                            </motion.button>
                            <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={(e) => { e.stopPropagation(); handleFeedback('down'); }}
                            className={`p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors ${feedback === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-800' : ''}`}
                            >
                                <ThumbsDown size={14} className={feedback === 'down' ? 'fill-current' : ''} />
                            </motion.button>
                        </div>

                        {onRegenerateAll && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onRegenerateAll(); playSound('click'); }}
                              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/regen"
                            >
                                <Wand2 size={12} className="group-hover/regen:rotate-12 transition-transform"/> Try new set
                            </button>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Row */}
          <div className="mt-auto flex flex-col gap-2">
              <div className="flex gap-2">
                <button 
                    onClick={handleCopy}
                    className={`
                    relative flex-grow py-3.5 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden group/copy border border-transparent
                    ${copied 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 scale-[0.98]' 
                        : 'bg-slate-900/90 dark:bg-white/90 text-white dark:text-gray-900 hover:bg-slate-800 dark:hover:bg-gray-200 shadow-xl shadow-slate-200 dark:shadow-black/40 hover:-translate-y-0.5 active:scale-[0.98] backdrop-blur-md'
                    }
                    `}
                >
                    {!copied && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/copy:translate-x-full transition-transform duration-700 ease-in-out"></div>
                    )}
                    <div className="relative z-10 flex items-center gap-2">
                    {copied ? <CheckCircle2 size={18} className="animate-bounce" /> : <Copy size={18} className="group-hover/copy:scale-110 transition-transform" />}
                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </div>
                    <ButtonConfetti active={copied} />
                </button>

                <ShareMenu text={currentText} onAction={() => playSound('click')} />

                {onSelectForContinuation && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSelectForContinuation(currentText); playSound('click'); }}
                        className="px-4 py-3.5 rounded-xl font-bold text-sm bg-white/50 dark:bg-gray-700/50 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-600 transition-all shadow-sm flex items-center gap-2 group/cont hover:scale-105 backdrop-blur-md"
                        title="I sent this one! Continue conversation."
                    >
                        <MessageSquarePlus size={18} className="group-hover/cont:scale-110 transition-transform" />
                    </button>
                )}
              </div>
          </div>
      </div>
      </SpotlightCard>
    </motion.div>
  );
};