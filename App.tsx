import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Heart, 
  Shield, 
  Zap, 
  Thermometer, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  Smile, 
  HeartHandshake, 
  Flame, 
  Scale, 
  AlertCircle, 
  RotateCcw, 
  Github, 
  Linkedin, 
  X, 
  Save, 
  Clock, 
  ChevronDown, 
  Bell, 
  Lightbulb, 
  Image as ImageIcon, 
  Download, 
  Moon, 
  Sun, 
  Globe, 
  Ghost, 
  MessageSquare, 
  Send, 
  CornerDownRight, 
  Paperclip, 
  Mic, 
  Film, 
  File as FileIcon, 
  Bot 
} from 'lucide-react';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { ContextDropzone } from './components/input/ContextDropzone';
import { VibeSelector } from './components/controls/VibeSelector';
import { ReplyCard } from './components/output/ReplyCard';
import { ContextChat } from './components/chat/ContextChat'; 
import { DatingProfileAnalyzer } from './components/overlay/DatingProfileAnalyzer';
import { RoleplayModal } from './components/overlay/RoleplayModal';
import { analyzeContext, generateReplies, generateReactionImage } from './services/geminiService';
import { VibeType, ChatAnalysis, GeneratedReply, FileWithId, CustomVibeConfig } from './types';
import { NoiseOverlay, ScrollProgress, SkeletonCard, Meteors, MagneticWrapper, TextReveal, RadarChart, playSound, StartupScreen, HolographicOverlay } from './components/ui/Visuals';
import { MediaPreviewModal } from './components/ui/MediaPreviewModal';

// Legal Content Constants (Condensed for brevity, content same as previous)
const PRIVACY_POLICY = `
**Privacy Policy**
... (Standard Policy Text)
`;

const TERMS_OF_SERVICE = `
**Terms of Service**
... (Standard Terms Text)
`;

// Simple Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info', onClose: () => void }) => {
  useEffect(() => {
    playSound('success');
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-xl border w-[90%] md:w-auto justify-center ring-1 ${
        type === 'success' 
          ? 'bg-emerald-50/90 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-100 ring-emerald-500/20' 
          : 'bg-blue-50/90 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100 ring-blue-500/20'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-300 flex-shrink-0" /> : <Bell size={18} className="text-blue-500 dark:text-blue-300 flex-shrink-0" />}
      <span className="font-medium text-sm truncate">{message}</span>
    </motion.div>
  );
};

// Confetti Component
const Confetti = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 2;
        const duration = 2 + Math.random() * 3;
        const bg = ['#FF6B6B', '#E6E6FA', '#FFD1DC', '#60A5FA', '#34D399'][Math.floor(Math.random() * 5)];
        
        return (
          <motion.div
            key={i}
            initial={{ top: '-10%', left: `${left}%`, rotate: 0, opacity: 1 }}
            animate={{ top: '110%', rotate: 360 + Math.random() * 360, opacity: 0 }}
            transition={{ duration, delay, ease: "linear" }}
            style={{ 
              position: 'absolute', 
              width: '8px', 
              height: '8px', 
              backgroundColor: bg,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px'
            }}
          />
        );
      })}
    </div>
  );
};

