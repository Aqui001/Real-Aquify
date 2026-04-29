/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Search, Home, Library, 
  Settings, Music2, Share2, Clipboard, Sparkles, Layout, 
  Layers, Volume2, Repeat, Shuffle, Minus, Plus, Check,
  Copy, CheckSquare, Square, Zap, Disc, Twitter, Linkedin, Link2, X, User,
  Download, Loader2, ArrowDownCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// --- Types ---
interface AppFeature {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface AppTheme {
  id: string;
  name: string;
  bg: string;
  accent: string;
  font: string;
}

interface AppMood {
  id: string;
  name: string;
  description: string;
  tone: string;
}

// --- Constants ---
const INITIAL_FEATURES: AppFeature[] = [
  { id: 'playlists', label: 'Playlists', description: 'Create and share personal sets', enabled: true },
  { id: 'search', label: 'Global Search', description: 'Search across tracks, albums, artists', enabled: true },
  { id: 'lyrics', label: 'Live Lyrics', description: 'Synchronized real-time lyric display', enabled: false },
  { id: 'social', label: 'Social Activity', description: 'See what friends are listening to', enabled: false },
  { id: 'discovery', label: 'AI Discovery', description: 'Daily personalized music recommendations', enabled: true },
  { id: 'offline', label: 'Offline Mode', description: 'Download tracks for offline playback', enabled: true },
  { id: 'radio', label: 'Artist Radio', description: 'Generate stations based on artists', enabled: true },
];

const MOODS: AppMood[] = [
  { id: 'zen', name: 'Zen', description: 'Minimalist, calm, whitespace-heavy', tone: 'Clean typography, muted colors, and subtle transitions.' },
  { id: 'neon', name: 'Neon', description: 'Cyberpunk, high-contrast, glowing', tone: 'Deep blacks, neon accents, and sharp grid lines.' },
  { id: 'organic', name: 'Organic', description: 'Warm, editorial, soft edges', tone: 'Serif fonts, earthy tones, and fluid shapes.' },
];

const THEMES: AppTheme[] = [
  { id: 'spotify', name: 'Original Green', bg: 'bg-[#121212]', accent: 'text-[#1DB954]', font: 'font-sans' },
  { id: 'midnight', name: 'Midnight Blue', bg: 'bg-[#0A0E14]', accent: 'text-[#38BDF8]', font: 'font-sans' },
  { id: 'sunset', name: 'Sunset Aura', bg: 'bg-[#0F0A0A]', accent: 'text-[#F43F5E]', font: 'font-serif' },
  { id: 'monochrome', name: 'Studio Mono', bg: 'bg-[#000000]', accent: 'text-white', font: 'font-mono' },
];

// --- Components ---

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export default function App() {
  const [features, setFeatures] = useState<AppFeature[]>(INITIAL_FEATURES);
  const [activeTheme, setActiveTheme] = useState<AppTheme>(THEMES[0]);
  const [activeMood, setActiveMood] = useState<AppMood>(MOODS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copying, setCopying] = useState(false);
  const [view, setView] = useState<'blueprint' | 'preview'>('blueprint');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareContext, setShareContext] = useState<{ type: 'blueprint' | 'track', name?: string }>({ type: 'blueprint' });
  const [shareCopying, setShareCopying] = useState<'link' | 'prompt' | null>(null);

  const openShareModal = (type: 'blueprint' | 'track', name?: string) => {
    setShareContext({ type, name });
    setIsShareModalOpen(true);
  };

  // Progress states for mock downloads
  const [downloadingIds, setDownloadingIds] = useState<Record<string, number>>({});

  const startDownload = (id: string) => {
    if (downloadingIds[id] !== undefined) return;
    
    setDownloadingIds(prev => ({ ...prev, [id]: 0 }));
    
    const interval = setInterval(() => {
      setDownloadingIds(prev => {
        const current = prev[id];
        if (current >= 100) {
          clearInterval(interval);
          return prev; // stays at 100
        }
        return { ...prev, [id]: current + Math.floor(Math.random() * 15) + 5 };
      });
    }, 400);
  };

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const generatePrompt = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const enabledFeatures = features.filter(f => f.enabled).map(f => f.label);
      
