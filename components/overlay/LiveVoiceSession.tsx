import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, User, Bot, AlertTriangle, Settings, RefreshCcw, X } from 'lucide-react';
import { ChatAnalysis } from '../../types';
import { base64ToBytes, pcmToAudioBuffer } from '../../services/geminiService';

interface LiveVoiceSessionProps {
    analysis: ChatAnalysis;
    onEndCall: () => void;
    onTranscript?: (role: 'user' | 'model', text: string) => void;
}

const VOICES = ['Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir'];

// Canvas Waveform Visualizer
const AudioVisualizer = ({ analyser, isMuted }: { analyser: AnalyserNode | null, isMuted: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !analyser) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        let animationId: number;

        const draw = () => {
            animationId = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = 60; // Base radius

            if (isMuted) {
                // Draw static circle when muted
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 2;
                ctx.stroke();
                return;
            }

            // Draw organic blobs based on frequency
            for(let layer = 0; layer < 3; layer++) {
                ctx.beginPath();
                const sliceAngle = (Math.PI * 2) / 60;
                
                for (let i = 0; i < 60; i++) {
                    const value = dataArray[i * 2]; // Sample frequencies
                    const normalized = value / 255;
                    // Vary radius based on frequency and layer
                    const r = radius + (normalized * (30 + layer * 20)); 
                    const angle = i * sliceAngle + (Date.now() / 1000) * (layer % 2 === 0 ? 1 : -1);
                    
                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        // Smooth curves
                        const prevAngle = (i - 1) * sliceAngle + (Date.now() / 1000) * (layer % 2 === 0 ? 1 : -1);
                        const prevValue = dataArray[(i - 1) * 2] / 255;
                        const prevR = radius + (prevValue * (30 + layer * 20));
                        const prevX = centerX + Math.cos(prevAngle) * prevR;
                        const prevY = centerY + Math.sin(prevAngle) * prevR;
                        
                        const cpX = (prevX + x) / 2;
                        const cpY = (prevY + y) / 2;
                        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
                    }
                }
                ctx.closePath();
                
                // Color gradients
                const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2);
                if (layer === 0) {
                    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.8)'); // Indigo
                    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
                } else if (layer === 1) {
                    gradient.addColorStop(0, 'rgba(236, 72, 153, 0.5)'); // Pink
                    gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
                } else {
                    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.3)'); // Purple
                    gradient.addColorStop(1, 'rgba(168, 85, 247, 0)');
                }
                
                ctx.fillStyle = gradient;
                ctx.fill();
                ctx.strokeStyle = layer === 0 ? 'rgba(255,255,255,0.4)' : 'transparent';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        };

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [analyser, isMuted]);

    return <canvas ref={canvasRef} width={400} height={400} className="w-full h-full" />;
};

