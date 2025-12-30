import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VibeType, CustomVibeConfig } from '../../types';
import { Check, Palette, X, Zap, Heart, Shield, Smile, Star, Coffee, Ghost, Crown, Save, Trash2, ChevronDown } from 'lucide-react';
import { motion, useMotionTemplate, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

interface VibeSelectorProps {
  selectedVibe: VibeType | string;
  onSelect: (vibe: VibeType | string) => void;
  options: {
    type: VibeType;
    icon: React.ReactNode;
    label: string;
    desc: string;
    color: string;
  }[];
  customVibe: CustomVibeConfig | null;
  setCustomVibe: (vibe: CustomVibeConfig) => void;
}

// Map for dynamic icon rendering in Custom Vibe
const ICON_MAP: Record<string, React.ReactNode> = {
    'Palette': <Palette size={18} />,
    'Zap': <Zap size={18} />,
    'Heart': <Heart size={18} />,
    'Shield': <Shield size={18} />,
    'Smile': <Smile size={18} />,
    'Star': <Star size={18} />,
    'Coffee': <Coffee size={18} />,
    'Ghost': <Ghost size={18} />,
    'Crown': <Crown size={18} />
};

const TiltCard = ({ children, isSelected, onClick, color, ...props }: any) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    const rotateX = useMotionTemplate`${mouseY}deg`;
    const rotateY = useMotionTemplate`${mouseX}deg`;

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const xPct = (clientX - left) / width - 0.5;
        const yPct = (clientY - top) / height - 0.5;
        x.set(xPct * 15); // Reduced tilt slightly
        y.set(yPct * -15);
    }

    function onMouseLeave() {
        x.set(0);
        y.set(0);
    }

    // Determine shadow color based on custom hex
    const isCustomHex = color && color.startsWith('#');
    const shadowStyle = isSelected && isCustomHex 
        ? { boxShadow: `0 20px 40px -10px ${color}40`, border: `2px solid ${color}` } 
        : {};

    return (
        <motion.button
            {...props}
            onClick={onClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                ...shadowStyle,
                backgroundColor: isSelected && isCustomHex ? `${color}15` : undefined
            }}
            className={`
              relative rounded-2xl p-4 text-left transition-all duration-300 overflow-visible group outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 dark:focus:ring-gray-700 h-full flex flex-col justify-between min-h-[140px] w-full
              ${isSelected && !isCustomHex
                ? `${color} ring-2 ring-offset-2 ring-transparent shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] z-10` 
                : !isSelected 
                    ? 'bg-white/50 dark:bg-gray-800/50 border border-transparent hover:bg-white/80 dark:hover:bg-gray-800 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/20' 
                    : 'z-10'
              }
            `}
        >
            <div style={{ transform: "translateZ(20px)" }} className="w-full h-full flex flex-col justify-between">
                {children}
            </div>
            
             {/* Glow Effect for Selected */}
            {isSelected && !isCustomHex && (
              <div className={`absolute inset-0 blur-2xl opacity-40 -z-10 rounded-2xl ${color.split(' ')[0].replace('bg-', 'bg-')}`} style={{ transform: "translateZ(-10px)" }}></div>
            )}
        </motion.button>
    );
}

