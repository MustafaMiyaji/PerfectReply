import React, { useState, useEffect } from 'react';
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
  Globe
} from 'lucide-react';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { ContextDropzone } from './components/input/ContextDropzone';
import { VibeSelector } from './components/controls/VibeSelector';
import { ReplyCard } from './components/output/ReplyCard';
import { ContextChat } from './components/chat/ContextChat'; // Import Chat
import { analyzeContext, generateReplies, generateReactionImage } from './services/geminiService';
import { VibeType, ChatAnalysis, GeneratedReply, FileWithId, CustomVibeConfig } from './types';

// Legal Content Constants
const PRIVACY_POLICY = `
**Privacy Policy**

Last updated: ${new Date().toLocaleDateString()}

1. **Information We Collect**
   We do not store your uploaded images or text on our servers. All processing is done via the Google Gemini API, and your data is processed transiently. We do not maintain a database of your conversations.

2. **Use of AI**
   This application uses artificial intelligence to analyze your inputs. By using this service, you acknowledge that your data will be sent to Google's GenAI APIs for processing.

3. **Cookies**
   We use local storage only to save your preferences (e.g., drafts). We do not use tracking cookies for advertising.

4. **Contact**
   For questions, please reach out via GitHub or LinkedIn.
`;

const TERMS_OF_SERVICE = `
**Terms of Service**

1. **Acceptance**
   By using PerfectReply, you agree to these terms.

2. **Usage Guidelines**
   You agree not to upload illegal, harassing, or explicit content. This tool is for relationship advice and entertainment purposes only.

3. **Disclaimer**
   The advice generated is by an AI and should not replace professional counseling or therapy. We are not liable for any actions taken based on this advice.

4. **Changes**
   We reserve the right to modify these terms at any time.
`;

