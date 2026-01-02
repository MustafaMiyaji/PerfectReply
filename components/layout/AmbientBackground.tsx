import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const AmbientBackground: React.FC = () => {
  // Generate random particles for a dynamic background
  const [particles, setParticles] = useState<Array<{x: number, y: number, size: number, duration: number, delay: number}>>([]);
  
  // Mouse interaction
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // Client-side generation to avoid hydration mismatch
    const newParticles = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1, // Smaller, stardust like
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);

    const handleMove = (e: MouseEvent) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#FAFAFC] dark:bg-[#0b0f1a] transition-colors duration-700">
      {/* Aurora / Silk Curtains */}
      <div className="absolute inset-0 opacity-60 dark:opacity-30">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-r from-indigo-200/40 to-purple-200/40 dark:from-indigo-900/20 dark:to-purple-900/20 blur-[80px] dark:blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-pink-200/40 to-rose-200/40 dark:from-pink-900/20 dark:to-rose-900/20 blur-[80px] dark:blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-blue-200/40 to-cyan-200/40 dark:from-blue-900/20 dark:to-cyan-900/20 blur-[80px] dark:blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
          
          {/* Subtle moving diagonal beams */}
          <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#6366f108_50%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#00000000_50%,#6366f105_50%)] animate-[spin_20s_linear_infinite] scale-[2] opacity-40 dark:opacity-30"></div>
      </div>

      {/* Floating Particles (Stardust) */}
      {particles.map((p, i) => (
        <Particle key={i} p={p} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
};

const Particle = ({ p, mouseX, mouseY }: any) => {
    const x = useSpring(0, { stiffness: 50, damping: 20 });
    const y = useSpring(0, { stiffness: 50, damping: 20 });

    useEffect(() => {
        const unsubscribeX = mouseX.on("change", (latestX: number) => {
            const shiftX = (latestX / window.innerWidth - 0.5) * 20; 
            x.set(shiftX);
        });
        const unsubscribeY = mouseY.on("change", (latestY: number) => {
            const shiftY = (latestY / window.innerHeight - 0.5) * 20;
            y.set(shiftY);
        });
        return () => { unsubscribeX(); unsubscribeY(); };
    }, []);

    return (
        <motion.div
          className="absolute rounded-full bg-indigo-300/40 dark:bg-white/50"
          initial={{ left: `${p.x}vw`, top: `${p.y}vh`, opacity: 0 }}
          style={{ 
              width: p.size, 
              height: p.size,
              x, 
              y
          }}
          animate={{ 
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
        />
    )
}