      const prompt = `Act as a Senior Software Architect and Product Manager. 
      I want to build a music library application like Spotify using modern web technologies (React, Tailwind, Motion, etc.).
      
      The app should include these key features: ${enabledFeatures.join(', ')}.
      The visual aesthetic should be ${activeTheme.name} but with a ${activeMood.name} mood.
      Mood Guidelines: ${activeMood.tone}
      
      Generate a comprehensive, high-fidelity technical prompt for an AI coding assistant.
      Include:
      1. Technical Stack (Frontend/Backend)
      2. Component Architecture
      3. Global State Management (Zustand or Recoil)
      4. Database Schema
      5. Complex UI interactions with framer-motion (staggered entries, shared layouts)
      6. API Integration strategy (OAuth 2.0 flow for music providers)
      
      Format it in clean Markdown. Start with a catchy project name.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setGeneratedPrompt(response.text || 'Error generating prompt.');
    } catch (error) {
      console.error(error);
      setGeneratedPrompt("Failed to generate prompt. Please ensure your API key is configured.");
    } finally {
      setIsGenerating(false);
      setView('blueprint');
    }
  };

  const handleCopy = () => {
    const text = shareContext.type === 'blueprint' ? generatedPrompt : `${window.location.href}?track=${encodeURIComponent(shareContext.name || '')}`;
    navigator.clipboard.writeText(text);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const handleShareLink = () => {
    const url = shareContext.type === 'blueprint' ? window.location.href : `${window.location.href}?track=${encodeURIComponent(shareContext.name || '')}`;
    navigator.clipboard.writeText(url);
    setShareCopying('link');
    setTimeout(() => setShareCopying(null), 2000);
  };

  const shareToTwitter = () => {
    const text = shareContext.type === 'blueprint' 
      ? "Check out my music app blueprint generated with Aquify! 🎵✨" 
      : `Listening to "${shareContext.name}" on my custom Aquify logic stream! 🎧🔥`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={cn("min-h-screen text-white flex flex-col relative overflow-hidden", activeTheme.bg, activeTheme.font)}>
      {/* Immersive Cinematic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.25 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <img 
            src="https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?auto=format&fit=crop&q=80&w=1920" 
            alt="Music Background" 
            className="w-full h-full object-cover grayscale mix-blend-luminosity brightness-75 transition-all"
          />
        </motion.div>
        <div className={cn("absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black/90")} />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Navigation Header */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 sticky top-0 bg-black/20 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
            <Disc className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <span className="font-bold text-xl tracking-tight">Aquify</span>
        </div>
        <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
          <button 
            onClick={() => setView('blueprint')}
            className={cn("px-4 py-1.5 rounded-full transition-all text-sm font-medium", view === 'blueprint' ? "bg-white text-black" : "text-white/60 hover:text-white")}
          >
            Blueprint
          </button>
          <button 
            onClick={() => setView('preview')}
            className={cn("px-4 py-1.5 rounded-full transition-all text-sm font-medium", view === 'preview' ? "bg-white text-black" : "text-white/60 hover:text-white")}
          >
            Live Preview
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {view === 'blueprint' ? (
            <motion.div 
              key="blueprint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col lg:flex-row"
            >
              {/* Feature Config Panel */}
              <div className="w-full lg:w-96 border-r border-white/10 p-6 overflow-y-auto bg-black/20 backdrop-blur-md">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Layout className="w-5 h-5 opacity-60" />
                  Blueprint Studio
                </h2>
                
                <section className="mb-8">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 block">Application Mood</label>
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                    {MOODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setActiveMood(m)}
                        className={cn(
                          "flex-1 py-2 px-1 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                          activeMood.id === m.id ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-white/30 italic px-1">{activeMood.description}</p>
                </section>
                
                <section className="mb-8">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 block">Visual Identity</label>
                  <div className="grid grid-cols-2 gap-3">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setActiveTheme(t)}
                        className={cn(
                          "px-3 py-2 rounded-lg border text-xs text-left transition-all",
                          activeTheme.id === t.id ? "bg-white/10 border-white/40 ring-1 ring-white/20" : "border-white/5 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{t.name}</span>
                          {activeTheme.id === t.id && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex gap-1">
                          <div className={cn("w-2 h-2 rounded-full", t.bg)} />
                          <div className={cn("w-2 h-2 rounded-full", t.accent.replace('text-', 'bg-'))} />
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 block">Tech Stack Blueprint</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['React 19', 'Tailwind', 'Motion', 'Zustand', 'Radix', 'Vite'].map(tech => (
                      <div key={tech} className="px-1 py-2 bg-black/40 rounded-lg flex flex-col items-center justify-center border border-white/5 gap-1 group hover:border-white/20 transition-all">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse group-hover:scale-150 transition-transform" />
                        <span className="text-[8px] font-mono whitespace-nowrap opacity-50 group-hover:opacity-100">{tech}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-4 block leading-none">Capabilities</label>
                  <p className="text-[10px] text-white/20 mb-4">Toggle features to architect your logic</p>
                  <div className="space-y-2">
                    {features.map((f, i) => (
                      <motion.button
                        key={f.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => toggleFeature(f.id)}
                        className={cn(
                          "w-full p-3 rounded-xl border flex items-start gap-3 text-left transition-all group relative overflow-hidden",
                          f.enabled ? "bg-white/5 border-white/20 shadow-xl" : "border-transparent opacity-30 hover:opacity-50"
                        )}
                      >
                        {f.enabled && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />}
                        <div className={cn("mt-0.5 relative z-10 transition-colors", f.enabled ? activeTheme.accent : "text-white")}>
                          {f.enabled ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div className="relative z-10">
                          <div className="font-bold text-xs tracking-tight">{f.label}</div>
                          <div className="text-[10px] text-white/40 leading-tight">{f.description}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </section>

                <button 
                  onClick={generatePrompt}
                  disabled={isGenerating}
                  className={cn(
                    "w-full mt-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 transition-all",
                    isGenerating ? "bg-white/20 cursor-wait" : cn("bg-white text-black hover:scale-[1.02] active:scale-95")
                  )}
                >
                  {isGenerating ? <Disc className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {isGenerating ? "Consulting Architect..." : "Architect Master Prompt"}
                </button>
              </div>

              {/* Output / Prompt View */}
              <div className="flex-1 p-8 overflow-y-auto bg-black/40">
                {!generatedPrompt && !isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-50">
                    <Music2 className="w-16 h-16 mb-4 animate-pulse" />
                    <h3 className="text-xl font-bold mb-2">Build Your Masterpiece</h3>
                    <p className="text-sm">Select your features and click "Architect Master Prompt" to generate a technical specification that will build a Spotify-like application in seconds.</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-transparent py-2 z-10">
                      <div className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/60">Generated Technical Specification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openShareModal('blueprint')}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all"
                        >
                          {copying ? <Check className="w-4 h-4 text-green-400" /> : <Clipboard className="w-4 h-4" />}
                          {copying ? "Copied!" : "Copy Prompt"}
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-invert prose-emerald max-w-none bg-white/5 rounded-2xl p-8 border border-white/10 shadow-2xl">
                      {isGenerating ? (
                        <div className="space-y-4 animate-pulse">
                          <div className="h-8 bg-white/10 rounded w-1/3" />
                          <div className="h-4 bg-white/10 rounded w-full" />
                          <div className="h-4 bg-white/10 rounded w-full" />
                          <div className="h-4 bg-white/10 rounded w-2/3" />
                          <div className="h-24 bg-white/10 rounded w-full" />
                        </div>
                      ) : (
                        <ReactMarkdown>{generatedPrompt}</ReactMarkdown>
                      )}
                    </div>
                    
                    <div className="mt-12 text-center p-8 border border-dashed border-white/20 rounded-2xl">
                      <p className="text-white/40 text-sm mb-4 italic">"This prompt is optimized for high-fidelity code generation. Paste it into your AI assistant to start building instantly."</p>
                      <button 
                        onClick={() => setView('preview')}
                        className="text-sm font-bold flex items-center gap-2 mx-auto hover:text-emerald-400 transition-colors"
                      >
                        Take a look at the UI Preview <SkipForward className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full bg-black flex overflow-hidden font-sans"
            >
              {/* Spotify-style UI Preview */}
              <div className="w-64 bg-black p-6 flex flex-col gap-6 border-r border-white/5">
                <div className="flex flex-col gap-4">
                  <NavItem icon={<Home />} label="Home" active />
                  <NavItem icon={<Search />} label="Search" />
                  <NavItem icon={<Library />} label="Your Library" />
                </div>
                
                <div className="mt-8">
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Playlists</p>
                  <div className="flex flex-col gap-3">
                    <PlaylistLink name="Daily Mix 1" />
                    <PlaylistLink name="Discover Weekly" />
                    <PlaylistLink name="Coding Beats" />
                    <PlaylistLink name="Midnight Chill" />
                  </div>
                </div>

                <div className="mt-auto bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold">Aquify AI</span>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">Personalizing your experience based on your Blueprint selections.</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Immersive Background Blur (Recipe 7) */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.3, 0.2]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("absolute top-[-10%] left-[-10%] w-[70%] h-[70%] blur-[120px] rounded-full", activeMood.id === 'zen' ? "bg-white/5" : activeMood.id === 'neon' ? "bg-[#1DB954]/20" : "bg-orange-500/10")} 
                  />
                  <motion.div 
                    animate={{ 
                      scale: [1.2, 1, 1.2],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    className={cn("absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] blur-[120px] rounded-full", activeMood.id === 'organic' ? "bg-amber-900/20" : "bg-purple-900/10")} 
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
                  <header className="flex items-center justify-between mb-12">
                    <div>
                      <h2 className={cn("text-4xl font-black mb-2 tracking-tighter transition-all", activeMood.id === 'organic' ? "font-serif italic" : "")}>
                        {activeMood.id === 'zen' ? "Minimalist" : activeMood.id === 'neon' ? "Mainframe" : "Discovery"}
                      </h2>
                      <div className="flex gap-2">
                        {features.filter(f => f.enabled).slice(0, 4).map((f, i) => (
                          <motion.span 
                            key={f.id} 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-full text-white/40 font-mono"
                          >
                            {f.label}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-white/5 rounded-full border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                      <Settings className="w-5 h-5 text-white/60" />
                    </div>
                  </header>

                  <section className="mb-16">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard 
                          title="Ambient Architect" 
                          image="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400" 
                          color={activeMood.id === 'neon' ? "from-[#1DB954]" : activeMood.id === 'zen' ? "from-white/10" : "from-amber-600"}
                          mood={activeMood.id}
                        />
                         <FeatureCard 
                          title="Neural Dreams" 
                          image="https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400"
                          color={activeMood.id === 'neon' ? "from-blue-600" : activeMood.id === 'zen' ? "from-zinc-800" : "from-rose-600"}
                          mood={activeMood.id}
                        />
                         <FeatureCard 
                          title="Code & Bass" 
                          image="https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=400"
                          color={activeMood.id === 'neon' ? "from-purple-600" : activeMood.id === 'zen' ? "from-black" : "from-emerald-700"}
                          mood={activeMood.id}
                        />
                     </div>
                  </section>

                  <section className="pb-32">
                    <h3 className="text-xl font-bold mb-6 tracking-tight">Active Logic Streams</h3>
                    <div className="space-y-1">
                      {features.filter(f => f.enabled).map((f, i) => {
                        const downloadProgress = downloadingIds[f.id];
                        const isDownloaded = downloadProgress >= 100;

                        return (
                          <motion.div 
                            key={f.id} 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/5"
                          >
                            <span className="text-white/20 font-mono text-xs w-4">0{i + 1}</span>
                            <div className={cn("w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110", activeMood.id === 'neon' ? "group-hover:border-[#1DB954]/40" : "")}>
                              <Layers className={cn("w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity", activeTheme.accent)} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-bold text-sm truncate uppercase tracking-wide">{f.label}</p>
                              <p className="text-[10px] text-white/40 truncate leading-none mt-1 uppercase">{f.description}</p>
                            </div>
                            <div className="flex items-center gap-6 pr-4">
                              {downloadProgress !== undefined ? (
                                <div className="flex items-center gap-3">
                                  <div className="relative w-5 h-5">
                                    <svg className="w-5 h-5 -rotate-90">
                                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" />
                                      <motion.circle 
                                        cx="10" cy="10" r="8" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        fill="transparent" 
                                        className={isDownloaded ? "text-emerald-500" : "text-white/60"}
                                        initial={{ strokeDasharray: "50 50", strokeDashoffset: 50 }}
                                        animate={{ strokeDashoffset: 50 - (50 * Math.min(downloadProgress, 100) / 100) }}
                                      />
                                    </svg>
                                    {isDownloaded && <Check className="absolute inset-0 m-auto w-3 h-3 text-emerald-500" />}
                                  </div>
                                  <span className="text-[9px] font-mono text-white/40 min-w-[3ch]">{Math.min(downloadProgress, 100)}%</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startDownload(f.id); }}
                                  className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <ArrowDownCircle className="w-4 h-4" />
                                </button>
                              )}
                              
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                 <span className="text-[10px] text-white/20 uppercase font-mono">Synced</span>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); openShareModal('track', f.label); }}
                                className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                </div>

                {/* Floating Modern Player Bar */}
                <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-5xl h-20 bg-black/60 backdrop-blur-3xl rounded-full border border-white/10 px-8 flex items-center justify-between z-50 shadow-2xl">
                  <div className="flex items-center gap-4 w-64">
                    <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden border border-white/10 relative group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 animate-pulse" />
                      <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200" alt="Cover" className="group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black truncate leading-tight uppercase tracking-tight">System Synthesis</p>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">Aquify Engine</p>
                    </div>
                    <button 
                      onClick={() => openShareModal('track', 'System Synthesis')}
                      className="p-2 hover:bg-white/10 rounded-full text-white/20 hover:text-white transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 flex-1 max-w-md mx-8">
                    <div className="flex items-center gap-8">
                      <Shuffle className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
                      <SkipBack className="w-5 h-5 text-white/40 hover:text-white cursor-pointer active:scale-95 transition-all" />
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black shadow-lg cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current ml-1" />
                      </motion.div>
                      <SkipForward className="w-5 h-5 text-white/40 hover:text-white cursor-pointer active:scale-95 transition-all" />
                      <Repeat className="w-4 h-4 text-white/20 hover:text-white cursor-pointer transition-colors" />
                    </div>
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-[8px] font-mono text-white/20">00:42</span>
                      <div className="h-1 flex-1 bg-white/5 rounded-full relative overflow-hidden group cursor-pointer">
                        <motion.div 
                          animate={{ width: "42%" }}
                          className={cn("absolute inset-y-0 left-0 bg-white group-hover:bg-emerald-400 transition-colors")} 
                        />
                      </div>
                      <span className="text-[8px] font-mono text-white/20">09:15</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-6 w-64">
                    <div className="flex items-center gap-2 group">
                      <Volume2 className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                      <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-3/4 h-full bg-white/40 group-hover:bg-white transition-all shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                      </div>
                    </div>
                    <Layout className="w-4 h-4 text-white/30 hover:text-white cursor-pointer transition-colors" />
                  </div>
                </footer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-[#181818] rounded-3xl border border-white/10 p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-2">Share {shareContext.type === 'blueprint' ? 'Blueprint' : 'Track'}</h3>
                <p className="text-sm text-white/50">
                  {shareContext.type === 'blueprint' 
                    ? 'Let everyone see your architectural masterpiece.' 
                    : `Spread the vibes of "${shareContext.name}".`}
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleShareLink}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <Link2 className="w-5 h-5 opacity-60" />
                    <span className="font-medium text-sm">Copy {shareContext.type === 'blueprint' ? 'App' : 'Track'} Link</span>
                  </div>
                  {shareCopying === 'link' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 opacity-40" />}
                </button>

                <button 
                  onClick={handleCopy}
                  className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <Clipboard className="w-5 h-5 opacity-60" />
                    <span className="font-medium text-sm">Copy Master {shareContext.type === 'blueprint' ? 'Prompt' : 'ID'}</span>
                  </div>
                  {copying ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 opacity-40" />}
                </button>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button 
                    onClick={shareToTwitter}
                    className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-[#1DA1F2]/20 hover:border-[#1DA1F2]/40 rounded-2xl border border-white/5 transition-all"
                  >
                    <Twitter className="w-6 h-6 text-[#1DA1F2]" />
                    <span className="text-xs font-medium">Twitter / X</span>
                  </button>
                  <button 
                    onClick={shareToLinkedIn}
                    className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/40 rounded-2xl border border-white/5 transition-all"
                  >
                    <Linkedin className="w-6 h-6 text-[#0A66C2]" />
                    <span className="text-xs font-medium">LinkedIn</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blueprint Loading Mask */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#121212] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-sm"
          >
            <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 relative">
              <Disc className="w-10 h-10 animate-spin-slow" />
              <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl animate-ping opacity-20" />
            </div>
            <h3 className="text-xl font-bold mb-2">Analyzing Blueprint</h3>
            <p className="text-sm text-white/50 leading-relaxed">Our Senior Architect is drafting technical specifications for your ${activeTheme.name} experience...</p>
            <div className="mt-8 flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// --- Helper UI Components ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-4 cursor-pointer transition-colors px-2 py-1 rounded-md",
      active ? "text-white" : "text-white/60 hover:text-white"
    )}>
      <div className="[&>svg]:w-6 [&>svg]:h-6 flex items-center justify-center">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </div>
  );
}

function PlaylistLink({ name }: { name: string }) {
  return (
    <p className="text-sm text-white/60 hover:text-white cursor-pointer transition-colors truncate">
      {name}
    </p>
  );
}

function FeatureCard({ title, image, color, mood }: { title: string, image: string, color: string, mood: string }) {
  const isNeon = mood === 'neon';
  const isZen = mood === 'zen';
  
  return (
    <div className={cn(
      "group relative h-56 transition-all duration-500 hover:scale-[1.03] active:scale-95 shadow-2xl overflow-hidden cursor-pointer border border-white/5",
      isZen ? "border-white/10" : ""
    )}
    style={{ borderRadius: isZen ? '8px' : '24px' }}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity z-10", color)} />
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
      <img 
        src={image} 
        alt={title} 
        className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay scale-110 group-hover:scale-125 transition-transform duration-1000" 
      />
      
      {isNeon && (
        <div className="absolute -inset-px border-2 border-white/0 group-hover:border-white/20 transition-all z-20 pointer-events-none rounded-[inherit]" />
      )}

      <div className="relative z-20 h-full p-6 flex flex-col">
        <div className="flex-1">
          <motion.h4 
            initial={false}
            animate={{ letterSpacing: isNeon ? '0.05em' : '0em' }}
            className={cn(
              "text-2xl font-black leading-[0.9] drop-shadow-2xl capitalize",
              mood === 'organic' ? "font-serif italic" : ""
            )}
          >
            {title}
          </motion.h4>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Module 01</span>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500",
            isZen ? "bg-white text-black" : "bg-white/90 text-black hover:bg-white translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          )}>
            <Play className="w-5 h-5 fill-current ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
