import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Sparkles, MessageCircle, Heart, Search, ArrowRight, Loader2, Copy, CheckCircle2, MessageSquare, Send, Play, Square } from 'lucide-react';
import { FileWithId, IcebreakerSuggestion, GeneratedReply } from '../../types';
import { generateIcebreakers, generateReplies, generateSpeech, pcmToAudioBuffer } from '../../services/geminiService';
import { MiniAudioVisualizer } from '../ui/Visuals';

interface DatingProfileAnalyzerProps {
  onClose: () => void;
  initialFiles: FileWithId[];
}

export const DatingProfileAnalyzer: React.FC<DatingProfileAnalyzerProps> = ({ onClose, initialFiles }) => {
  const [step, setStep] = useState<'upload' | 'generating' | 'results' | 'chat'>('upload');
  const [profileFiles, setProfileFiles] = useState<File[]>(initialFiles.map(f => f.file));
  const [bioText, setBioText] = useState('');
  const [suggestions, setSuggestions] = useState<IcebreakerSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Chat Extension State
  const [theyReplied, setTheyReplied] = useState('');
  const [chatReplies, setChatReplies] = useState<GeneratedReply[]>([]);
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);

  // Audio State
  const [playingId, setPlayingId] = useState<string | null>(null); // Format: 'suggestion-0' or 'reply-0'
  const [isAudioLoadingId, setIsAudioLoadingId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
      return () => {
          if (sourceRef.current) sourceRef.current.stop();
          if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') audioCtxRef.current.close();
      };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setProfileFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleGenerate = async () => {
    if (profileFiles.length === 0 && !bioText.trim()) {
        setError("Please upload a profile screenshot or paste their bio.");
        return;
    }
    setError(null);
    setStep('generating');
    try {
        const results = await generateIcebreakers(profileFiles, bioText);
        setSuggestions(results);
        setStep('results');
    } catch (err) {
        setError("Couldn't analyze the profile. Try a clearer screenshot.");
        setStep('upload');
    }
  };

  const handleReplyGeneration = async () => {
      if (!theyReplied.trim()) return;
      setIsGeneratingReply(true);
      
      try {
          const mockAnalysis = {
              summary: "Continuing conversation from profile match.",
              tags: ["Dating App"],
              partnerStyle: "Interested",
              redFlags: [],
              personalityMetrics: {
                  empathy: 50,
                  aggression: 10,
                  humor: 60,
                  vulnerability: 40,
                  clarity: 80
              }
          };
          
          const history = `CONTEXT: User sent an opener based on profile. \n PARTNER REPLIED: "${theyReplied}"`;
          
          const results = await generateReplies(
              mockAnalysis, 
              'Spark', // Default vibe
              null, 
              50, 
              profileFiles, 
              bioText, 
              "English", // Default language
              history
          );
          
          setChatReplies(results);
          setStep('chat');
      } catch (e) {
          setError("Failed to generate follow-up. Please try again.");
      } finally {
          setIsGeneratingReply(false);
      }
  }

  const copyText = (text: string, index: number) => {
      navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handlePlayAudio = async (text: string, id: string, tone: string) => {
      // Stop current playback
      if (sourceRef.current) {
          sourceRef.current.stop();
          sourceRef.current = null;
      }

      if (playingId === id) {
          setPlayingId(null);
          return;
      }

      setIsAudioLoadingId(id);

      try {
          // Initialize Audio Context
          if (!audioCtxRef.current) {
              audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          if (audioCtxRef.current.state === 'suspended') {
              await audioCtxRef.current.resume();
          }

          // Fetch Audio
          const audioData = await generateSpeech(text, tone);
          const buffer = await pcmToAudioBuffer(audioData, audioCtxRef.current);

          // Play
          const source = audioCtxRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtxRef.current.destination);
          
          source.onended = () => {
              setPlayingId(null);
              sourceRef.current = null;
          };

          source.start();
          sourceRef.current = source;
          setPlayingId(id);
      } catch (e) {
          console.error("Audio playback error", e);
      } finally {
          setIsAudioLoadingId(null);
      }
  };

  // Helper to map category to a speakable tone
  const getToneFromCategory = (cat: string) => {
      switch(cat) {
          case 'Playful': return 'Playful and flirty';
          case 'Direct': return 'Confident and direct';
          case 'Creative': return 'Intriguing and creative';
          case 'Observation': return 'Casual and observant';
          default: return 'Friendly';
      }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl overflow-y-auto"
    >
       <div className="max-w-4xl mx-auto min-h-screen p-4 md:p-8 pb-32 md:pb-40 flex flex-col relative">
           {/* Header */}
           <div className="flex justify-between items-center mb-8">
               <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 animate-pulse-slow">
                       <Heart size={20} className="text-white fill-white" />
                   </div>
                   <h2 className="font-serif text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Profile Analyzer</h2>
               </div>
               <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
               >
                   <X size={24} className="text-gray-500" />
               </button>
           </div>

           <AnimatePresence mode="wait">
               {step === 'upload' && (
                   <motion.div 
                     key="upload"
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: -20, opacity: 0 }}
                     className="flex-grow flex flex-col justify-center items-center max-w-2xl mx-auto w-full"
                   >
                       <h1 className="text-3xl md:text-5xl font-serif font-bold text-center mb-6 text-gray-900 dark:text-white">
                           Break the ice <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">instantly.</span>
                       </h1>
                       <p className="text-center text-gray-500 dark:text-gray-400 mb-10 text-lg">
                           Upload profile pics, video clips, or voice prompts. We'll analyze their vibe.
                       </p>

                       {/* Upload Area */}
                       <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-3xl p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-pink-500 dark:hover:border-pink-500 transition-all duration-300 group cursor-pointer relative overflow-hidden" onClick={() => document.getElementById('profile-upload')?.click()}>
                           <input 
                             id="profile-upload" 
                             type="file" 
                             multiple 
                             accept="image/*,video/*,audio/*" 
                             className="hidden" 
                             onChange={handleFileChange}
                           />
                           
                           {/* Hover Effect Background */}
                           <div className="absolute inset-0 bg-pink-50 dark:bg-pink-900/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                           
                           <div className="flex flex-col items-center gap-4 relative z-10">
                               <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform group-hover:shadow-pink-200 dark:group-hover:shadow-pink-900/30">
                                   <UploadCloud size={32} className="text-pink-500" />
                               </div>
                               <div className="text-center">
                                   {profileFiles.length > 0 ? (
                                       <div className="font-medium text-gray-900 dark:text-white">
                                           {profileFiles.length} file(s) selected
                                       </div>
                                   ) : (
                                       <div className="font-medium text-gray-900 dark:text-white">
                                           Click to upload media
                                       </div>
                                   )}
                                   <div className="text-sm text-gray-400 mt-1">or paste bio below</div>
                                   
                                   <div className="flex gap-2 justify-center mt-3 opacity-60 flex-wrap">
                                     {['JPG', 'PNG', 'MP4', 'MP3', 'WAV'].map(ext => (
                                       <span key={ext} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 rounded-md bg-white/50 dark:bg-black/20">
                                         {ext}
                                       </span>
                                     ))}
                                   </div>
                               </div>
                           </div>
                       </div>

                       {/* Bio Input */}
                       <div className="w-full mt-6">
                           <textarea 
                              placeholder="Or paste their bio / interests here..."
                              value={bioText}
                              onChange={(e) => setBioText(e.target.value)}
                              className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-pink-500 outline-none py-3 text-lg text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none transition-colors"
                              rows={2}
                           />
                       </div>

                       {error && <div className="text-red-500 mt-4 font-medium">{error}</div>}

                       <button 
                          onClick={handleGenerate}
                          disabled={profileFiles.length === 0 && !bioText.trim()}
                          className="mt-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-full font-bold text-lg flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl hover:shadow-2xl active:scale-95"
                       >
                           <Sparkles size={20} className="animate-pulse" /> Generate Openers
                       </button>
                   </motion.div>
               )}

               {step === 'generating' && (
                   <motion.div 
                        key="generating"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-grow flex flex-col items-center justify-center text-center"
                   >
                       <div className="relative w-32 h-32 mb-8">
                           {/* Radar Scan Effect */}
                           <div className="absolute inset-0 border-4 border-gray-100 dark:border-gray-800 rounded-full overflow-hidden">
                                <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent animate-scan opacity-50"></div>
                           </div>
                           <div className="absolute inset-0 border-4 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
                           <div className="absolute inset-0 flex items-center justify-center">
                                <Search className="text-pink-500 animate-pulse" size={32} />
                           </div>
                       </div>
                       <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Scanning Profile...</h3>
                       <p className="text-gray-500">Finding the perfect hook.</p>
                   </motion.div>
               )}

               {step === 'results' && (
                   <motion.div 
                     key="results"
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }}
                     className="flex-grow flex flex-col"
                   >
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                           {suggestions.map((item, idx) => {
                               const id = `suggestion-${idx}`;
                               const isPlaying = playingId === id;
                               const isLoadingAudio = isAudioLoadingId === id;
                               
                               return (
                               <motion.div 
                                 key={idx}
                                 initial={{ y: 50, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
                                 className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:border-pink-200 dark:hover:border-pink-900 transition-all group relative hover:-translate-y-1 hover:shadow-lg"
                               >
                                   <div className="flex flex-wrap justify-between items-start mb-4 gap-2">
                                       <span className={`
                                           text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm
                                           ${item.category === 'Observation' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                             item.category === 'Playful' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                             item.category === 'Direct' ? 'bg-pink-50 text-pink-600 border-pink-100' :
                                             'bg-orange-50 text-orange-600 border-orange-100'}
                                       `}>
                                           {item.category}
                                       </span>
                                       
                                       <div className="flex gap-2">
                                           <button
                                              onClick={() => handlePlayAudio(item.text, id, getToneFromCategory(item.category))}
                                              className={`p-2 rounded-full transition-colors flex items-center gap-1 ${isPlaying ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'text-gray-400 hover:text-pink-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                              disabled={isAudioLoadingId !== null && !isLoadingAudio}
                                           >
                                               {isLoadingAudio ? (
                                                   <Loader2 size={18} className="animate-spin" />
                                               ) : isPlaying ? (
                                                   <Square size={18} className="fill-current" />
                                               ) : (
                                                   <Play size={18} />
                                               )}
                                           </button>
                                           <button 
                                              onClick={() => copyText(item.text, idx)}
                                              className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2"
                                           >
                                               {copiedIndex === idx ? <CheckCircle2 size={18} className="text-green-500 animate-bounce" /> : <Copy size={18} />}
                                           </button>
                                       </div>
                                   </div>
                                   
                                   <div className="mb-4">
                                       <p className="font-serif text-xl font-medium text-gray-900 dark:text-white leading-relaxed selection:bg-pink-100">
                                           "{item.text}"
                                       </p>
                                       {isPlaying && <div className="mt-2 text-pink-500"><MiniAudioVisualizer isPlaying={true} /></div>}
                                   </div>
                                   
                                   <div className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                                       <MessageCircle size={16} className="mt-0.5 flex-shrink-0 text-pink-400" />
                                       <span className="italic">{item.whyItWorks}</span>
                                   </div>
                               </motion.div>
                           )})}
                       </div>
                       
                       {/* Chat Extension - Added mb-12 to ensure it doesn't hug bottom too tight before padding kicks in */}
                       <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-gray-100 dark:border-gray-700 shadow-xl mt-auto mb-4">
                           <h3 className="font-serif font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                               <MessageSquare className="text-pink-500" /> Did they reply?
                           </h3>
                           <div className="relative">
                               <input 
                                  type="text" 
                                  placeholder="Type what they said..." 
                                  className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-full px-6 py-4 pr-16 focus:ring-2 focus:ring-pink-500/20 text-gray-800 dark:text-white"
                                  value={theyReplied}
                                  onChange={(e) => setTheyReplied(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleReplyGeneration()}
                               />
                               <button 
                                  onClick={handleReplyGeneration}
                                  disabled={isGeneratingReply || !theyReplied.trim()}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-pink-500 hover:bg-pink-600 text-white p-2.5 rounded-full transition-all disabled:opacity-50 active:scale-95"
                               >
                                   {isGeneratingReply ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                               </button>
                           </div>
                       </div>

                       <div className="mt-6 text-center">
                           <button 
                              onClick={() => setStep('upload')}
                              className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium flex items-center justify-center gap-2 mx-auto transition-colors text-sm"
                           >
                               <ArrowRight size={16} className="rotate-180" /> Start Over
                           </button>
                       </div>
                   </motion.div>
               )}

               {step === 'chat' && (
                   <motion.div 
                     key="chat"
                     initial={{ opacity: 0 }} 
                     animate={{ opacity: 1 }}
                     className="flex-grow flex flex-col"
                   >
                        <div className="text-center mb-6">
                            <span className="inline-block px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                Round 2
                            </span>
                            <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Keep it going.</h2>
                        </div>

                        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 text-center italic text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            " {theyReplied} "
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-8">
                           {chatReplies.map((reply, idx) => {
                               const id = `reply-${idx}`;
                               const isPlaying = playingId === id;
                               const isLoadingAudio = isAudioLoadingId === id;

                               return (
                               <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center gap-4">
                                   <div className="flex-grow">
                                      <p className="font-serif text-lg text-gray-900 dark:text-white">{reply.text}</p>
                                      {isPlaying && <div className="mt-2 text-pink-500"><MiniAudioVisualizer isPlaying={true} /></div>}
                                   </div>
                                   <div className="flex gap-2 justify-end sm:justify-start">
                                       <button
                                          onClick={() => handlePlayAudio(reply.text, id, reply.tone)}
                                          className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300' : 'text-gray-400 hover:text-pink-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                          disabled={isAudioLoadingId !== null && !isLoadingAudio}
                                       >
                                           {isLoadingAudio ? <Loader2 size={20} className="animate-spin" /> : isPlaying ? <Square size={20} className="fill-current" /> : <Play size={20} />}
                                       </button>
                                       <button 
                                          onClick={() => copyText(reply.text, idx)}
                                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                                       >
                                           {copiedIndex === idx ? <CheckCircle2 size={20} className="text-green-500" /> : <Copy size={20} />}
                                       </button>
                                   </div>
                               </div>
                           )})}
                        </div>

                        <button 
                           onClick={() => setStep('results')}
                           className="mt-auto w-full py-4 text-gray-500 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Back to Openers
                        </button>
                   </motion.div>
               )}
           </AnimatePresence>
       </div>
    </motion.div>
  );
};