// Simple Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
        type === 'success' 
          ? 'bg-emerald-50/90 dark:bg-emerald-900/90 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-100' 
          : 'bg-blue-50/90 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-100'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-300" /> : <Bell size={18} className="text-blue-500 dark:text-blue-300" />}
      <span className="font-medium text-sm">{message}</span>
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
    className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-white/40 dark:border-white/10"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="font-serif text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Shield size={20} className="text-indigo-500" />
          {title}
        </h3>
        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400">
          <X size={18} />
        </button>
      </div>
      <div className="p-6 overflow-y-auto custom-scrollbar">
        <div className="prose prose-sm prose-indigo dark:prose-invert text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
           {content.split('\n').map((line, i) => (
             <p key={i} className={line.startsWith('**') ? 'font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2' : 'mb-2'}>
               {line.replace(/\*\*/g, '')}
             </p>
           ))}
        </div>
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
        <button onClick={onClose} className="px-6 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div 
         initial={{ scale: 0.8, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
      >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-heartbeat-red to-purple-500"></div>
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-100 to-indigo-100 dark:from-pink-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
             <Sparkles className="text-indigo-500 dark:text-indigo-300" size={32} />
          </div>
          
          <h2 className="font-serif text-2xl font-bold mb-3 text-gray-900 dark:text-white">Welcome to PerfectReply</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Your personal AI relationship coach. Upload your chat history, select a vibe, and get the perfect response instantly.
          </p>
          
          <div className="space-y-4 text-left mb-8 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Upload Context (Audio/Images/Text)</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Select your desired Vibe</span>
             </div>
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">Generate & Edit Replies</span>
             </div>
          </div>

          <button onClick={onClose} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl font-bold hover:bg-black dark:hover:bg-gray-100 transition-transform active:scale-95 shadow-lg">
             Let's Connect
          </button>
      </motion.div>
    </motion.div>
)

const App: React.FC = () => {
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
  
  // New States
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [showRegenerateMenu, setShowRegenerateMenu] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [triggerConfetti, setTriggerConfetti] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [focusedReplyIndex, setFocusedReplyIndex] = useState<number>(-1);

  // Rotating loading messages
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

  // Theme Toggle Effect
  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check for saved drafts on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('perfectReplyDraft');
    const hasVisited = localStorage.getItem('perfectReplyVisited');
    
    if (!hasVisited) {
        setShowOnboarding(true);
        localStorage.setItem('perfectReplyVisited', 'true');
    }

    if (savedDraft && step === 'upload') {
       // Silent restore logic could go here if implemented
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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Global Esc to close modals
        if (e.key === 'Escape') {
            if (activeModal) setActiveModal(null);
            if (showOnboarding) setShowOnboarding(false);
            if (showRegenerateMenu) setShowRegenerateMenu(false);
            if (showReminderMenu) setShowReminderMenu(false);
        }

        // Generate on Cmd/Ctrl + Enter if in config
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            if (step === 'config') {
                e.preventDefault();
                generate();
            } else if (step === 'upload') {
                e.preventDefault();
                startAnalysis();
            }
        }

        // Copy selected reply (Ctrl+C)
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            // Only capture if we have replies and user isn't selecting text elsewhere
            if (step === 'results' && replies.length > 0 && focusedReplyIndex >= 0) {
                 const selectedText = window.getSelection()?.toString();
                 if (!selectedText) {
                     e.preventDefault();
                     navigator.clipboard.writeText(replies[focusedReplyIndex].text);
                     showToast("Copied focused reply!", "success");
                 }
            }
        }
        
        // Navigation between replies in results
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
  }, [step, activeModal, showOnboarding, replies, focusedReplyIndex]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const saveDraft = () => {
    const draftData = {
      vibe,
      intensity,
      textContext,
      analysis 
    };
    localStorage.setItem('perfectReplyDraft', JSON.stringify(draftData));
    showToast("Draft settings saved for later!");
  };

  const handleRemindMe = (time: string) => {
    setShowReminderMenu(false);
    showToast(`Reminder set for ${time}!`, 'info');
  };

  const handleFilesAdded = (newFiles: File[]) => {
    // Wrap files with IDs
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
    
    setError(null);
    setStep('analyzing');
    
    try {
      // Un-wrap files for API
      const rawFiles = files.map(f => f.file);
      const result = await analyzeContext(rawFiles, textContext, language);
      setAnalysis(result);
      setStep('config');
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

  const generate = async (isVariation = false) => {
    if (!analysis) return;
    setStep('generating');
    setGeneratedImage(null); // Reset image on regen
    
    const finalIntensity = isVariation ? Math.min(100, Math.max(0, intensity + (Math.random() * 20 - 10))) : intensity;
    const rawFiles = files.map(f => f.file);

    try {
      const result = await generateReplies(analysis, vibe, customVibe, finalIntensity, rawFiles, textContext, language);
      setReplies(result);
      setStep('results');
      setFocusedReplyIndex(0); // Focus first reply
      setTriggerConfetti(true);
      setTimeout(() => setTriggerConfetti(false), 5000);
      setShowRegenerateMenu(false);
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('SAFETY')) {
         setError("The generated replies were flagged for safety. Try adjusting the intensity or vibe.");
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('network'))) {
         setError("Connection lost. Please check your network and try again.");
      } else {
         setError("The empathy engine briefly lost connection with the muse. Please try hitting 'Generate' one more time.");
      }
      setStep('config');
    }
  };
  
  const generateVisualAid = async () => {
      if (!analysis || replies.length === 0) return;
      setIsGeneratingImage(true);
      try {
          const base64 = await generateReactionImage(analysis);
          setGeneratedImage(base64);
      } catch (e) {
          showToast("Failed to generate image. Try again.", 'info');
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

  const reset = () => {
    setFiles([]);
    setTextContext('');
    setLanguage('');
    setAnalysis(null);
    setReplies([]);
    setGeneratedImage(null);
    setStep('upload');
    setError(null);
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
      <AmbientBackground />
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {activeModal === 'privacy' && <LegalModal title="Privacy Policy" content={PRIVACY_POLICY} onClose={() => setActiveModal(null)} />}
        {activeModal === 'terms' && <LegalModal title="Terms of Service" content={TERMS_OF_SERVICE} onClose={() => setActiveModal(null)} />}
        {triggerConfetti && <Confetti />}
        {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      </AnimatePresence>
      
      {/* Context Chat - Floating Assistant */}
      <ContextChat files={files} textContext={textContext} language={language} />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 z-50 flex justify-between items-center bg-white/10 dark:bg-black/20 backdrop-blur-md border-b border-white/20 dark:border-white/5 shadow-sm transition-all">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-10 h-10 rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md flex items-center justify-center border border-white/50 dark:border-gray-700 shadow-sm transition-transform group-hover:scale-105 group-hover:rotate-12">
            <Heart size={18} className="text-heartbeat-red fill-heartbeat-red" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-xl tracking-tight text-gray-800 dark:text-gray-100">PerfectReply</span>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/50 dark:bg-gray-700/50 border border-white/60 dark:border-gray-600 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-sm">Beta</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all border border-white/40 dark:border-gray-600 shadow-sm hover:shadow-md"
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
                className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm border border-white/40 dark:border-gray-600 transition-all shadow-sm hover:shadow-md active:scale-95 group"
              >
                <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500" />
                <span className="hidden sm:inline">Start Over</span>
              </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-grow p-4 md:p-8 pt-32 pb-20">
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
              <div className="glass-panel rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden border border-white/60 dark:border-white/10">
                 {/* Animated Gradient Border Overlay */}
                 <div className="absolute inset-0 border-2 border-transparent rounded-[2.5rem] bg-gradient-to-r from-pink-200/30 via-purple-200/30 to-blue-200/30 dark:from-pink-900/10 dark:to-blue-900/10 pointer-events-none"></div>

                <div className="text-center mb-10">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="inline-block mb-3 px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-700 dark:text-purple-300 text-xs font-semibold tracking-wide border border-white/50 dark:border-white/10 shadow-sm"
                  >
                    ✨ AI-Powered Relationship Advice
                  </motion.div>
                  <h1 className="font-serif text-5xl md:text-6xl mb-6 text-gray-900 dark:text-white leading-tight tracking-tight relative z-10">
                    Don't just reply. <br/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-heartbeat-red via-purple-500 to-indigo-500 animate-gradient-x bg-[length:200%_auto] inline-block mt-2">Connect.</span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg md:text-xl max-w-lg mx-auto leading-relaxed font-light">
                    Upload screenshots, call recordings, or text. We'll decode the vibe and craft the perfect response.
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
                    <div className="bg-white/40 dark:bg-gray-800/40 border border-white/60 dark:border-gray-700 rounded-full px-4 py-2 flex items-center gap-3 backdrop-blur-sm shadow-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors w-full max-w-sm">
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

                <div className="mt-10 flex justify-center flex-col items-center gap-3">
                  <button 
                    onClick={startAnalysis}
                    disabled={files.length === 0 && !textContext.trim()}
                    className="
                      bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-10 py-4 rounded-full font-medium text-lg
                      hover:bg-gray-800 dark:hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                      flex items-center gap-3 shadow-xl shadow-gray-200 dark:shadow-black/20 hover:shadow-2xl hover:shadow-gray-300 dark:hover:shadow-black/40 hover:-translate-y-1
                      active:scale-95 group relative overflow-hidden ring-4 ring-transparent hover:ring-gray-100 dark:hover:ring-gray-800
                    "
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none"></div>
                    Analyze Conversation 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide">Press <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">Ctrl+Enter</span> to start</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: ANALYZING / GENERATING LOADING SCREEN */}
          {(step === 'analyzing' || step === 'generating') && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center max-w-lg w-full"
            >
              <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
                {/* Orbital Rings */}
                <div className="absolute w-full h-full border-2 border-heartbeat-red/10 dark:border-heartbeat-red/20 rounded-full animate-[spin_8s_linear_infinite]"></div>
                <div className="absolute w-[80%] h-[80%] border-2 border-purple-500/10 dark:border-purple-500/20 rounded-full animate-[spin_6s_linear_infinite_reverse]"></div>
                
                {/* Ripples */}
                <div className="absolute inset-0 bg-heartbeat-red/5 dark:bg-heartbeat-red/10 rounded-full animate-ping opacity-75 duration-2000"></div>
                <div className="absolute inset-8 bg-purple-500/5 dark:bg-purple-500/10 rounded-full animate-ping opacity-75 delay-300 duration-2000"></div>
                
                <div className="relative w-24 h-24 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-full border border-white/80 dark:border-white/20 flex items-center justify-center shadow-2xl z-10">
                   <Sparkles className="text-heartbeat-red animate-pulse drop-shadow-md" size={40} />
                </div>
              </div>
              
              <h2 className="font-serif text-4xl mb-4 text-gray-900 dark:text-white">
                {step === 'analyzing' ? 'Reading the room...' : 'Drafting replies...'}
              </h2>
              
              <div className="h-8 overflow-hidden relative mb-8">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingTextIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-gray-500 dark:text-gray-400 font-medium text-lg"
                  >
                    {loadingMessages[loadingTextIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Tips Carousel */}
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 transition={{ delay: 1 }}
                 className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm p-4 rounded-xl border border-white/50 dark:border-white/10 text-sm text-gray-600 dark:text-gray-300 shadow-sm relative overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400"></div>
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
              {/* Insight Banner */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-900/50 dark:to-purple-900/50 backdrop-blur-md border border-indigo-100 dark:border-indigo-800 p-6 rounded-[1.5rem] flex items-start gap-5 shadow-lg shadow-indigo-100/50 dark:shadow-black/30"
              >
                <div className="p-3 bg-white dark:bg-gray-800 rounded-full text-indigo-600 dark:text-indigo-400 mt-1 shadow-sm shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">AI Insight</h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{analysis.summary}</p>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.tags.map(tag => (
                      <span key={tag} className="text-xs font-semibold px-2.5 py-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 rounded-md border border-indigo-50 dark:border-indigo-700 shadow-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="glass-panel rounded-[2rem] p-8 md:p-10 shadow-2xl border border-white/60 dark:border-white/10 relative">
                
                {/* Save Draft Button */}
                <button 
                  onClick={saveDraft}
                  className="absolute top-8 right-8 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 text-sm font-medium transition-colors bg-white/50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:shadow-sm"
                >
                  <Save size={16} /> Save Draft
                </button>

                <div className="mb-8">
                  <h2 className="font-serif text-3xl mb-2 text-gray-900 dark:text-white">Set the tone</h2>
                  <p className="text-gray-500 dark:text-gray-400">How do you want to come across?</p>
                </div>
                
                <VibeSelector 
                  selectedVibe={vibe} 
                  onSelect={setVibe} 
                  options={vibeOptions} 
                  customVibe={customVibe}
                  setCustomVibe={setCustomVibe}
                />

                {/* Intensity Slider */}
                <div className="mb-10 bg-gradient-to-b from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 p-6 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner relative overflow-hidden">
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
                      {/* Visual Gradient Track */}
                      <div className="absolute w-[calc(100%-16px)] h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner left-2">
                        <div className="w-full h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-rose-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                      {/* Ticks */}
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

                <button 
                  onClick={() => generate()}
                  className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-semibold text-lg hover:bg-black dark:hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:shadow-gray-400 dark:hover:shadow-black/40 flex items-center justify-center gap-2 active:scale-[0.98] relative overflow-hidden group ring-4 ring-transparent hover:ring-indigo-100 dark:hover:ring-indigo-900"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 pointer-events-none"></div>
                  <Sparkles size={20} className="animate-pulse" /> Generate Replies
                </button>
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
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 px-2 gap-4">
                <button 
                  onClick={() => setStep('config')}
                  className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 font-medium flex items-center gap-2 transition-colors px-4 py-2 hover:bg-white/40 dark:hover:bg-gray-800/40 rounded-full"
                >
                  &larr; Adjust Settings
                </button>
                
                <div className="flex items-center gap-3">
                    {/* Reminder Button */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowReminderMenu(!showReminderMenu)}
                            className="text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Clock size={16} /> Remind Me
                        </button>
                        <AnimatePresence>
                            {showReminderMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
                                >
                                    <button onClick={() => handleRemindMe('1 hour')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200">In 1 hour</button>
                                    <button onClick={() => handleRemindMe('3 hours')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-50 dark:border-gray-700">In 3 hours</button>
                                    <button onClick={() => handleRemindMe('tomorrow')} className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 border-t border-gray-50 dark:border-gray-700">Tomorrow</button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Regenerate Button Dropdown */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowRegenerateMenu(!showRegenerateMenu)}
                            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 px-5 py-2.5 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-700 flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95 min-w-[160px] justify-between"
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
                                    className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20"
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
              
              {/* Image Generation Section */}
              <div className="mb-10 w-full flex flex-col md:flex-row gap-6 items-stretch">
                 <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-[2rem] p-6 border border-white/60 dark:border-white/10 shadow-lg backdrop-blur-sm flex flex-col justify-center items-center flex-grow relative overflow-hidden">
                     {!generatedImage ? (
                         <div className="text-center z-10">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Need a Visual Aid?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs mx-auto">Generate a custom emoji or sticker that perfectly captures this feeling.</p>
                            <button 
                                onClick={generateVisualAid}
                                disabled={isGeneratingImage}
                                className="bg-white dark:bg-gray-800 px-5 py-2.5 rounded-full text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 shadow-sm border border-indigo-100 dark:border-indigo-700 flex items-center gap-2 mx-auto disabled:opacity-50 transition-all hover:scale-105"
                            >
                                {isGeneratingImage ? <RefreshCw className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                                {isGeneratingImage ? "Creating..." : "Generate Sticker"}
                            </button>
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
                     
                     {/* Decorative background blobs */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                     <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-200/20 rounded-full blur-2xl -ml-5 -mb-5"></div>
                 </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 auto-rows-fr">
                {replies.map((reply, idx) => (
                   <ReplyCard 
                     key={idx} 
                     reply={reply} 
                     index={idx} 
                     onRegenerateSpecific={regenerateSpecific}
                     onRegenerateAll={regenerateAllShortcut}
                     isFocused={focusedReplyIndex === idx}
                   />
                ))}
              </div>
              
              {replies.length > 0 && (
                  <div className="text-center mt-6 text-xs text-gray-400 dark:text-gray-500">
                      Tip: Use Arrow keys to navigate, <span className="bg-gray-200 dark:bg-gray-700 px-1 rounded">Ctrl+C</span> to copy
                  </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 text-center text-gray-400 dark:text-gray-500 text-sm relative z-10 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-black/30 backdrop-blur-sm mt-auto">
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
               <button onClick={() => setActiveModal('privacy')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Privacy Policy</button>
               <button onClick={() => setActiveModal('terms')} className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Terms of Service</button>
               <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
               <a href="https://github.com/MustafaMiyaji" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2 group"><Github size={16} className="group-hover:scale-110 transition-transform" /> GitHub</a>
               <a href="https://www.linkedin.com/in/mustafa-alimiyaji-195742327/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-2 group"><Linkedin size={16} className="group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400" /> LinkedIn</a>
            </div>
            
            <div className="text-center">
                <p className="font-semibold text-gray-600 dark:text-gray-400 tracking-wide text-xs uppercase mb-2">Powered by Gemini 3.0</p>
                <p className="text-gray-500 dark:text-gray-500 text-sm flex items-center justify-center gap-1.5">
                   Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> by <span className="font-medium text-gray-700 dark:text-gray-300">Mustafa Miyaji</span>
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;