import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, PauseCircle, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Film, Mic, FileImage, PlayCircle } from 'lucide-react';

interface MediaPreviewModalProps {
  file: File;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({ file, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isEnded, setIsEnded] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setActiveUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isEnded) {
        videoRef.current.currentTime = 0;
        setIsEnded(false);
      }
      if (videoRef.current.paused) {
        videoRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      if (Number.isFinite(total) && total > 0) {
        setProgress((current / total) * 100);
        setDuration(total);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    if (videoRef.current && Number.isFinite(duration) && duration > 0) {
      const seekTo = (val / 100) * duration;
      if (Number.isFinite(seekTo)) {
        videoRef.current.currentTime = seekTo;
        setProgress(val);
        setIsEnded(false);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(console.error);
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isMedia = file.type.startsWith('video/') || file.type.startsWith('audio/');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-8"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative max-w-5xl w-full flex flex-col items-center justify-center outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-14 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all backdrop-blur-sm group border border-white/10 hover:border-white/30 z-50"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform" />
        </button>
        
        {/* Content Container */}
        <div 
          className="rounded-[2rem] overflow-hidden shadow-2xl bg-black border border-white/10 w-full max-h-[80vh] flex items-center justify-center relative group/player ring-1 ring-white/10"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          onClick={isMedia ? togglePlay : undefined}
        >
          {isMedia ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black cursor-pointer min-h-[300px]">
               {/* Audio Visualizer Placeholder */}
               {file.type.startsWith('audio/') && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black z-0">
                       <div className="relative">
                           <div className={`absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 ${isPlaying ? 'animate-pulse' : ''}`}></div>
                           <Mic size={64} className="text-indigo-400 relative z-10 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
                       </div>
                       <div className="mt-8 flex gap-1.5 items-end h-12">
                           {[...Array(16)].map((_, i) => (
                               <div 
                                  key={i} 
                                  className={`w-1.5 bg-indigo-500/60 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                                  style={{ 
                                      height: isPlaying ? `${Math.max(4, Math.random() * 40 + 10)}px` : '4px',
                                      animationDelay: `${i * 0.05}s` 
                                  }}
                               ></div>
                           ))}
                       </div>
                   </div>
               )}

               <video 
                  ref={videoRef}
                  src={activeUrl || ''} 
                  className={`w-full h-full object-contain ${file.type.startsWith('audio/') ? 'opacity-0 absolute' : 'max-h-[80vh]'}`}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => { setIsEnded(true); setIsPlaying(false); setShowControls(true); }}
                  playsInline
                  autoPlay
                />
                
                {/* Controls Overlay */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showControls || !isPlaying ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-32 pb-8 px-8 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                   {/* Seek Bar */}
                   <div className="relative w-full h-1.5 bg-white/20 rounded-full mb-6 cursor-pointer group/seek hover:h-2 transition-all">
                     <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }}></div>
                     <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={progress} 
                        onChange={handleSeek}
                        className="absolute top-[-6px] left-0 w-full h-5 opacity-0 cursor-pointer"
                     />
                     <div 
                        className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none ring-2 ring-indigo-500"
                        style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                     ></div>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors transform active:scale-95">
                          {isEnded ? <RotateCcw size={32} /> : isPlaying ? <PauseCircle size={32} /> : <Play size={32} className="ml-1 fill-white" />}
                        </button>
                        
                        <div className="flex items-center gap-3 group/vol">
                          <button onClick={toggleMute} className="text-white/80 hover:text-white">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                          </button>
                          <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={volume} 
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    if(videoRef.current) videoRef.current.volume = v;
                                    setIsMuted(v === 0);
                                }}
                                className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                             />
                          </div>
                        </div>

                        <span className="text-xs text-white/70 font-mono tracking-wider bg-white/10 px-2 py-1 rounded-md border border-white/5">
                          {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                      </div>

                      <button onClick={toggleFullscreen} className="text-white/80 hover:text-white active:scale-95 transition-transform">
                         {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                      </button>
                   </div>
                </motion.div>

                {/* Big Center Play Button */}
                {(!isPlaying && !isEnded) && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.3)] group-hover/player:scale-110 transition-transform duration-300">
                       <PlayCircle size={48} className="text-white fill-white/20 ml-1" />
                    </div>
                  </div>
                )}
                
                {/* Replay Overlay */}
                {isEnded && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-10">
                      <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300">
                          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                              <RotateCcw size={36} className="text-white" />
                          </div>
                          <span className="text-white font-bold tracking-widest text-sm uppercase">Replay</span>
                      </div>
                   </div>
                )}
            </div>
          ) : (
            <div className="bg-black w-full h-full flex items-center justify-center p-4">
                <img 
                  src={activeUrl || ''} 
                  alt="Full preview" 
                  className="max-h-[80vh] w-full object-contain shadow-2xl" 
                />
            </div>
          )}
        </div>
        
        {/* File Info Bar */}
        <div className="mt-6 flex items-center gap-4 text-white/90 bg-white/5 px-8 py-3 rounded-2xl backdrop-blur-xl border border-white/10 shadow-xl">
           <div className={`p-2 rounded-full ${file.type.startsWith('video/') ? 'bg-red-500/20 text-red-400' : file.type.startsWith('audio/') ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'}`}>
               {file.type.startsWith('video/') ? (
                   <Film size={18} /> 
               ) : file.type.startsWith('audio/') ? (
                   <Mic size={18} />
               ) : (
                   <FileImage size={18} />
               )}
           </div>
           <div className="flex flex-col">
               <span className="font-semibold tracking-wide text-sm">{file.name}</span>
               <span className="text-[10px] text-white/50 font-mono uppercase tracking-wider">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown Type'}</span>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};