// Legal Modal Component
const LegalModal = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-lg p-4"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-white/40 dark:border-white/10 ring-1 ring-black/5 relative"
      onClick={e => e.stopPropagation()}
    >
      <HolographicOverlay />
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 relative z-10">
        <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield size={20} className="text-indigo-500" />
          {title}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar relative z-10">
        <div className="prose prose-sm prose-indigo dark:prose-invert text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
           {content.split('\n').map((line, i) => (
             <p key={i} className={line.startsWith('**') ? 'font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2' : 'mb-2'}>
               {line.replace(/\*\*/g, '')}
             </p>
           ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end relative z-10">
        <button onClick={onClose} className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors w-full md:w-auto">
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// Onboarding Modal
const OnboardingModal = ({ onClose }: { onClose: () => void }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-lg p-4"
    >
      <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="glass-panel rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden border border-white/20"
      >
          <HolographicOverlay />
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-heartbeat-red to-purple-500"></div>
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-100 to-indigo-100 dark:from-pink-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white dark:ring-gray-700 relative z-10">
             <Sparkles className="text-indigo-500 dark:text-indigo-300" size={32} />
          </div>
          
          <h2 className="font-serif text-2xl font-bold mb-3 text-gray-900 dark:text-white relative z-10">Welcome to PerfectReply</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-base relative z-10">
            Your personal AI relationship coach. Upload your chat history, select a vibe, and get the perfect response instantly.
          </p>
          
          <div className="space-y-4 text-left mb-8 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-700 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Upload Context (Audio/Images/Text)</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Select your desired Vibe</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Generate & Edit Replies</span>
             </div>
          </div>

          <button onClick={onClose} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-100 transition-transform active:scale-95 shadow-lg relative z-10">
             Let's Connect
          </button>
      </motion.div>
    </motion.div>
)

const App: React.FC = () => {
  // Theme Toggle State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) {
            return saved === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // State
  const [step, setStep] = useState<'upload' | 'analyzing' | 'config' | 'generating' | 'results'>('upload');
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [textContext, setTextContext] = useState('');
  const [language, setLanguage] = useState('');
  const [analysis, setAnalysis] = useState<ChatAnalysis | null>(null);
  const [vibe, setVibe] = useState<VibeType | string>(VibeType.Spark);
  const [customVibe, setCustomVibe] = useState<CustomVibeConfig | null>(null);
  const [intensity, setIntensity] = useState<number>(50);
  const [replies, setReplies] = useState<GeneratedReply[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  
  // Continuous Chat State
  const [chatHistory, setChatHistory] = useState<string>('');
  const [userSelectedReply, setUserSelectedReply] = useState<string | null>(null);
  const [partnerReplyInput, setPartnerReplyInput] = useState('');
  const [continuationFiles, setContinuationFiles] = useState<File[]>([]);
  const continuationFileInputRef = useRef<HTMLInputElement>(null);
  
  // New States
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusedReplyIndex, setFocusedReplyIndex] = useState<number>(-1);
  const [showDatingAnalyzer, setShowDatingAnalyzer] = useState(false);
  const [showRoleplay, setShowRoleplay] = useState(false);
  const [isStartupComplete, setIsStartupComplete] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const loadingMessages = [
    "Reading between the lines...",
    "Analyzing emotional subtext...",
    "Detecting communication patterns...",
    "Decoding the vibe...",
    "Consulting the heart..."
  ];

  const tips = [
    "Did you know? Mirroring your partner's emoji usage increases feelings of empathy.",
    "Pro Tip: Lower intensity is better for resolving conflicts safely.",
    "Insight: Short replies often signal high confidence in early dating stages.",
    "Fact: 65% of communication is non-verbal. Context files help us see that."
  ];

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // System Theme Listener
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('theme')) {
            setIsDarkMode(e.matches);
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
      playSound('click');
      setIsDarkMode(prev => {
          const newMode = !prev;
          localStorage.setItem('theme', newMode ? 'dark' : 'light');
          return newMode;
      });
  };

  useEffect(() => {
    const savedDraft = localStorage.getItem('perfectReplyDraft');
    const hasVisited = localStorage.getItem('perfectReplyVisited');
    if (!hasVisited) {
        // Show onboarding after startup animation
    }
  }, []);

  useEffect(() => {
    if (step === 'analyzing' || step === 'generating') {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingMessages.length);
        setTipIndex((prev) => (prev + 1) % tips.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (activeModal) setActiveModal(null);
            if (showOnboarding) setShowOnboarding(false);
            if (showRegenerateMenu) setShowRegenerateMenu(false);
            if (showReminderMenu) setShowReminderMenu(false);
            if (showDatingAnalyzer) setShowDatingAnalyzer(false);
            if (showRoleplay) setShowRoleplay(false);
            if (userSelectedReply) {
                setUserSelectedReply(null);
                setContinuationFiles([]);
            }
            if (previewFile) setPreviewFile(null);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            if (step === 'config') {
                e.preventDefault();
                generate();
            } else if (step === 'upload') {
                e.preventDefault();
                startAnalysis();
            }
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            if (step === 'results' && replies.length > 0 && focusedReplyIndex >= 0) {
                 const selectedText = window.getSelection()?.toString();
                 if (!selectedText) {
                     e.preventDefault();
                     navigator.clipboard.writeText(replies[focusedReplyIndex].text);
                     showToast("Copied focused reply!", "success");
                 }
            }
        }
        if (step === 'results') {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                setFocusedReplyIndex(prev => Math.min(prev + 1, replies.length - 1));
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                setFocusedReplyIndex(prev => Math.max(prev - 1, 0));
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, activeModal, showOnboarding, replies, focusedReplyIndex, showDatingAnalyzer, userSelectedReply, showRoleplay, previewFile]);

  const handleStartupComplete = () => {
      setIsStartupComplete(true);
      const hasVisited = localStorage.getItem('perfectReplyVisited');
      if (!hasVisited) {
          setShowOnboarding(true);
          localStorage.setItem('perfectReplyVisited', 'true');
      }
  }

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const saveDraft = () => {
    const draftData = { vibe, intensity, textContext, analysis };
    localStorage.setItem('perfectReplyDraft', JSON.stringify(draftData));
    showToast("Draft settings saved for later!");
  };

  const handleRemindMe = (time: string) => {
    setShowReminderMenu(false);
    showToast(`Reminder set for ${time}!`, 'info');
  };

  const handleFilesAdded = (newFiles: File[]) => {
    playSound('glass-tap');
    const newFilesWithIds = newFiles.map(f => ({
        id: Math.random().toString(36).substr(2, 9),
        file: f
    }));
    setFiles(prev => [...prev, ...newFilesWithIds]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleReorderFiles = (reorderedFiles: FileWithId[]) => {
      setFiles(reorderedFiles);
  }

  const startAnalysis = async () => {
    if (files.length === 0 && !textContext.trim()) {
      setError("Please add at least one screenshot, recording, or text snippet so we can understand the context.");
      return;
    }
    playSound('click');
    setError(null);
    setStep('analyzing');
    playSound('whoosh');
    try {
      const rawFiles = files.map(f => f.file);
      const result = await analyzeContext(rawFiles, textContext, language);
      setAnalysis(result);
      setStep('config');
      playSound('success');
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('SAFETY')) {
         setError("The conversation context triggered our safety filters. Please try removing sensitive content.");
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
         setError("Network connection failed. Please check your internet and try again.");
      } else {
         setError("We had trouble reading that conversation. Please try uploading clearer screenshots.");
      }
      setStep('upload');
    }
  };

  const generate = async (isVariation = false, historyOverride?: string, filesOverride?: FileWithId[]) => {
    if (!analysis) return;
    playSound('click');
    setStep('generating');
    setGeneratedImage(null);
    const finalIntensity = isVariation ? Math.min(100, Math.max(0, intensity + (Math.random() * 20 - 10))) : intensity;
    const filesToUse = filesOverride || files;
    const rawFiles = filesToUse.map(f => f.file);
    const effectiveHistory = historyOverride !== undefined ? historyOverride : chatHistory;

    try {
      const result = await generateReplies(analysis, vibe, customVibe, finalIntensity, rawFiles, textContext, language, effectiveHistory);
      setReplies(result);
      setStep('results');
      setFocusedReplyIndex(0);
      playSound('success');
      if (!effectiveHistory) {
          setTriggerConfetti(true);
          setTimeout(() => setTriggerConfetti(false), 5000);
      }
      setShowRegenerateMenu(false);
      setUserSelectedReply(null);
      setPartnerReplyInput('');
      setContinuationFiles([]);
    } catch (err: any) {
      console.error(err);
      setError("The empathy engine briefly lost connection. Please try hitting 'Generate' one more time.");
      setStep('config');
    }
  };
  
  const generateVisualAid = async () => {
      if (!analysis || replies.length === 0) return;
      
      // Feature: Check for API Key selection if user is on restricted plan or using restricted models
      if (typeof window !== 'undefined' && (window as any).aistudio) {
          try {
              const hasKey = await (window as any).aistudio.hasSelectedApiKey();
              if (!hasKey) {
                  await (window as any).aistudio.openSelectKey();
              }
          } catch (e) {
              console.error("AI Studio key check failed", e);
          }
      }

      playSound('click');
      setIsGeneratingImage(true);
      try {
          const base64 = await generateReactionImage(analysis);
          setGeneratedImage(base64);
          playSound('success');
      } catch (e: any) {
          if (e.message && e.message.includes('403')) {
             showToast("Access Denied: Please ensure you have selected a valid project/key for Image Generation.", 'info');
             if ((window as any).aistudio) {
                 await (window as any).aistudio.openSelectKey();
             }
          } else {
             showToast("Failed to generate image. Try again.", 'info');
          }
      } finally {
          setIsGeneratingImage(false);
      }
  }

  const regenerateSpecific = (index: number) => {
    generate(true); 
    showToast("Refreshing with variations...", 'info');
  };
  
  const regenerateAllShortcut = () => {
    generate(true);
    showToast("Creating new set...", 'info');
  }

  const handleSelectForContinuation = (text: string) => {
      setUserSelectedReply(text);
  }

  const handleContinuationFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setContinuationFiles(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  }

  const removeContinuationFile = (index: number) => {
      setContinuationFiles(prev => prev.filter((_, i) => i !== index));
  }

  const handleContinueConversation = () => {
      if ((!userSelectedReply || !partnerReplyInput.trim()) && continuationFiles.length === 0) return;
      playSound('click');
      let currentFiles = [...files];
      if (continuationFiles.length > 0) {
          const newFilesWithIds = continuationFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f
          }));
          currentFiles = [...currentFiles, ...newFilesWithIds];
          handleFilesAdded(continuationFiles);
      }
      const filesNote = continuationFiles.length > 0 ? ` [Partner sent ${continuationFiles.length} file(s)]` : "";
      const newHistory = (chatHistory ? chatHistory + "\n\n" : "") + `Me: ${userSelectedReply}\n` + `Partner: ${partnerReplyInput}${filesNote}`;
      setChatHistory(newHistory);
      generate(false, newHistory, currentFiles);
  }

  const reset = () => {
    playSound('click');
    setFiles([]);
    setTextContext('');
    setLanguage('');
    setAnalysis(null);
    setReplies([]);
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
    setChatHistory('');
    setUserSelectedReply(null);
    setPartnerReplyInput('');
    setContinuationFiles([]);
  };

  const vibeOptions = [
    { type: VibeType.Spark, icon: <Zap size={18} />, label: "Spark", desc: "Flirty & Playful", color: "bg-pink-100 text-pink-600 border-pink-200" },
    { type: VibeType.Repair, icon: <Shield size={18} />, label: "Repair", desc: "Apologetic & Gentle", color: "bg-emerald-100 text-emerald-600 border-emerald-200" },
    { type: VibeType.Cool, icon: <CheckCircle2 size={18} />, label: "Cool", desc: "Casual & Low-key", color: "bg-blue-100 text-blue-600 border-blue-200" },
    { type: VibeType.Deep, icon: <Heart size={18} />, label: "Deep", desc: "Romantic & Intense", color: "bg-rose-100 text-rose-600 border-rose-200" },
    { type: VibeType.Humorous, icon: <Smile size={18} />, label: "Humorous", desc: "Witty & Fun", color: "bg-amber-100 text-amber-600 border-amber-200" },
    { type: VibeType.Empathetic, icon: <HeartHandshake size={18} />, label: "Empathetic", desc: "Caring & Warm", color: "bg-teal-100 text-teal-600 border-teal-200" }
  ];

  const getIntensityIcon = () => {
    if (intensity < 35) return <Shield size={20} className="text-emerald-500 transition-all duration-300" />;
    if (intensity < 75) return <Scale size={20} className="text-yellow-500 transition-all duration-300" />;
    return <Flame size={20} className="text-red-500 transition-all duration-300" />;
  };

  const getIntensityLabel = () => {
    if (intensity < 35) return "Safe";
    if (intensity < 75) return "Balanced";
    return "Bold";
  };
  
  const ErrorMessage = ({ message }: { message: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-100 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-xl mt-6 text-center text-sm font-medium flex items-center justify-center gap-2 shadow-sm max-w-lg mx-auto"
    >
      <AlertCircle size={18} className="flex-shrink-0" />
      {message}
    </motion.div>
  );

  return (
    <div className={`relative min-h-screen w-full font-sans text-dark-slate overflow-x-hidden selection:bg-soft-blush selection:text-heartbeat-red flex flex-col transition-colors duration-500 ${isDarkMode ? 'dark' : ''}`}>
      <AnimatePresence>
        {!isStartupComplete && <StartupScreen onComplete={handleStartupComplete} />}
      </AnimatePresence>

      <AmbientBackground />
      <NoiseOverlay />
      <Meteors />
      <ScrollProgress />
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {activeModal === 'privacy' && <LegalModal title="Privacy Policy" content={PRIVACY_POLICY} onClose={() => setActiveModal(null)} />}
        {activeModal === 'terms' && <LegalModal title="Terms of Service" content={TERMS_OF_SERVICE} onClose={() => setActiveModal(null)} />}
        {triggerConfetti && <Confetti />}
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
        {showDatingAnalyzer && <DatingProfileAnalyzer onClose={() => setShowDatingAnalyzer(false)} initialFiles={files} />}
        {showRoleplay && analysis && <RoleplayModal onClose={() => setShowRoleplay(false)} analysis={analysis} />}
        {previewFile && <MediaPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
      </AnimatePresence>
      
      {/* Context Chat - Floating Assistant */}
      <ContextChat files={files} textContext={textContext} language={language} />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full px-4 py-3 md:px-6 md:py-4 z-50 flex justify-between items-center bg-white/10 dark:bg-black/20 backdrop-blur-md border-b border-white/20 dark:border-white/5 shadow-sm transition-all">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md flex items-center justify-center border border-white/50 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-12">
            <Heart size={16} className="text-heartbeat-red fill-heartbeat-red md:w-[18px] md:h-[18px]" />
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <span className="font-serif font-bold text-lg md:text-xl tracking-tight text-gray-800 dark:text-gray-100">PerfectReply</span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white/50 dark:bg-gray-700/50 border border-white/60 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm">Beta</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
            <button 
                onClick={toggleTheme}
                className="p-2 md:p-2.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all border border-white/40 dark:border-gray-600 shadow-sm hover:shadow-md active:scale-95"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={isDarkMode ? 'dark' : 'light'}
                        initial={{ y: -20, opacity: 0, rotate: -90 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: 20, opacity: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </motion.div>
                </AnimatePresence>
            </button>

            {step !== 'upload' && (
              <button 
                onClick={reset}
                className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 md:px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/40 dark:border-gray-600 transition-all shadow-sm hover:shadow-md active:scale-95 group"
              >
                <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                <span className="hidden sm:inline">Start Over</span>
              </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-grow p-4 md:p-8 pt-24 md:pt-32 pb-32 md:pb-24 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-full max-w-3xl"
            >
              <div className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden border border-white/60 dark:border-white/10 group hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                 {/* Animated Gradient Border Overlay */}
                 <div className="absolute inset-0 border-2 border-transparent rounded-[2rem] md:rounded-[2.5rem] bg-gradient-to-r from-pink-200/30 via-purple-200/30 to-blue-200/30 dark:from-pink-900/10 dark:to-blue-900/10 pointer-events-none"></div>

                <div className="text-center mb-8 md:mb-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-block mb-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold tracking-wide border border-white/50 dark:border-white/10 shadow-sm"
                  >
                    ✨ AI-Powered Relationship Advice
                  </motion.div>
                  <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl mb-4 md:mb-6 text-gray-900 dark:text-white leading-tight tracking-tight relative z-10">
                    Don't just reply. <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-heartbeat-red via-purple-500 to-indigo-500 animate-gradient-x bg-[length:200%_auto] inline-block mt-2">Connect.</span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-base md:text-xl max-w-lg mx-auto leading-relaxed font-light">
                    <TextReveal text="Upload screenshots, call recordings, or text. We'll decode the vibe and craft the perfect response." />
                  </p>
                </div>

                <ContextDropzone 
                  files={files} 
                  onFilesAdded={handleFilesAdded} 
                  onFileRemove={handleRemoveFile} 
                  onReorder={handleReorderFiles}
                  textContext={textContext}
                  setTextContext={setTextContext}
                />

                {/* Language Input */}
                <div className="mt-6 flex justify-center">
                    <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-gray-700 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-sm shadow-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors w-full max-w-sm focus-within:ring-2 focus-within:ring-indigo-500/30">
                        <Globe size={18} className="text-gray-500 dark:text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Language (e.g. English, Spanglish, Hindi)..." 
                            className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 w-full"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        />
                    </div>
                </div>

                {error && <ErrorMessage message={error} />}

                <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-3">
                  <MagneticWrapper>
                  <button 
                    onClick={startAnalysis}
                    disabled={files.length === 0 && !textContext.trim()}
                    className="
                      bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 md:px-10 py-3 md:py-4 rounded-full font-medium text-lg
                      hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                      flex items-center gap-3 shadow-xl shadow-gray-200 dark:shadow-black/20 hover:shadow-2xl hover:shadow-gray-300 dark:hover:shadow-black/40 hover:-translate-y-1
                      active:scale-95 group relative overflow-hidden ring-4 ring-transparent hover:ring-gray-100 dark:hover:ring-gray-800 w-full md:w-auto justify-center
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none"></div>
                    Analyze Conversation 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  </MagneticWrapper>

                  <MagneticWrapper>
                  <button 
                     onClick={() => setShowDatingAnalyzer(true)}
                     className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-6 py-3.5 rounded-full font-medium text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2 w-full md:w-auto justify-center shadow-sm hover:scale-[1.02] active:scale-98"
                  >
                      <Ghost size={20} /> New Match Opener
                  </button>
                  </MagneticWrapper>
                </div>
                <div className="text-center mt-3">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">Press <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">Ctrl+Enter</span> to start</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ... Steps 2, 3, 4 Logic (Keeping existing, just wrapping buttons where appropriate) ... */}
          {/* STEP 2: ANALYZING / GENERATING LOADING SCREEN */}
          {(step === 'analyzing' || step === 'generating') && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center max-w-lg w-full px-4"
            >
              {step === 'generating' ? (
                  <div className="flex gap-4 justify-center mb-8">
                      <SkeletonCard />
                  </div>
              ) : (
                <div className="relative w-32 h-32 md:w-48 md:h-48 mx-auto mb-8 md:mb-10 flex items-center justify-center">
                    <div className="absolute w-full h-full border-2 border-heartbeat-red/10 dark:border-heartbeat-red/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                    <div className="absolute w-[80%] h-[80%] border-2 border-purple-500/10 dark:border-purple-500/20 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
                    <div className="absolute inset-0 bg-heartbeat-red/5 dark:bg-heartbeat-red/10 rounded-full animate-ping opacity-75 duration-2000"></div>
                    <div className="absolute inset-8 bg-purple-500/5 dark:bg-purple-500/10 rounded-full animate-ping opacity-75 delay-300 duration-2000"></div>
                    <div className="relative w-16 h-16 md:w-24 md:h-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-full border border-white/80 dark:border-white/20 flex items-center justify-center shadow-2xl z-10">
                    <Sparkles className="text-heartbeat-red animate-pulse drop-shadow-md w-8 h-8 md:w-10 md:h-10" />
                    </div>
                </div>
              )}
              
              <h2 className="font-serif text-3xl md:text-4xl mb-4 text-gray-900 dark:text-white">
                {step === 'analyzing' ? 'Reading the room...' : 'Drafting replies...'}
              </h2>
              
              <div className="h-8 overflow-hidden relative mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingTextIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-gray-500 dark:text-gray-400 font-medium text-base md:text-lg"
                  >
                    {loadingMessages[loadingTextIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 transition={{ delay: 1 }}
                 className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/50 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 shadow-sm relative overflow-hidden group"
               >
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 group-hover:w-1.5 transition-all"></div>
                 <div className="flex items-start gap-3">
                    <Lightbulb size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                    <AnimatePresence mode="wait">
                        <motion.span 
                            key={tipIndex}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-left leading-relaxed"
                        >
                            {tips[tipIndex]}
                        </motion.span>
                    </AnimatePresence>
                 </div>
               </motion.div>
            </motion.div>
          )}

          {/* STEP 3: CONFIGURATION */}
          {step === 'config' && analysis && (
            <motion.div 
              key="config"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-3xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Analysis Summary */}
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/50 dark:to-purple-900/50 backdrop-blur-md border border-indigo-100 dark:border-indigo-800 p-6 rounded-[1.5rem] shadow-lg shadow-indigo-100/50 dark:shadow-black/30"
                  >
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-indigo-600 dark:text-indigo-400 mt-1 shadow-sm shrink-0">
                        <Sparkles size={20} />
                        </div>
                        <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">AI Insight</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{analysis.summary}</p>
                        <div className="flex gap-2 flex-wrap">
                            {analysis.tags.map(tag => (
                            <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 rounded-md border border-indigo-50 dark:border-indigo-700 shadow-sm">
                                #{tag}
                            </span>
                            ))}
                        </div>
                        </div>
                    </div>
                  </motion.div>

                  {/* Vibe Visualizer (Radar Chart) */}
                  {analysis.personalityMetrics && (
                      <motion.div 
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md border border-white/60 dark:border-white/10 p-4 rounded-[1.5rem] flex flex-col items-center justify-center relative overflow-hidden"
                      >
                          <div className="absolute top-4 left-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Vibe Visualizer</div>
                          <div className="mt-4">
                              <RadarChart metrics={analysis.personalityMetrics} />
                          </div>
                      </motion.div>
                  )}
              </div>

              {/* Red Flag Scanner Alert */}
              {analysis.redFlags && analysis.redFlags.length > 0 && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-8 bg-red-50/90 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 relative overflow-hidden"
                  >
                      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)] pointer-events-none"></div>
                      <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-lg text-red-600 dark:text-red-400 shrink-0 z-10">
                          <AlertCircle size={20} />
                      </div>
                      <div className="z-10">
                          <h4 className="font-bold text-red-700 dark:text-red-300 text-sm uppercase tracking-wide mb-1">Red Flags Detected</h4>
                          <ul className="text-sm text-red-600 dark:text-red-200 list-disc list-inside space-y-1">
                              {analysis.redFlags.map((flag, i) => (
                                  <li key={i}>{flag}</li>
                              ))}
                          </ul>
                      </div>
                  </motion.div>
              )}

              <div className="glass-panel rounded-[2rem] p-6 md:p-10 shadow-2xl border border-white/60 dark:border-white/10 relative">
                
                <div className="absolute top-6 right-6 md:top-8 md:right-8 flex gap-2">
                    <button 
                      onClick={() => setShowRoleplay(true)}
                      className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 flex items-center gap-2 text-sm font-bold transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:shadow-sm"
                    >
                      <Bot size={16} /> <span className="hidden sm:inline">Practice Mode</span>
                    </button>
                    <button 
                      onClick={saveDraft}
                      className="text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm font-medium transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-2 rounded-full border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm"
                    >
                      <Save size={16} /> <span className="hidden sm:inline">Save Draft</span>
                    </button>
                </div>

                <div className="mb-8">
                  <h2 className="font-serif text-2xl md:text-3xl mb-2 text-gray-900 dark:text-white">Set the tone</h2>
                  <p className="text-gray-500 dark:text-gray-400">How do you want to come across?</p>
                </div>
                
                <VibeSelector 
                  selectedVibe={vibe} 
                  onSelect={setVibe} 
                  options={vibeOptions} 
                  customVibe={customVibe}
                  setCustomVibe={setCustomVibe}
                />

                <div className="mb-10 bg-gradient-to-b from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 p-4 md:p-6 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm z-0"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <label className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                        <Thermometer size={18} className="text-gray-500 dark:text-gray-400" /> Risk Level
                      </label>
                      <motion.div 
                        key={getIntensityLabel()}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 bg-white/70 dark:bg-gray-700 px-4 py-1.5 rounded-full border border-white/50 dark:border-gray-600 shadow-sm"
                      >
                        {getIntensityIcon()}
                        <span className="font-bold text-gray-900 dark:text-white min-w-[70px] text-right">
                          {getIntensityLabel()}
                        </span>
                      </motion.div>
                    </div>
                    
                    <div className="relative h-12 flex items-center group px-2">
                      <div className="absolute w-[calc(100%-16px)] h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner left-2">
                        <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                      <div className="absolute w-[calc(100%-16px)] h-full pointer-events-none flex justify-between px-1 left-2">
                        {[0, 25, 50, 75, 100].map(tick => (
                          <div key={tick} className="w-0.5 h-1.5 bg-white/50 dark:bg-white/20 mt-[21px]"></div>
                        ))}
                      </div>

                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={intensity} 
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="
                          relative w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer z-10
                          focus:outline-none
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-8
                          [&::-webkit-slider-thumb]:h-8
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-white
                          [&::-webkit-slider-thumb]:dark:bg-gray-200
                          [&::-webkit-slider-thumb]:border-4
                          [&::-webkit-slider-thumb]:border-white
                          [&::-webkit-slider-thumb]:dark:border-gray-600
                          [&::-webkit-slider-thumb]:shadow-[0_4px_10px_rgba(0,0,0,0.15)]
                          [&::-webkit-slider-thumb]:transition-all
                          [&::-webkit-slider-thumb]:hover:scale-110
                          [&::-webkit-slider-thumb]:active:scale-95
                        "
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium px-2 uppercase tracking-wider">
                      <span>Safe & Polite</span>
                      <span>Bold & Direct</span>
                    </div>
                  </div>
                </div>

                {error && <ErrorMessage message={error} />}

                <MagneticWrapper>
                <button 
                  onClick={() => generate()}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-semibold text-lg hover:bg-black dark:hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:shadow-gray-400 dark:hover:shadow-black/40 flex items-center justify-center gap-2 active:scale-[0.98] relative overflow-hidden group ring-4 ring-transparent hover:ring-indigo-100 dark:hover:ring-indigo-900"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none"></div>
                  <Sparkles size={20} className="animate-pulse" /> Generate Replies
                </button>
                </MagneticWrapper>
              </div>
            </motion.div>
          )}

          {/* STEP 4: RESULTS */}
          {step === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-5xl"
            >
              {/* ... Continuation Overlay Code (Kept same) ... */}
              <AnimatePresence>
                  {userSelectedReply && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-end md:items-center justify-center pointer-events-none"
                      >
                          {/* Backdrop */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setUserSelectedReply(null); setContinuationFiles([]); }}
                            className="absolute inset-0 bg-white/20 dark:bg-black/30 backdrop-blur-md pointer-events-auto"
                          />

                          {/* Popup Card */}
                          <motion.div
                            initial={{ y: 100, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            className="pointer-events-auto relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-gray-700 overflow-hidden mx-4 mb-0 md:mb-12 flex flex-col max-h-[85vh]"
                          >
                              {/* Header */}
                              <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-md">
                                  <div>
                                      <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                          <CornerDownRight className="text-indigo-500" size={20} /> Reply Studio
                                      </h3>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Continuing conversation...</p>
                                  </div>
                                  <button 
                                    onClick={() => { setUserSelectedReply(null); setContinuationFiles([]); }}
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                                  >
                                      <X size={20} />
                                  </button>
                              </div>

                              <div className="p-6 md:p-8 overflow-y-auto">
                                  {/* Context Bubble */}
                                  <div className="mb-6">
                                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1 block">Context (You Sent)</span>
                                      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl text-sm md:text-base text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-800/50 italic leading-relaxed relative">
                                          "{userSelectedReply}"
                                          <div className="absolute -bottom-2 left-6 w-4 h-4 bg-indigo-50 dark:bg-gray-900 border-b border-r border-indigo-100 dark:border-indigo-800/50 transform rotate-45"></div>
                                      </div>
                                  </div>

                                  {/* Input Area */}
                                  <div className="relative">
                                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Partner's Response</span>
                                      
                                      {continuationFiles.length > 0 && (
                                          <div className="flex gap-3 overflow-x-auto pb-4 mb-2 custom-scrollbar">
                                              {continuationFiles.map((file, idx) => (
                                                  <div key={idx} className="relative flex-shrink-0 w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                                                      {file.type.startsWith('image/') ? (
                                                          <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="preview" />
                                                      ) : (
                                                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                              {file.type.startsWith('video/') ? <Film size={24} /> : file.type.startsWith('audio/') ? <Mic size={24} /> : <FileIcon size={24} />}
                                                              <span className="text-[8px] uppercase font-bold mt-1">{file.name.split('.').pop()}</span>
                                                          </div>
                                                      )}
                                                      <button 
                                                          onClick={() => removeContinuationFile(idx)}
                                                          className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                      >
                                                          <X size={10} />
                                                      </button>
                                                  </div>
                                              ))}
                                          </div>
                                      )}

                                      <div className="relative bg-gray-50 dark:bg-gray-800 rounded-[1.5rem] border-2 border-transparent focus-within:border-indigo-500/30 transition-all shadow-inner">
                                          <textarea 
                                            autoFocus
                                            placeholder="Type what they replied, or upload screenshots/audio..." 
                                            className="w-full bg-transparent border-none rounded-[1.5rem] p-4 pr-14 min-h-[100px] resize-none focus:ring-0 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            value={partnerReplyInput}
                                            onChange={(e) => setPartnerReplyInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleContinueConversation();
                                                }
                                            }}
                                          />
                                          
                                          {/* Action Toolbar inside Input */}
                                          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                                              <div className="flex gap-1">
                                                  <input 
                                                      type="file" 
                                                      multiple 
                                                      className="hidden" 
                                                      ref={continuationFileInputRef}
                                                      onChange={handleContinuationFileSelect}
                                                      accept="image/*,video/*,audio/*,text/plain"
                                                  />
                                                  <button 
                                                      onClick={() => continuationFileInputRef.current?.click()}
                                                      className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors flex items-center gap-2 text-xs font-medium group"
                                                      title="Attach Evidence"
                                                  >
                                                      <Paperclip size={18} />
                                                      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Add Media</span>
                                                  </button>
                                              </div>
                                              
                                              <button 
                                                onClick={handleContinueConversation}
                                                disabled={(!partnerReplyInput.trim() && continuationFiles.length === 0)}
                                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white p-2.5 rounded-full transition-all shadow-md active:scale-95 flex items-center gap-2 pl-4 group"
                                              >
                                                  <span className="text-xs font-bold uppercase tracking-wide">Reply</span>
                                                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                              </button>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      </motion.div>
                  )}
              </AnimatePresence>

              <div className="flex flex-col md:flex-row justify-between items-center mb-8 px-2 gap-4">
                <button 
                  onClick={() => setStep('config')}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium flex items-center gap-2 transition-colors px-4 py-2 hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-full w-full md:w-auto justify-center"
                >
                  &larr; Adjust Settings
                </button>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {/* ... (Existing buttons: Remind Me, Regenerate) ... */}
                    <div className="relative w-full sm:w-auto">
                        <button 
                            onClick={() => setShowReminderMenu(!showReminderMenu)}
                            className="text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-full text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all w-full active:scale-95"
                        >
                            <Clock size={16} /> Remind Me
                        </button>
                        <AnimatePresence>
                            {showReminderMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-2 right-0 w-full sm:w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                                >
                                    <button onClick={() => handleRemindMe('1 hour')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200">In 1 hour</button>
                                    <button onClick={() => handleRemindMe('3 hours')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-50 dark:border-gray-700">In 3 hours</button>
                                    <button onClick={() => handleRemindMe('tomorrow')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-50 dark:border-gray-700">Tomorrow</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <button 
                            onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 w-full sm:min-w-[160px] sm:justify-between"
                        >
                            <span className="flex items-center gap-2"><RefreshCw size={16} /> Regenerate</span>
                            <ChevronDown size={14} className={`transition-transform ${showRegenerateMenu ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <AnimatePresence>
                            {showRegenerateMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-2 right-0 w-full sm:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                                >
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-xs font-bold text-gray-400 uppercase tracking-wider">Options</div>
                                    <button onClick={() => generate(false)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 flex items-center justify-between group">
                                        Standard Refresh
                                        <RefreshCw size={14} className="text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-400" />
                                    </button>
                                    <button onClick={() => generate(true)} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between group">
                                        Add Variations
                                        <Sparkles size={14} className="text-gray-300 group-hover:text-purple-500" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
              </div>
              
              <div className="mb-10 w-full flex flex-col md:flex-row gap-6 items-stretch">
                 <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-lg backdrop-blur-sm flex flex-col justify-center items-center flex-grow relative overflow-hidden group hover:shadow-xl transition-shadow duration-500">
                     {!generatedImage ? (
                         <div className="text-center z-10">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Need a Visual Aid?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">Generate a custom emoji or sticker that perfectly captures this feeling.</p>
                            <MagneticWrapper>
                            <button 
                                onClick={generateVisualAid}
                                disabled={isGeneratingImage}
                                className="bg-white dark:bg-gray-800 px-5 py-2.5 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 shadow-sm border border-indigo-100 dark:border-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                            >
                                {isGeneratingImage ? <RefreshCw className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                                {isGeneratingImage ? "Creating..." : "Generate Sticker"}
                            </button>
                            </MagneticWrapper>
                         </div>
                     ) : (
                         <div className="relative group w-full h-full min-h-[160px] flex items-center justify-center">
                             <img src={generatedImage} alt="Generated Sticker" className="max-h-48 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
                             <a 
                                href={generatedImage} 
                                download="perfect-reply-sticker.png"
                                className="absolute bottom-2 right-2 p-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white rounded-full text-gray-700 dark:text-gray-200 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download"
                             >
                                <Download size={16} />
                             </a>
                             <button 
                                onClick={() => setGeneratedImage(null)} 
                                className="absolute top-2 right-2 p-1 bg-white/50 dark:bg-gray-800/50 hover:bg-white rounded-full text-gray-500 hover:text-red-500 transition-colors"
                             >
                                <X size={14} />
                             </button>
                         </div>
                     )}
                     
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
                <AnimatePresence>
                {replies.map((reply, idx) => (
                   <ReplyCard 
                     key={idx} 
                     reply={reply} 
                     index={idx} 
                     onRegenerateSpecific={regenerateSpecific}
                     onRegenerateAll={regenerateAllShortcut}
                     isFocused={focusedReplyIndex === idx}
                     onSelectForContinuation={handleSelectForContinuation}
                   />
                ))}
                </AnimatePresence>
              </div>
              
              {replies.length > 0 && (
                  <div className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500 pb-20">
                      Tip: Select a reply (icon bottom right of card) to continue the conversation.
                  </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 md:py-12 text-center text-gray-400 dark:text-gray-500 text-sm relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-black/30 backdrop-blur-md mt-auto">
        <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 px-4">
               <button onClick={() => setActiveModal('privacy')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:underline decoration-wavy decoration-indigo-300 underline-offset-4">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors hover:underline decoration-wavy decoration-indigo-300 underline-offset-4">Terms of Service</button>
               <div className="hidden md:block h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
               <a href="https://github.com/MustafaMiyaji" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2 group"><Github size={16} className="group-hover:scale-110 transition-transform" /> GitHub</a>
               <a href="https://www.linkedin.com/in/mustafa-alimiyaji-195742327/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2 group"><Linkedin size={16} className="group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" /> LinkedIn</a>
            </div>
            
            <div className="text-center px-4">
                <p className="font-semibold text-gray-600 dark:text-gray-400 tracking-wide text-xs uppercase mb-2">Powered by Gemini 3.0</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm flex items-center justify-center gap-1.5 flex-wrap">
                   Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by <span className="font-medium text-gray-700 dark:text-gray-300 relative group cursor-default">Mustafa Miyaji <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span></span>
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;