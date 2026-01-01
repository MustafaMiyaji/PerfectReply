import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useMotionValue, useTransform, useScroll } from 'framer-motion';

// --- VISUALS ---

// 1. Noise Texture Overlay
export const NoiseOverlay = () => (
  <div className="fixed inset-0 z-[9999] pointer-events-none opacity-[0.03] dark:opacity-[0.04] mix-blend-overlay" 
       style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
  </div>
);

// 2. Custom Magnetic Cursor
export const CustomCursor = () => {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <motion.div
      className="fixed left-0 top-0 w-8 h-8 rounded-full border-2 border-indigo-500/50 pointer-events-none z-[10000] hidden md:block mix-blend-difference"
      style={{ x: cursorXSpring, y: cursorYSpring }}
    />
  );
};

// 3. Spotlight Card Wrapper
export const SpotlightCard = ({ children, className = "", spotlightColor = "rgba(255,255,255,0.25)" }: any) => {
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
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
};

// 4. Shimmer Skeleton Loader
export const SkeletonCard = () => (
  <div className="bg-white/40 dark:bg-gray-800/40 rounded-[2rem] p-8 h-64 w-full relative overflow-hidden border border-white/20">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
    <div className="space-y-3">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
    </div>
    <div className="mt-8 flex gap-2">
       <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
       <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
    </div>
  </div>
);

// 5. Scroll Progress Bar
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 origin-left z-[100]"
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
        setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
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
    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-700 z-0 mix-blend-soft-light overflow-hidden rounded-[2rem]">
        <div className="absolute inset-[-100%] bg-gradient-to-br from-transparent via-white/40 to-transparent rotate-45 animate-[shimmer_3s_infinite]" />
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

// 11. Sonic Branding (Sound Effects)
export const playSound = (type: 'hover' | 'click' | 'success') => {
    if (typeof window === 'undefined') return;
    
    // Create audio context only when user interacts
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'hover') {
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'click') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1); // Major third
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
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
