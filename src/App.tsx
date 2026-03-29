import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Wand2, 
  Activity, 
  Search, 
  Filter, 
  ChevronRight, 
  History, 
  Layers, 
  Cpu
} from 'lucide-react';

// --- Types ---
type Screen = 'home' | 'archives' | 'workbench' | 'diagnostics';

// --- Mock Data ---
const MANUSCRIPTS = [
  { id: 1, title: 'Codex Sinaiticus (Fragment)', century: '4th C.', status: 'Degraded', image: 'https://picsum.photos/seed/codex/400/600' },
  { id: 2, title: 'Voynich Manuscript', century: '15th C.', status: 'Enigmatic', image: 'https://picsum.photos/seed/voynich/400/600' },
  { id: 3, title: 'Dead Sea Scrolls', century: '2nd C. BCE', status: 'Fragile', image: 'https://picsum.photos/seed/scrolls/400/600' },
];

// --- Components ---

const Navbar = ({ currentScreen, setScreen }: { currentScreen: Screen, setScreen: (s: Screen) => void }) => (
  <nav className="fixed top-0 left-0 right-0 h-16 bg-[#f5f2ed]/80 backdrop-blur-md border-b border-black/5 z-50 px-6 flex items-center justify-between">
    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setScreen('home')}>
      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
        <Library className="text-white w-5 h-5" />
      </div>
      <span className="font-serif italic text-xl tracking-tight">Digital Scriptorium</span>
    </div>
    <div className="flex gap-8 text-xs uppercase tracking-[0.2em] font-semibold opacity-60">
      <button 
        onClick={() => setScreen('archives')}
        className={`hover:opacity-100 transition-opacity ${currentScreen === 'archives' ? 'opacity-100 border-b border-black' : ''}`}
      >
        Archives
      </button>
      <button 
        onClick={() => setScreen('workbench')}
        className={`hover:opacity-100 transition-opacity ${currentScreen === 'workbench' ? 'opacity-100 border-b border-black' : ''}`}
      >
        Workbench
      </button>
      <button 
        onClick={() => setScreen('diagnostics')}
        className={`hover:opacity-100 transition-opacity ${currentScreen === 'diagnostics' ? 'opacity-100 border-b border-black' : ''}`}
      >
        Diagnostics
      </button>
    </div>
  </nav>
);

const HomeScreen = ({ setScreen }: { setScreen: (s: Screen) => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="pt-32 pb-20 px-6 max-w-7xl mx-auto"
  >
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Hero Section */}
      <div className="lg:col-span-8">
        <h1 className="text-7xl lg:text-8xl font-serif leading-[0.9] tracking-tighter mb-8">
          Restoring <br />
          <span className="italic text-black/40">Lost History</span> <br />
          with AI.
        </h1>
        <p className="text-xl max-w-xl leading-relaxed opacity-70 mb-12">
          An advanced multimodal pipeline designed for the digital preservation, 
          restoration, and paleographic analysis of degraded historical manuscripts.
        </p>
        <button 
          onClick={() => setScreen('workbench')}
          className="px-8 py-4 bg-black text-white rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
        >
          Begin Restoration <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bento Grid */}
      <div className="lg:col-span-4 grid grid-cols-1 gap-6">
        <div className="p-8 bg-white rounded-[2.5rem] border border-black/5 shadow-sm">
          <Wand2 className="w-8 h-8 mb-4 opacity-40" />
          <h3 className="text-xl font-medium mb-2">Neural Inpainting</h3>
          <p className="text-sm opacity-60">Reconstruct missing text fragments using context-aware generative models.</p>
        </div>
        <div className="p-8 bg-[#1a1a1a] text-white rounded-[2.5rem]">
          <History className="w-8 h-8 mb-4 opacity-40" />
          <h3 className="text-xl font-medium mb-2">Paleographic OCR</h3>
          <p className="text-sm opacity-60">Transcribe ancient scripts with 98.4% accuracy across 12 dead languages.</p>
        </div>
      </div>
    </div>
  </motion.div>
);

const ArchivesScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="pt-32 px-6 max-w-7xl mx-auto"
  >
    <div className="flex justify-between items-end mb-12">
      <div>
        <h2 className="text-4xl font-serif italic mb-2">Manuscript Catalog</h2>
        <p className="text-sm opacity-50 uppercase tracking-widest">3,482 items indexed</p>
      </div>
      <div className="flex gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text" 
            placeholder="Search archives..." 
            className="pl-10 pr-4 py-2 bg-white border border-black/5 rounded-full text-sm focus:outline-none focus:border-black/20 w-64"
          />
        </div>
        <button className="p-2 bg-white border border-black/5 rounded-full hover:bg-black hover:text-white transition-colors">
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {MANUSCRIPTS.map((m) => (
        <motion.div 
          key={m.id}
          whileHover={{ y: -10 }}
          className="group cursor-pointer"
        >
          <div className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-4 bg-black/5 relative">
            <img 
              src={m.image} 
              alt={m.title} 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider">
              {m.century}
            </div>
          </div>
          <h3 className="text-xl font-serif italic">{m.title}</h3>
          <p className="text-xs opacity-40 uppercase tracking-widest mt-1">{m.status}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

const WorkbenchScreen = () => {
  const [stage, setStage] = useState(0);
  const stages = ["Multispectral Scan", "Noise Reduction", "Neural Inpainting", "Paleographic Analysis"];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 px-6 max-w-7xl mx-auto h-[calc(100vh-8rem)] flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-serif italic">Restoration Workbench</h2>
          <p className="text-xs opacity-40 uppercase tracking-widest">Active Session: Codex_Sinaiticus_Fragment_04</p>
        </div>
        <div className="flex gap-2">
          {stages.map((s, i) => (
            <div 
              key={s} 
              className={`h-1 w-12 rounded-full transition-colors ${i <= stage ? 'bg-black' : 'bg-black/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden">
        {/* Preview Area */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-black/5 overflow-hidden relative group">
          <img 
            src="https://picsum.photos/seed/manuscript-detail/1200/800" 
            alt="Manuscript Detail" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-4 bg-white/90 backdrop-blur rounded-2xl text-xs font-bold uppercase tracking-widest">
              Scan Overlay Active
            </div>
          </div>
          
          {/* AI Analysis Overlay */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute bottom-8 left-8 p-6 bg-black/90 text-white rounded-2xl max-w-xs"
          >
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Live Analysis</span>
            </div>
            <p className="text-sm font-mono leading-relaxed opacity-80">
              Detecting Uncial script... <br />
              Confidence: 94.2% <br />
              Suggested restoration: [ΚΑΙ ΕΝ ΤΩ...]
            </p>
          </motion.div>
        </div>

        {/* Controls Area */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="p-8 bg-white rounded-[2.5rem] border border-black/5 flex-1">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 opacity-40">Pipeline Controls</h3>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2">Denoising Strength</label>
                <input type="range" className="w-full accent-black" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider block mb-2">Contrast Enhancement</label>
                <input type="range" className="w-full accent-black" />
              </div>
              <div className="pt-6 border-t border-black/5">
                <button 
                  onClick={() => setStage(prev => Math.min(prev + 1, 3))}
                  className="w-full py-4 bg-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-[1.02] transition-transform"
                >
                  Run Next Stage
                </button>
              </div>
            </div>
          </div>
          <div className="p-8 bg-[#f5f2ed] border border-black/5 rounded-[2.5rem]">
            <div className="flex items-center gap-3 mb-4">
              <Layers className="w-5 h-5 opacity-40" />
              <span className="text-xs font-bold uppercase tracking-widest">Layer Stack</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Original Scan</span>
                <input type="checkbox" defaultChecked className="accent-black" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>UV Fluorescence</span>
                <input type="checkbox" className="accent-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const DiagnosticsScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="pt-32 px-6 max-w-7xl mx-auto"
  >
    <div className="mb-12">
      <h2 className="text-4xl font-serif italic mb-2">System Diagnostics</h2>
      <p className="text-sm opacity-50 uppercase tracking-widest">Real-time model performance metrics</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {[
        { label: 'Inference Latency', value: '42ms', icon: Activity },
        { label: 'Model Confidence', value: '98.2%', icon: Cpu },
        { label: 'VRAM Usage', value: '12.4GB', icon: Layers },
        { label: 'Restoration Rate', value: '14 p/h', icon: Wand2 },
      ].map((stat) => (
        <div key={stat.label} className="p-8 bg-white rounded-[2rem] border border-black/5">
          <stat.icon className="w-6 h-6 mb-4 opacity-20" />
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{stat.label}</p>
          <p className="text-3xl font-serif italic">{stat.value}</p>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-[2.5rem] border border-black/5 p-12 h-96 flex items-center justify-center">
      <div className="text-center opacity-20">
        <Activity className="w-12 h-12 mx-auto mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Performance Graph Visualization</p>
      </div>
    </div>
  </motion.div>
);

// --- Main App ---

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans selection:bg-black selection:text-white">
      <Navbar currentScreen={screen} setScreen={setScreen} />
      
      <AnimatePresence mode="wait">
        {screen === 'home' && <HomeScreen key="home" setScreen={setScreen} />}
        {screen === 'archives' && <ArchivesScreen key="archives" />}
        {screen === 'workbench' && <WorkbenchScreen key="workbench" />}
        {screen === 'diagnostics' && <DiagnosticsScreen key="diagnostics" />}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-20 py-12 px-6 border-t border-black/5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
          Digital Scriptorium © 2026 — Built with Gemini Multimodal Intelligence
        </p>
      </footer>
    </div>
  );
};

export default App;