export const LiveVoiceSession: React.FC<LiveVoiceSessionProps> = ({ analysis, onEndCall, onTranscript }) => {
    const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected' | 'permission_denied'>('connecting');
    const [selectedVoice, setSelectedVoice] = useState('Zephyr');
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Transcription State buffers
    const currentInputTransRef = useRef('');
    const currentOutputTransRef = useRef('');

    // Audio Context & State
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const inputAudioCtxRef = useRef<AudioContext | null>(null);
    const outputAudioCtxRef = useRef<AudioContext | null>(null);
    const inputStreamRef = useRef<MediaStream | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
    
    // Playback state
    const nextStartTimeRef = useRef<number>(0);
    const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    useEffect(() => {
        startSession();
        return () => stopSession();
    }, []);

    // Helper to create PCM blob from Float32
    const createPcmBlob = (data: Float32Array): { data: string, mimeType: string } => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            int16[i] = Math.max(-1, Math.min(1, data[i])) * 32768; // Clamp and scale
        }
        
        let binary = '';
        const bytes = new Uint8Array(int16.buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return {
            data: btoa(binary),
            mimeType: 'audio/pcm;rate=16000',
        };
    };

    const startSession = async () => {
        try {
            setStatus('connecting');
            setErrorMessage(null);
            
            // Check for API Key
            if (!process.env.API_KEY) {
                throw new Error("API Key missing. Please restart.");
            }

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            // 1. Initialize Audio Contexts
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            inputAudioCtxRef.current = new AudioContext({ sampleRate: 16000 });
            outputAudioCtxRef.current = new AudioContext({ sampleRate: 24000 });
            
            // 2. Setup Mic Stream with robust error handling
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (err: any) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setStatus('permission_denied');
                    return;
                }
                throw err;
            }
            inputStreamRef.current = stream;

            // 3. Setup Gemini Live Session
            const systemInstruction = `
                You are roleplaying as the user's partner. 
                Partner Style: ${analysis.partnerStyle}.
                Traits: Empathy ${analysis.personalityMetrics.empathy}/100, Humor ${analysis.personalityMetrics.humor}/100.
                Mimic these habits: ${analysis.mimicryPatterns || "Speak casually."}.
                Context: ${analysis.summary}.
                Speak naturally, with emotion (laughter, sighs, tone changes) matching the context.
                Do NOT act like an AI. Act exactly like the partner described.
            `;

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        console.log("Gemini Live Connected");
                        setStatus('connected');
                        
                        if(!inputAudioCtxRef.current) return;
                        
                        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
                        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
                        
                        // Input Analyser for Visualizer
                        const analyser = inputAudioCtxRef.current.createAnalyser();
                        analyser.fftSize = 512;
                        analyser.smoothingTimeConstant = 0.5;
                        source.connect(analyser);
                        analyserRef.current = analyser;
                        setAnalyserNode(analyser);
                        
                        processor.onaudioprocess = (e) => {
                            if (isMicMuted) return; 
                            
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createPcmBlob(inputData);
                            
                            sessionPromiseRef.current?.then(session => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        source.connect(processor);
                        processor.connect(inputAudioCtxRef.current.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        // Handle Transcriptions
                        if (msg.serverContent?.outputTranscription) {
                            const text = msg.serverContent.outputTranscription.text;
                            currentOutputTransRef.current += text;
                        } else if (msg.serverContent?.inputTranscription) {
                            const text = msg.serverContent.inputTranscription.text;
                            currentInputTransRef.current += text;
                        }

                        if (msg.serverContent?.turnComplete) {
                            if (currentInputTransRef.current && onTranscript) {
                                onTranscript('user', currentInputTransRef.current);
                                currentInputTransRef.current = '';
                            }
                            if (currentOutputTransRef.current && onTranscript) {
                                onTranscript('model', currentOutputTransRef.current);
                                currentOutputTransRef.current = '';
                            }
                        }

                        // Handle Audio Output
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioCtxRef.current) {
                            const ctx = outputAudioCtxRef.current;
                            const buffer = await pcmToAudioBuffer(base64ToBytes(audioData), ctx);
                            
                            const source = ctx.createBufferSource();
                            source.buffer = buffer;
                            source.connect(ctx.destination);
                            
                            const now = ctx.currentTime;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += buffer.duration;
                            
                            scheduledSourcesRef.current.add(source);
                            source.onended = () => {
                                scheduledSourcesRef.current.delete(source);
                            };
                        }
                        
                        if (msg.serverContent?.interrupted) {
                            scheduledSourcesRef.current.forEach(s => s.stop());
                            scheduledSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                            // Reset transcripts on interrupt to avoid stale fragments
                            currentOutputTransRef.current = ''; 
                        }
                    },
                    onclose: () => {
                        console.log("Gemini Live Closed");
                        if (status !== 'error') setStatus('disconnected');
                    },
                    onerror: (e) => {
                        console.error("Gemini Live Error", e);
                        setErrorMessage(e.message || "Connection failed");
                        setStatus('error');
                    }
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } }
                    },
                    systemInstruction: systemInstruction,
                    // Enable Transcription
                    inputAudioTranscription: {},
                    outputAudioTranscription: {}
                }
            });

        } catch (e: any) {
            console.error("Failed to start session", e);
            setErrorMessage(e.message || "Failed to initialize audio session");
            setStatus('error');
        }
    };

    const stopSession = () => {
        if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
        if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
        if (inputStreamRef.current) inputStreamRef.current.getTracks().forEach(t => t.stop());
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
        }
    };

    const toggleMute = () => setIsMicMuted(!isMicMuted);

    const retryConnection = () => {
        stopSession();
        setTimeout(startSession, 500);
    };

    return (
        <div className="flex flex-col h-full bg-black relative overflow-hidden font-sans">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] transition-opacity duration-1000 ${status === 'connected' ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>

            {/* Error Overlay */}
            <AnimatePresence>
                {(status === 'permission_denied' || status === 'error') && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60"
                    >
                        <div className="bg-gray-900 border border-red-500/30 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-white font-bold text-xl mb-2">
                                {status === 'permission_denied' ? "Microphone Access Denied" : "Connection Error"}
                            </h3>
                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {status === 'permission_denied' 
                                    ? "We need your microphone to hear you. Please allow access in your browser settings." 
                                    : errorMessage || "Something went wrong connecting to the AI."}
                            </p>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={retryConnection}
                                    className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCcw size={18} /> Try Again
                                </button>
                                <button 
                                    onClick={onEndCall}
                                    className="w-full bg-gray-800 text-white font-medium py-3 rounded-xl hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative z-10 flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-yellow-500'}`}></div>
                    <span className="text-white/80 font-bold tracking-widest uppercase text-[10px]">
                        {status === 'connected' ? 'Live Session' : 'Initializing...'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                        <User size={12} className="text-indigo-400" />
                        <span className="text-white/60 text-[10px] uppercase font-bold">{selectedVoice}</span>
                    </div>
                    <button onClick={onEndCall} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="relative z-10 flex-grow flex flex-col items-center justify-center">
                <div className="relative w-80 h-80 flex items-center justify-center">
                    {/* Visualizer Canvas */}
                    <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen">
                        <AudioVisualizer analyser={analyserNode} isMuted={isMicMuted} />
                    </div>
                    
                    {/* Central Avatar / Status */}
                    <motion.div 
                        className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-b from-gray-900 to-black border border-white/10 flex items-center justify-center shadow-2xl"
                        animate={{
                            boxShadow: status === 'connected' ? "0 0 50px rgba(99, 102, 241, 0.3)" : "none",
                            scale: isMicMuted ? 0.95 : 1
                        }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10"></div>
                        <Bot size={48} className="text-white/80" />
                    </motion.div>
                </div>

                {/* Status Text */}
                <div className="mt-8 text-center space-y-2 max-w-md px-6">
                    <h2 className="text-2xl font-serif text-white font-bold tracking-tight">
                        {analysis.partnerStyle || "Your Partner"}
                    </h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={status}
                        className="text-indigo-300/60 text-sm font-medium tracking-wide uppercase"
                    >
                        {status === 'connected' ? (isMicMuted ? "Microphone Muted" : "Listening...") : "Connecting..."}
                    </motion.p>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="relative z-10 p-8 pb-10 flex justify-center items-center gap-8">
                {/* Voice Setting (Hidden on mobile for cleaner UI, could be modal) */}
                <div className="absolute left-8 bottom-10 hidden md:block group">
                    <button className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5">
                        <Settings size={20} />
                    </button>
                    {/* Dropdown */}
                    <div className="absolute bottom-full left-0 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-2 w-32 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto shadow-xl">
                        {VOICES.map(v => (
                            <button 
                                key={v}
                                onClick={() => {
                                    setSelectedVoice(v);
                                    retryConnection();
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-lg text-xs font-bold ${selectedVoice === v ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleMute}
                    className={`
                        w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border
                        ${isMicMuted 
                            ? 'bg-white text-black border-white shadow-white/20' 
                            : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                        }
                    `}
                >
                    {isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </motion.button>

                <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={onEndCall}
                    className="w-20 h-20 bg-red-500 hover:bg-red-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-red-500/30 transform transition-all border border-red-400"
                >
                    <PhoneOff size={32} />
                </motion.button>
            </div>
        </div>
    );
};