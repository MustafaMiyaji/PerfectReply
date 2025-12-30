import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedReply } from '../../types';
import { Sparkles, Copy, CheckCircle2, ChevronDown, ChevronUp, BrainCircuit, Share2, ThumbsUp, ThumbsDown, RefreshCw, Wand2, Edit3, Check, Info } from 'lucide-react';

interface ReplyCardProps {
  reply: GeneratedReply;
  index: number;
  onRegenerateSpecific?: (index: number) => void;
  onRegenerateAll?: () => void;
  isFocused?: boolean;
}

const TypewriterText = ({ text }: { text: string }) => {
  return (
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {text}
      </motion.span>
  );
};

export const ReplyCard: React.FC<ReplyCardProps> = ({ reply, index, onRegenerateSpecific, onRegenerateAll, isFocused }) => {
  const [copied, setCopied] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(reply.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
      setCurrentText(reply.text);
  }, [reply.text]);
  
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

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Perfect Reply',
          text: currentText,
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      handleCopy();
    }
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(prev => prev === type ? null : type);
  };

  // Generate particles for the starburst effect
  const particles = Array.from({ length: 24 });

  // Tone color mapping
  const getToneColor = (tone: string) => {
    const t = tone.toLowerCase();
    if (t.includes('playful') || t.includes('flirty')) return 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
    if (t.includes('direct') || t.includes('bold')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    if (t.includes('calm') || t.includes('cool')) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (t.includes('apologetic') || t.includes('warm')) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    return 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  };

  return (
    <motion.div 
      ref={cardRef}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ 
          opacity: 1, 
          y: 0, 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.5), 0 20px 40px -10px rgba(0,0,0,0.2)' : '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }}
      transition={{ delay: index * 0.2, type: "spring", stiffness: 100, damping: 15 }}
      className={`glass-panel rounded-[2rem] p-8 flex flex-col h-full hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 hover:-translate-y-2 relative overflow-visible group border border-white/60 dark:border-white/10 ${isFocused ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 z-10' : ''}`}
    >
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Top Gradient Line */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-soft-blush via-heartbeat-red to-deep-lavender opacity-60 rounded-t-[2rem]"></div>
      
      <div className="mb-6 flex justify-between items-start">
        <span className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-1.5 ${getToneColor(reply.tone)}`}>
           <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
          {reply.tone}
        </span>
        
        <div className="flex gap-1 -mr-2">
            <button
               onClick={() => setIsEditing(!isEditing)}
               className={`p-2 rounded-full transition-all duration-300 ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
               title="Edit reply"
            >
                {isEditing ? <Check size={14} /> : <Edit3 size={14} />}
            </button>
            {onRegenerateSpecific && (
                <button 
                  onClick={() => onRegenerateSpecific(index)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-full transition-all active:rotate-180 duration-500"
                  title="Regenerate this specific reply"
                >
                  <RefreshCw size={14} />
                </button>
            )}
            <button 
               onClick={handleShare}
               className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-full transition-colors"
               title="Share reply"
            >
              <Share2 size={14} />
            </button>
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
                className="w-full bg-transparent border-none p-0 resize-none focus:ring-0 text-[1.25rem] font-serif text-gray-800 dark:text-gray-100 leading-[1.6] font-medium"
            />
        ) : (
            <p className="font-serif text-[1.25rem] text-gray-800 dark:text-gray-100 leading-[1.6] select-all cursor-text selection:bg-heartbeat-red/20 dark:selection:bg-heartbeat-red/40 font-medium">
                "<TypewriterText text={currentText} />"
            </p>
        )}
      </div>

      <div className="mb-6 relative">
        <button 
          onClick={() => setShowReasoning(!showReasoning)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="group/btn flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-heartbeat-red dark:hover:text-heartbeat-red transition-colors mb-2 focus:outline-none w-full text-left"
        >
          <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700/50 group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-900/20 transition-colors">
            <BrainCircuit size={14} className={`transition-transform duration-700 ${showReasoning ? 'rotate-180 text-heartbeat-red' : 'group-hover/btn:rotate-12'}`} />
          </div>
          <span className="border-b border-transparent group-hover/btn:border-red-200 dark:group-hover/btn:border-red-800 transition-colors">
            Psychology breakdown
          </span>
          {showReasoning ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
        </button>

        {/* Hover Tooltip */}
        <AnimatePresence>
            {!showReasoning && showTooltip && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-xl shadow-xl z-20 pointer-events-none"
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-indigo-50/50 to-white/80 dark:from-indigo-900/30 dark:to-gray-800/80 rounded-xl p-5 text-sm text-gray-600 dark:text-gray-300 italic border border-indigo-100/60 dark:border-indigo-800/60 shadow-inner mt-2 backdrop-blur-sm relative overflow-hidden group/box">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-heartbeat-red to-purple-400 opacity-60"></div>
                
                <div className="flex gap-2">
                   <Sparkles size={16} className="text-heartbeat-red flex-shrink-0 mt-0.5 animate-pulse" />
                   <span className="leading-relaxed">{reply.reasoning}</span>
                </div>
                
                {/* Feedback Mechanism */}
                <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 font-normal not-italic">
                    <div className="flex items-center gap-2">
                        <span>Helpful?</span>
                        <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleFeedback('up')}
                        className={`p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors ${feedback === 'up' ? 'text-green-600 bg-green-50 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-800' : ''}`}
                        >
                            <ThumbsUp size={14} className={feedback === 'up' ? 'fill-current' : ''} />
                        </motion.button>
                        <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleFeedback('down')}
                        className={`p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors ${feedback === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-800' : ''}`}
                        >
                            <ThumbsDown size={14} className={feedback === 'down' ? 'fill-current' : ''} />
                        </motion.button>
                    </div>

                    {onRegenerateAll && (
                        <button 
                          onClick={onRegenerateAll} 
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

      <button 
        onClick={handleCopy}
        className={`
          relative w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all duration-500 overflow-visible mt-auto group/copy
          ${copied 
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/50 ring-4 ring-emerald-100 dark:ring-emerald-900 scale-[1.02]' 
            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 shadow-xl shadow-gray-200 dark:shadow-black/40 hover:shadow-2xl hover:shadow-gray-300 dark:hover:shadow-black/60 hover:-translate-y-0.5 active:scale-[0.98]'
          }
        `}
      >
        <div className="relative z-10 flex items-center gap-2">
          {copied ? <CheckCircle2 size={18} className="animate-bounce" /> : <Copy size={18} className="group-hover/copy:scale-110 transition-transform" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </div>
        
        {/* Enhanced Starburst Confetti Effect */}
        {copied && particles.map((_, i) => {
          const angle = (i / particles.length) * 360;
          const delay = Math.random() * 0.2;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
              animate={{
                x: Math.cos((angle * Math.PI) / 180) * (100 + Math.random() * 40),
                y: Math.sin((angle * Math.PI) / 180) * (100 + Math.random() * 40),
                opacity: 0,
                scale: Math.random() * 0.4 + 0.4,
                rotate: Math.random() * 360
              }}
              transition={{ duration: 0.6, delay: delay, ease: "easeOut" }}
              className={`absolute w-2 h-2 rounded-full pointer-events-none z-0 ${
                i % 4 === 0 ? 'bg-yellow-400' : 
                i % 4 === 1 ? 'bg-heartbeat-red' : 
                i % 4 === 2 ? 'bg-purple-400' : 'bg-emerald-400'
              }`}
            />
          );
        })}
      </button>
    </motion.div>
  );
};