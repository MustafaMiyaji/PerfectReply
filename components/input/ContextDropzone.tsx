import React, { useRef, useState, useEffect } from 'react';
import { UploadCloud, X, Film, Mic, Music, GripVertical, Image as ImageIcon, Type, ClipboardPaste, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, Reorder, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FileWithId } from '../../types';
import { MediaPreviewModal } from '../ui/MediaPreviewModal';

interface ContextDropzoneProps {
  files: FileWithId[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (id: string) => void;
  onReorder: (files: FileWithId[]) => void;
  textContext: string;
  setTextContext: (text: string) => void;
  isAnalyzing?: boolean;
}

// 3D Tilt Card Component for File Previews
const TiltFileCard = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseX = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseY = useSpring(y, { stiffness: 300, damping: 30 });
    const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

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
    }

    return (
        <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className={className}
        >
            {children}
        </motion.div>
    )
}

export const ContextDropzone: React.FC<ContextDropzoneProps> = ({ 
  files, 
  onFilesAdded, 
  onFileRemove,
  onReorder,
  textContext,
  setTextContext,
  isAnalyzing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [pasteError, setPasteError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Hover Preview State
  const [hoveringFileId, setHoveringFileId] = useState<string | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [textContext, activeTab]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
      setActiveTab('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
      setActiveTab('upload');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextContext((textContext + " " + text).trim());
      setPasteError(false);
    } catch (err) {
      console.warn('Clipboard access denied, showing fallback UI');
      setPasteError(true);
      setTimeout(() => setPasteError(false), 4000);
    }
  };

  const getThumbnailUrl = (file: File) => URL.createObjectURL(file);

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Input Toggle Tabs */}
        <div className="flex justify-center mb-2 scale-90 md:scale-100 origin-center">
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-1.5 rounded-full flex relative shadow-sm border border-white/40 dark:border-gray-700">
                <motion.div 
                    className="absolute top-1.5 bottom-1.5 bg-white dark:bg-gray-700 rounded-full shadow-md z-0"
                    initial={false}
                    animate={{ 
                        left: activeTab === 'upload' ? '6px' : '50%', 
                        width: 'calc(50% - 6px)',
                        x: activeTab === 'text' ? '0%' : '0%'
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button 
                    onClick={() => setActiveTab('upload')}
                    className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${activeTab === 'upload' ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                    <span className="flex items-center gap-2"><UploadCloud size={16} /> Media</span>
                </button>
                <button 
                    onClick={() => setActiveTab('text')}
                    className={`relative z-10 px-6 md:px-8 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-colors duration-300 ${activeTab === 'text' ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                     <span className="flex items-center gap-2"><Type size={16} /> Text</span>
                </button>
            </div>
        </div>

        {/* MEDIA UPLOAD AREA */}
        <div className={`${activeTab === 'upload' ? 'block' : 'hidden'}`}>
            <div 
              className={`
                relative border-2 border-dashed rounded-[2.5rem] p-4 md:p-8 transition-all duration-300 cursor-pointer overflow-hidden
                flex flex-col items-center justify-center group/dropzone
                ${isDragging 
                  ? 'border-heartbeat-red bg-heartbeat-red/5 scale-[1.01] shadow-xl shadow-heartbeat-red/10' 
                  : 'border-gray-300/60 dark:border-gray-700 hover:border-heartbeat-red/40 dark:hover:border-heartbeat-red/40 bg-white/40 dark:bg-gray-800/30 hover:bg-white/60 dark:hover:bg-gray-800/50 hover:shadow-lg backdrop-blur-sm'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ minHeight: '250px' }}
            >
              {/* Scanning Laser Effect when analyzing */}
              {isAnalyzing && (
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[2.5rem]">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-scan opacity-60"></div>
                  </div>
              )}

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                multiple 
                accept="image/*,text/plain,video/*,audio/*"
                onChange={handleFileChange}
              />
              
              {files.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 md:gap-6 text-center p-4 md:p-6"
                >
                  <div className="relative group/icon scale-75 md:scale-100">
                    <div className="absolute inset-0 bg-heartbeat-red/20 rounded-[2rem] animate-pulse-slow opacity-0 group-hover/icon:opacity-100 transition-opacity"></div>
                    <div className={`
                      w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-center justify-center transition-all duration-500 ease-out relative z-10 border border-white/80 dark:border-white/10
                      ${isDragging ? 'scale-110 rotate-3 shadow-heartbeat-red/20' : 'group-hover/icon:scale-105 group-hover/icon:-rotate-2'}
                    `}>
                      <UploadCloud className="text-heartbeat-red drop-shadow-sm" size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-3">
                    <p className="font-serif text-2xl md:text-3xl text-gray-800 dark:text-gray-100 tracking-tight">
                      Drop files here
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm md:text-base leading-relaxed font-light">
                      Screenshots, recordings, or text logs.
                    </p>
                  </div>
                  
                  <div className="flex gap-2 md:gap-3 justify-center mt-2 md:mt-4 opacity-60 hover:opacity-100 transition-opacity flex-wrap">
                     {['JPG', 'PNG', 'MP4', 'MP3', 'WAV'].map(ext => (
                       <span key={ext} className="text-[9px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-md bg-white/40 dark:bg-black/20 backdrop-blur-sm shadow-sm">
                         {ext}
                       </span>
                     ))}
                  </div>
                </motion.div>
              ) : (
                <div className="relative w-full h-full min-h-[220px] md:min-h-[280px] flex items-center justify-center p-2 md:p-4">
                  <Reorder.Group 
                     axis="x" 
                     values={files} 
                     onReorder={onReorder} 
                     className="flex flex-wrap gap-3 md:gap-4 items-center justify-center w-full"
                     onClick={(e: React.MouseEvent) => e.stopPropagation()} 
                  >
                     <AnimatePresence>
                        {files.map((fileObj) => {
                           const isVideo = fileObj.file.type.startsWith('video/');
                           const isAudio = fileObj.file.type.startsWith('audio/');
                           
                           return (
                              <Reorder.Item 
                                 key={fileObj.id} 
                                 value={fileObj}
                                 initial={{ opacity: 0, scale: 0.8 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.5 }}
                                 whileDrag={{ scale: 1.1, zIndex: 20 }}
                                 className="relative"
                              >
                                 <TiltFileCard className="w-32 h-44 md:w-40 md:h-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border-4 border-white dark:border-gray-700 flex flex-col items-center group/card cursor-grab active:cursor-grabbing">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation(); 
                                     onFileRemove(fileObj.id);
                                   }}
                                   className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-700 text-gray-400 border border-gray-100 dark:border-gray-600 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-md z-50 group/delete hover:scale-110"
                                   title="Remove file"
                                 >
                                   <X size={12} strokeWidth={3} />
                                 </button>

                                 {/* File Preview */}
                                 <div 
                                    className="w-full h-full bg-gray-50 dark:bg-black rounded-lg overflow-hidden relative isolate"
                                    style={{ transform: "translateZ(20px)" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPreviewFile(fileObj.file);
                                    }}
                                    onMouseEnter={() => isVideo && setHoveringFileId(fileObj.id)}
                                    onMouseLeave={() => isVideo && setHoveringFileId(null)}
                                 >
                                     {isVideo ? (
                                         <>
                                            {hoveringFileId === fileObj.id ? (
                                                <video 
                                                    src={getThumbnailUrl(fileObj.file)}
                                                    className="w-full h-full object-cover"
                                                    autoPlay
                                                    muted
                                                    loop
                                                    playsInline
                                                />
                                            ) : (
                                                <>
                                                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center"></div>
                                                    <div className="absolute inset-0 bg-black/20 z-10"></div>
                                                    <Film size={24} className="text-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />
                                                </>
                                            )}
                                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded text-[9px] font-bold text-white z-30 flex items-center gap-1">
                                                <Film size={8} /> VIDEO
                                            </div>
                                         </>
                                     ) : isAudio ? (
                                         <>
                                            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 flex flex-col items-center justify-center relative overflow-hidden group-hover/card:scale-110 transition-transform duration-500">
                                                <div className="absolute w-20 h-20 bg-purple-400 rounded-full blur-xl opacity-30 animate-pulse-slow"></div>
                                                <Mic size={32} className="text-purple-500 dark:text-purple-300 relative z-10" />
                                                <span className="text-[10px] font-bold mt-2 uppercase text-purple-600 dark:text-purple-300 tracking-wider">Audio</span>
                                            </div>
                                            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-purple-600/80 backdrop-blur-md rounded text-[9px] font-bold text-white z-30 flex items-center gap-1">
                                                <Music size={8} /> AUDIO
                                            </div>
                                         </>
                                     ) : (
                                         <img 
                                           src={getThumbnailUrl(fileObj.file)} 
                                           alt="preview" 
                                           className="w-full h-full object-cover pointer-events-none" 
                                         />
                                     )}
                                     
                                     {/* Drag Handle Indicator */}
                                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/card:opacity-100 transition-opacity bg-black/20 p-2 rounded-full backdrop-blur-sm z-40 pointer-events-none">
                                        <GripVertical size={20} className="text-white" />
                                     </div>
                                 </div>
                                 
                                 <div className="w-full bg-white dark:bg-gray-800 pt-2 pb-1 px-2 flex flex-col items-center" style={{ transform: "translateZ(10px)" }}>
                                   <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[90%]">
                                     {fileObj.file.name}
                                   </span>
                                 </div>
                                 </TiltFileCard>
                              </Reorder.Item>
                           );
                        })}
                     </AnimatePresence>
                     
                     {/* Add More Button */}
                     <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-20 md:w-20 h-44 md:h-52 flex items-center justify-center"
                     >
                        <button 
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-400 hover:bg-white dark:hover:bg-gray-800 transition-all"
                            title="Add more files"
                        >
                            <UploadCloud size={20} />
                        </button>
                     </motion.div>
                  </Reorder.Group>
                  
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-gray-800/90 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm pointer-events-none z-0 border border-white/50 dark:border-gray-600 whitespace-nowrap">
                    {files.length} file{files.length > 1 ? 's' : ''} added • Drag to reorder
                  </div>
                </div>
              )}
            </div>
        </div>

        {/* TEXT INPUT AREA */}
        <div className={`${activeTab === 'text' ? 'block' : 'hidden'} relative group`}>
             <div className="absolute inset-0 bg-gradient-to-r from-pink-200/20 to-purple-200/20 dark:from-pink-900/10 dark:to-purple-900/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             
             <div className="relative bg-white/40 dark:bg-gray-800/30 border border-white/60 dark:border-gray-700 rounded-[2rem] shadow-inner backdrop-blur-sm overflow-hidden transition-all focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30">
                 {/* Text Actions Toolbar */}
                 <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-gray-700 bg-white/20 dark:bg-black/20">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pl-2">Manual Input</span>
                    <div className="flex gap-2 items-center relative">
                        {pasteError && (
                          <motion.span 
                            initial={{ opacity: 0, x: 10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-red-500 font-medium mr-2 flex items-center gap-1"
                          >
                            <AlertCircle size={12} /> Use Ctrl+V
                          </motion.span>
                        )}
                        <button onClick={handlePaste} className="p-1.5 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Paste from clipboard">
                            <ClipboardPaste size={16} />
                        </button>
                        {textContext.length > 0 && (
                            <button onClick={() => setTextContext('')} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors" title="Clear text">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                 </div>

                <textarea 
                  ref={textareaRef}
                  placeholder="Paste chat logs, typed context, or specific details here (e.g. 'We met at a coffee shop and he said...')" 
                  className="w-full bg-transparent border-none p-4 md:p-6 resize-none min-h-[220px] md:min-h-[250px] placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm md:text-base focus:ring-0 focus:outline-none custom-scrollbar leading-relaxed overflow-hidden text-gray-800 dark:text-gray-200"
                  value={textContext}
                  onChange={(e) => setTextContext(e.target.value)}
                />
                
                {/* Footer Status Bar */}
                <div className="px-4 md:px-6 py-3 bg-white/30 dark:bg-black/20 border-t border-white/30 dark:border-gray-700 flex justify-between items-center">
                   <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {textContext.length === 0 ? "Ready for input" : "Typing..."}
                   </div>
                   
                   <div className="flex items-center gap-3">
                       <span className="text-xs font-mono font-medium text-gray-400 dark:text-gray-500">
                           {textContext.length} chars
                       </span>
                   </div>
                </div>
             </div>
        </div>
      </div>

      <AnimatePresence>
        {previewFile && (
          <MediaPreviewModal 
            file={previewFile} 
            onClose={() => setPreviewFile(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};