const CustomVibeForm = ({ onClose, onSave, initialConfig }: { onClose: () => void, onSave: (config: CustomVibeConfig) => void, initialConfig: CustomVibeConfig | null }) => {
    const [label, setLabel] = useState(initialConfig?.label || '');
    const [description, setDescription] = useState(initialConfig?.description || '');
    const [customHex, setCustomHex] = useState(initialConfig?.color && initialConfig.color.startsWith('#') ? initialConfig.color : '#6366f1');
    const [selectedIcon, setSelectedIcon] = useState(initialConfig?.iconName || 'Palette');
    
    // Check if initial color was a hex or a class
    const isHexInitially = initialConfig?.color?.startsWith('#');
    const [selectedPreset, setSelectedPreset] = useState(isHexInitially ? null : initialConfig?.color || 'bg-purple-100 text-purple-600 border-purple-200');

    // Presets State
    const [savedPresets, setSavedPresets] = useState<CustomVibeConfig[]>([]);
    const [showPresets, setShowPresets] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('perfectReplyCustomPresets');
        if (stored) {
            try {
                setSavedPresets(JSON.parse(stored));
            } catch (e) { console.error("Failed to load presets"); }
        }
    }, []);

    const savePreset = () => {
        const newPreset: CustomVibeConfig = {
            label,
            description,
            color: selectedPreset || customHex,
            iconName: selectedIcon
        };
        const updated = [...savedPresets, newPreset];
        setSavedPresets(updated);
        localStorage.setItem('perfectReplyCustomPresets', JSON.stringify(updated));
    };
    
    const loadPreset = (preset: CustomVibeConfig) => {
        setLabel(preset.label);
        setDescription(preset.description);
        if (preset.color.startsWith('#')) {
            setCustomHex(preset.color);
            setSelectedPreset(null);
        } else {
            setSelectedPreset(preset.color);
        }
        if (preset.iconName) setSelectedIcon(preset.iconName);
        setShowPresets(false);
    };

    const deletePreset = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = savedPresets.filter((_, i) => i !== idx);
        setSavedPresets(updated);
        localStorage.setItem('perfectReplyCustomPresets', JSON.stringify(updated));
    };

    const colors = [
        { class: 'bg-purple-100 text-purple-600 border-purple-200', hex: '#E9D5FF' },
        { class: 'bg-orange-100 text-orange-600 border-orange-200', hex: '#FFEDD5' },
        { class: 'bg-cyan-100 text-cyan-600 border-cyan-200', hex: '#CFFAFE' },
        { class: 'bg-lime-100 text-lime-600 border-lime-200', hex: '#ECFCCB' },
        { class: 'bg-rose-100 text-rose-600 border-rose-200', hex: '#FFE4E6' },
    ];

    const handleSave = () => {
        onSave({ 
            label, 
            description, 
            color: selectedPreset || customHex,
            iconName: selectedIcon
        });
    }

    return createPortal(
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative overflow-hidden border border-white/20 dark:border-white/10"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full p-2 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="mb-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm ring-4 ring-indigo-50/50 dark:ring-indigo-900/20">
                                {ICON_MAP[selectedIcon] || <Palette size={28} />}
                            </div>
                            <div>
                                <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">Design your Vibe</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Customize the AI's personality.</p>
                            </div>
                        </div>
                        
                        {/* Preset Dropdown */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowPresets(!showPresets)}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                {showPresets ? "Hide Presets" : "Load Preset"} <ChevronDown size={12} className={showPresets ? "rotate-180" : ""} />
                            </button>
                            <AnimatePresence>
                                {showPresets && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
                                    >
                                        {savedPresets.length === 0 ? (
                                            <div className="p-3 text-xs text-gray-400 text-center">No saved presets yet.</div>
                                        ) : (
                                            savedPresets.map((p, i) => (
                                                <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0 group">
                                                    <button onClick={() => loadPreset(p)} className="text-xs text-gray-700 dark:text-gray-200 font-medium truncate flex-grow text-left">
                                                        {p.label}
                                                    </button>
                                                    <button onClick={(e) => deletePreset(i, e)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-5">
                    <div className="flex gap-4">
                        <div className="flex-grow">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Vibe Name</label>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="e.g. Sarcastic Bestie" 
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm font-medium text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 focus:border-indigo-300 dark:focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/30 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                maxLength={20}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Description (for AI)</label>
                        <textarea 
                            placeholder="e.g. Use dry humor, short sentences, and puns. Don't be too emotional." 
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm font-medium text-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 focus:border-indigo-300 dark:focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/50 dark:focus:ring-indigo-900/30 resize-none h-24 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 leading-relaxed"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    
                    <div>
                         <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 ml-1">Icon & Color</label>
                         <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                             {/* Icon Picker */}
                             <div className="grid grid-cols-5 gap-2">
                                 {Object.entries(ICON_MAP).slice(0, 5).map(([name, icon]) => (
                                     <button
                                         key={name}
                                         onClick={() => setSelectedIcon(name)}
                                         className={`p-1.5 rounded-lg transition-all ${selectedIcon === name ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                     >
                                         {icon}
                                     </button>
                                 ))}
                             </div>

                             <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2"></div>

                             {/* Color Picker */}
                             <div className="flex items-center gap-2">
                                {colors.slice(0, 3).map((c) => (
                                    <button 
                                        key={c.hex}
                                        className={`w-6 h-6 rounded-full border border-gray-100 dark:border-gray-600 transition-all ${selectedPreset === c.class ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-900 dark:ring-white shadow-md' : 'hover:scale-110 hover:shadow-sm'}`}
                                        style={{ backgroundColor: c.hex }}
                                        onClick={() => { setSelectedPreset(c.class); }}
                                    />
                                ))}
                                <div className="relative group">
                                    <div 
                                        className={`w-6 h-6 rounded-full border border-gray-100 dark:border-gray-600 overflow-hidden relative cursor-pointer transition-all ${!selectedPreset ? 'scale-110 ring-2 ring-offset-2 dark:ring-offset-gray-900 ring-gray-900 dark:ring-white shadow-md' : 'hover:scale-110 hover:shadow-sm'}`}
                                        style={{ backgroundColor: customHex }}
                                    >
                                        <input 
                                            type="color" 
                                            value={customHex}
                                            onChange={(e) => { setCustomHex(e.target.value); setSelectedPreset(null); }}
                                            className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0"
                                        />
                                        <Palette size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black/50 pointer-events-none" />
                                    </div>
                                </div>
                             </div>
                         </div>
                    </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                     <button 
                        onClick={savePreset}
                        disabled={!label || !description}
                        className="flex-shrink-0 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                        title="Save as Preset"
                    >
                        <Save size={18} />
                    </button>
                    <button 
                        disabled={!label || !description}
                        onClick={handleSave}
                        className="flex-grow bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-black dark:hover:bg-gray-100 disabled:opacity-50 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:active:scale-100"
                    >
                        Apply Vibe
                    </button>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
}

export const VibeSelector: React.FC<VibeSelectorProps> = ({ selectedVibe, onSelect, options, customVibe, setCustomVibe }) => {
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const handleCustomSave = (config: CustomVibeConfig) => {
      setCustomVibe(config);
      setIsEditingCustom(false);
      onSelect(VibeType.Custom);
  };

  const handleCustomClick = () => {
    if (selectedVibe === VibeType.Custom || !customVibe) {
        setIsEditingCustom(true);
    } else {
        onSelect(VibeType.Custom);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 perspective-1000">
      {options.map((option, idx) => {
        const isSelected = selectedVibe === option.type;
        return (
          <TiltCard
            key={option.type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onSelect(option.type)}
            isSelected={isSelected}
            color={option.color}
            title={option.desc}
          >
            <div className="flex items-center justify-between mb-3 relative z-10 w-full pointer-events-none">
              <div className={`
                p-2 rounded-xl transition-all duration-300 shadow-sm
                ${isSelected ? 'bg-white/90 dark:bg-gray-800/90 scale-110 rotate-3' : 'bg-gray-100 dark:bg-gray-700/50 group-hover:bg-white dark:group-hover:bg-gray-700'}
              `}>
                {option.icon}
              </div>
              
              {/* Selection Checkmark */}
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                ${isSelected ? 'bg-current opacity-100 scale-100' : 'bg-gray-200 dark:bg-gray-700 opacity-0 scale-50'}
              `}>
                 <Check size={12} className="text-white dark:text-gray-900" strokeWidth={3} />
              </div>
            </div>
            
            <div className="font-bold text-sm mb-1 relative z-10 text-gray-800 dark:text-gray-100 pointer-events-none">{option.label}</div>
            
            <div className={`text-[11px] relative z-10 font-medium leading-tight transition-colors pointer-events-none ${isSelected ? 'opacity-90 text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
              {option.desc}
            </div>
          </TiltCard>
        );
      })}

      {/* Custom Vibe Card */}
      <div className="relative h-full min-h-[140px] z-10">
         <AnimatePresence>
            {isEditingCustom && (
                <CustomVibeForm 
                    onClose={() => setIsEditingCustom(false)} 
                    onSave={handleCustomSave} 
                    initialConfig={customVibe}
                />
            )}
         </AnimatePresence>
         
         {!isEditingCustom && (
             <TiltCard
                onClick={handleCustomClick}
                isSelected={selectedVibe === VibeType.Custom}
                color={customVibe ? customVibe.color : "bg-gray-50 dark:bg-gray-800/50 border-dashed border-gray-300 dark:border-gray-600"}
             >
                <div className="flex items-center justify-between mb-3 relative z-10 w-full pointer-events-none">
                  <div className={`
                    p-2 rounded-xl transition-all duration-300 shadow-sm
                    ${selectedVibe === VibeType.Custom ? 'bg-white/90 dark:bg-gray-800/90 scale-110 rotate-3' : 'bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600'}
                  `} style={customVibe && selectedVibe === VibeType.Custom && customVibe.color.startsWith('#') ? { color: customVibe.color } : {}}>
                    {customVibe && customVibe.iconName ? ICON_MAP[customVibe.iconName] : <Palette size={18} />}
                  </div>
                   
                   {/* Selection Checkmark */}
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                    ${selectedVibe === VibeType.Custom ? 'bg-gray-900 dark:bg-white opacity-100 scale-100' : 'bg-gray-200 dark:bg-gray-700 opacity-0 scale-50'}
                  `} style={customVibe && selectedVibe === VibeType.Custom && customVibe.color.startsWith('#') ? { backgroundColor: customVibe.color } : {}}>
                     <Check size={12} className="text-white dark:text-gray-900" strokeWidth={3} />
                  </div>
                </div>

                <div className="font-bold text-sm mb-1 relative z-10 text-gray-800 dark:text-gray-100 pointer-events-none">
                    {customVibe ? customVibe.label : "Custom Vibe"}
                </div>
                
                <div className={`text-[11px] relative z-10 font-medium leading-tight transition-colors pointer-events-none ${selectedVibe === VibeType.Custom ? 'opacity-90 text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                   {customVibe ? customVibe.description : "Create your own style"}
                </div>
                
                {selectedVibe === VibeType.Custom && (
                     <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 bg-white/50 dark:bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
                         Tap to Edit
                     </div>
                )}
             </TiltCard>
         )}
      </div>
    </div>
  );
};