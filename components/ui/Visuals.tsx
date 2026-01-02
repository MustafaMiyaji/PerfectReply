import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform, useScroll, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Fingerprint, Zap } from 'lucide-react';

// --- VISUALS ---

// 1. Noise Texture Overlay (Subtler)
export const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay" 
       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
  </div>
);

// 3. Spotlight Card Wrapper (Improved Liquid Feel)
export const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(255,255,255,0.15)" }: any) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

// 4. Shimmer Skeleton Loader (Liquid)
export const SkeletonCard = () => (
  <div className="glass-panel rounded-[2rem] p-8 h-64 w-full relative overflow-hidden border border-white/20 dark:border-white/5">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent skew-x-12"></div>
    <div className="h-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-full w-1/4 mb-6 backdrop-blur-sm"></div>
    <div className="space-y-4">
      <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full w-full backdrop-blur-sm"></div>
      <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full w-5/6 backdrop-blur-sm"></div>
      <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full w-4/6 backdrop-blur-sm"></div>
    </div>
    <div className="mt-8 flex gap-3">
       <div className="h-10 w-28 bg-gray-200/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm"></div>
       <div className="h-10 w-10 bg-gray-200/50 dark:bg-gray-700/50 rounded-full backdrop-blur-sm"></div>
    </div>
  </div>
);

// 5. Scroll Progress Bar (Gradient)
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[100] shadow-[0_0_10px_rgba(168,85,247,0.5)]"
      style={{ scaleX: scrollYProgress }}
    />
  );
};

// 6. Meteors Effect
export const Meteors = ({ number = 20 }: { number?: number }) => {
  const [meteors, setMeteors] = useState<Array<{ left: number; top: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const styles = document.createElement("style");
    styles.innerHTML = `
      @keyframes meteor {
        0% { transform: rotate(215deg) translateX(0); opacity: 1; }
        70% { opacity: 1; }
        100% { transform: rotate(215deg) translateX(-500px); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);

    const generatedMeteors = new Array(number).fill(true).map(() => ({
      left: Math.floor(Math.random() * 100), // percentage
      top: -Math.floor(Math.random() * 20 + 10), // start above screen
      delay: Math.random() * 10 + 0.2,
      duration: Math.floor(Math.random() * 8 + 2),
    }));
    setMeteors(generatedMeteors);
    
    return () => { document.head.removeChild(styles); }
  }, [number]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {meteors.map((el, idx) => (
        <span
          key={"meteor" + idx}
          className="absolute h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]
          before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent"
          style={{
            top: el.top + "%",
            left: el.left + "%",
            animation: `meteor ${el.duration}s linear infinite`,
            animationDelay: `${el.delay}s`,
          }}
        ></span>
      ))}
    </div>
  );
};

// 7. Magnetic Button Wrapper
export const MagneticWrapper = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouse = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { height, width, left, top } = ref.current!.getBoundingClientRect();
        const middleX = clientX - (left + width / 2);
        const middleY = clientY - (top + height / 2);
        setPosition({ x: middleX * 0.15, y: middleY * 0.15 });
    };

    const reset = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;
    return (
        <motion.div
            ref={ref}
            className={className}
            animate={{ x, y }}
            transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
        >
            {children}
        </motion.div>
    );
};

// 8. Staggered Text Reveal
export const TextReveal = ({ text, className = "" }: { text: string, className?: string }) => {
    const words = text.split(" ");
    return (
        <span className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                    className="inline-block mr-2"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
};

// 9. Holographic Overlay (Premium Card Effect)
export const HolographicOverlay = () => (
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0 overflow-hidden rounded-[inherit] mix-blend-soft-light">
        <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_4s_linear_infinite] opacity-30 mix-blend-overlay blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10" />
    </div>
);

// 10. Mini Audio Visualizer for TTS
export const MiniAudioVisualizer = ({ isPlaying }: { isPlaying: boolean }) => {
    return (
        <div className="flex items-end gap-0.5 h-3">
            {[...Array(4)].map((_, i) => (
                <motion.div
                    key={i}
                    className="w-1 bg-current rounded-full"
                    animate={{
                        height: isPlaying ? [4, 12, 4] : 4,
                    }}
                    transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.1,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    )
}

// 11. Sonic Branding (Web Audio API Sound Effects)
const audioCtxCache: { ctx: AudioContext | null } = { ctx: null };

export const playSound = (type: 'hover' | 'click' | 'success' | 'on' | 'glass-tap' | 'whoosh') => {
    if (typeof window === 'undefined') return;
    
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    if (!audioCtxCache.ctx) {
        audioCtxCache.ctx = new AudioContext();
    }
    const ctx = audioCtxCache.ctx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;

    if (type === 'hover') {
        // Subtle air swipe
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(450, now + 0.05);
        gain.gain.setValueAtTime(0.005, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start();
        osc.stop(now + 0.05);
    } else if (type === 'click') {
        // Soft bubble pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
    } else if (type === 'glass-tap') {
        // High frequency glass ping
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start();
        osc.stop(now + 0.15);
    } else if (type === 'whoosh') {
        // Low frequency transition
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.2);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start();
        osc.stop(now + 0.2);
    } else if (type === 'success') {
        // Melodic success chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start();
        osc.stop(now + 0.4);
        
        // Second harmony note
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.05); // E5
        gain2.gain.setValueAtTime(0.02, now + 0.05);
        gain2.gain.linearRampToValueAtTime(0, now + 0.45);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.45);

    } else if (type === 'on') {
        // Startup sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 1);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.5);
        gain.gain.linearRampToValueAtTime(0, now + 1.5);
        osc.start();
        osc.stop(now + 1.5);
    }
};

// 12. Vibe Radar Chart
export const RadarChart = ({ metrics }: { metrics: any }) => {
    const width = 200;
    const height = 200;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 80;
    
    // Define axes
    const axes = ['empathy', 'aggression', 'humor', 'vulnerability', 'clarity'];
    const totalAxes = axes.length;
    
    // Calculate points for the polygon
    const points = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
        const value = (metrics[axis] || 0) / 100;
        const x = cx + radius * value * Math.cos(angle);
        const y = cy + radius * value * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    // Calculate axis lines
    const axisLines = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        return { x, y, label: axis };
    });

    return (
        <div className="relative flex justify-center items-center">
            <svg width={width} height={height} className="overflow-visible">
                {/* Background Web */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => (
                    <polygon
                        key={i}
                        points={axes.map((_, j) => {
                            const angle = (Math.PI * 2 * j) / totalAxes - Math.PI / 2;
                            const x = cx + radius * scale * Math.cos(angle);
                            const y = cy + radius * scale * Math.sin(angle);
                            return `${x},${y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth="1"
                    />
                ))}
                
                {/* Axis Lines */}
                {axisLines.map((pos, i) => (
                    <line key={i} x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke="currentColor" strokeOpacity="0.1" />
                ))}
                
                {/* Data Polygon */}
                <motion.polygon
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    transition={{ duration: 1, type: "spring" }}
                    points={points}
                    fill="rgba(99, 102, 241, 0.3)"
                    stroke="#6366f1"
                    strokeWidth="2"
                />
                
                {/* Labels */}
                {axisLines.map((pos, i) => {
                    const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                    // Push labels out a bit
                    const lx = cx + (radius + 20) * Math.cos(angle);
                    const ly = cy + (radius + 15) * Math.sin(angle);
                    return (
                        <text
                            key={i}
                            x={lx}
                            y={ly}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="text-[10px] uppercase font-bold fill-gray-500 dark:fill-gray-400"
                        >
                            {pos.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
};

// 13. Startup Screen
export const StartupScreen = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        playSound('on');
        const timer = setTimeout(onComplete, 2500);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div 
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center text-white"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
            onAnimationComplete={onComplete}
        >
            <div className="relative">
                <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="w-24 h-24 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(236,72,153,0.5)]"
                >
                    <Heart size={48} className="text-white fill-white" />
                </motion.div>
                {/* Rings */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-white/20"
                        initial={{ scale: 1, opacity: 0 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
                    />
                ))}
            </div>
            
            <div className="mt-8 text-center space-y-2">
                 <motion.h1 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl font-serif font-bold tracking-tight"
                 >
                    PerfectReply
                 </motion.h1>
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="h-0.5 bg-gradient-to-r from-transparent via-white to-transparent mx-auto max-w-[200px]"
                 />
                 <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 1 }}
                    className="text-sm font-light tracking-widest uppercase"
                 >
                    Initializing Empathy Engine...
                 </motion.p>
            </div>
        </motion.div>
    )
}