import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  Scroll, 
  Archive, 
  ShieldCheck, 
  UserCircle, 
  Library, 
  PenTool,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { io, Socket } from "socket.io-client";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { restoreManuscript, scribeChat } from "./lib/gemini";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PipelineStep {
  id: string;
  name: string;
  message: string;
  progress: number;
  isComplete: boolean;
}

interface RestorationResult {
  restoredText: string;
  era: string;
  confidence: number;
  uncertainWords: { word: string; confidence: number; alternatives: string[] }[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Review");
  const [sidebarTab, setSidebarTab] = useState("Archival Status");
  const [manuscripts, setManuscripts] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentManuscript, setCurrentManuscript] = useState<any>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const [restorationResult, setRestorationResult] = useState<RestorationResult | null>(null);
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/manuscripts");
      const data = await response.json();
      setManuscripts(data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    }
  };

  useEffect(() => {
    fetchHistory();
    socketRef.current = io();

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
    });
    socketRef.current.on("pipeline-update", (data) => {
      setPipelineStep(data);
      if (data.stepId === "IV" && data.progress === 100) {
        handleGeminiRestoration(data.manuscriptId);
        fetchHistory(); // Refresh history after completion
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSidebarTab("Archival Status"); // Switch to restoration view
    const formData = new FormData();
    formData.append("manuscript", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setCurrentManuscript({
        id: data.id,
        url: URL.createObjectURL(file),
        file: file
      });
      fetchHistory();
      
      // Start pipeline
      socketRef.current?.emit("start-restoration", { manuscriptId: data.id });
    } catch (error) {
      console.error("Upload error", error);
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeminiRestoration = async (id: number) => {
    try {
      const manuscript = manuscripts.find(m => m.id === id);
      if (!manuscript) return;

      const result = await restoreManuscript(manuscript.original_path);
      if (result) {
        setRestorationResult(result);
        
        await fetch(`/api/manuscripts/${id}/restore`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restored_text: result.restoredText,
            era: result.era,
            confidence: result.confidence
          }),
        });
        fetchHistory();
      }
    } catch (error) {
      console.error("Restoration error", error);
    }
  };

  const handleChat = async () => {
    if (!chatQuery.trim()) return;

    const userMsg = { role: "user", text: chatQuery };
    setChatHistory(prev => [...prev, userMsg]);
    setChatQuery("");
    setIsChatLoading(true);

    try {
      const response = await scribeChat(chatQuery, chatHistory, restorationResult);
      if (response) {
        setChatHistory(prev => [...prev, { role: "scribe", text: response }]);
      }
    } catch (error) {
      console.error("Chat error", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderMainContent = () => {
    if (sidebarTab === "Manuscripts") {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {manuscripts.map((m) => (
            <div key={m.id} className="bg-surface-container-low rounded-lg p-6 border border-primary/10 shadow-lg hover:border-primary/30 transition-all group">
              <div className="aspect-[3/4] bg-surface-container-lowest rounded mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                  <Scroll size={64} />
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-[8px] uppercase tracking-widest font-bold",
                    m.status === "completed" ? "bg-primary text-on-primary" : "bg-secondary-container text-secondary"
                  )}>
                    {m.status}
                  </span>
                </div>
              </div>
              <h4 className="font-headline text-primary text-sm mb-1 truncate">{m.filename}</h4>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-widest">{m.era || "Unknown Era"}</p>
              {m.confidence && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] text-on-surface-variant">Confidence</span>
                  <span className="text-primary font-bold text-xs">{m.confidence}%</span>
                </div>
              )}
            </div>
          ))}
          {manuscripts.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30">
              <Scroll size={64} className="mx-auto mb-4" />
              <p className="font-headline uppercase tracking-widest text-sm">No manuscripts found</p>
            </div>
          )}
        </section>
      );
    }

    if (sidebarTab === "History") {
      return (
        <section className="bg-surface-container-low rounded-lg border border-primary/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-primary/10">
                <th className="p-4 font-headline text-[10px] uppercase tracking-widest text-primary">Manuscript</th>
                <th className="p-4 font-headline text-[10px] uppercase tracking-widest text-primary">Era</th>
                <th className="p-4 font-headline text-[10px] uppercase tracking-widest text-primary">Confidence</th>
                <th className="p-4 font-headline text-[10px] uppercase tracking-widest text-primary">Status</th>
                <th className="p-4 font-headline text-[10px] uppercase tracking-widest text-primary">Date</th>
              </tr>
            </thead>
            <tbody>
              {manuscripts.map((m) => (
                <tr key={m.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high/50 transition-colors">
                  <td className="p-4 text-sm font-body text-on-surface">{m.filename}</td>
                  <td className="p-4 text-xs font-body text-on-surface-variant italic">{m.era || "-"}</td>
                  <td className="p-4">
                    {m.confidence ? (
                      <span className="text-primary font-bold text-xs">{m.confidence}%</span>
                    ) : "-"}
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-bold",
                      m.status === "completed" ? "bg-primary/20 text-primary" : "bg-secondary-container/20 text-secondary"
                    )}>
                      {m.status}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-on-surface-variant font-mono">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {manuscripts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center opacity-30">
                    <p className="font-headline uppercase tracking-widest text-sm">The archives are empty</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      );
    }

    return (
      <>
        {/* Restored Text Panel */}
        <section className="mb-12">
          <div className="bg-surface-container-low rounded-lg p-10 shadow-inner border border-outline-variant/10 relative overflow-hidden parchment-texture">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Library size={120} />
            </div>
            <label className="font-label text-xs uppercase tracking-[0.3em] text-primary mb-6 block">Deciphered Text Output</label>
            <div className="max-w-3xl">
              {restorationResult ? (
                <p className="text-2xl font-body leading-relaxed text-on-surface italic">
                  {reviewMode ? (
                    restorationResult.restoredText.split(" ").map((word, i) => {
                      const uncertain = restorationResult.uncertainWords.find(uw => uw.word === word);
                      return (
                        <span key={i} className={cn(uncertain && "shaky-underline cursor-help")} title={uncertain ? `Confidence: ${uncertain.confidence}%` : ""}>
                          {word}{" "}
                        </span>
                      );
                    })
                  ) : (
                    `"${restorationResult.restoredText}"`
                  )}
                </p>
              ) : (
                <p className="text-2xl font-body leading-relaxed text-on-surface-variant italic opacity-50">
                  "Waiting for manuscript restoration..."
                </p>
              )}
              
              {restorationResult && (
                <div className="mt-8 flex gap-4">
                  <span className="px-3 py-1 bg-secondary-container/30 text-secondary text-[10px] rounded-full uppercase tracking-tighter">
                    Confidence: {restorationResult.confidence}%
                  </span>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] rounded-full uppercase tracking-tighter">
                    Era: {restorationResult.era}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Manuscript & Pipeline */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          <div className="lg:col-span-8">
            <div className="rounded-lg overflow-hidden shadow-2xl border-4 border-surface-container-high group relative aspect-[4/3] bg-surface-container-lowest">
              {currentManuscript ? (
                <img 
                  src={currentManuscript.url} 
                  alt="Manuscript" 
                  className="w-full h-full object-contain filter sepia-[0.3] brightness-75 group-hover:brightness-90 transition-all duration-700"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30 gap-4">
                  <Upload size={64} />
                  <p className="font-headline uppercase tracking-widest text-sm">Awaiting Parchment</p>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={48} />
                </div>
              )}
            </div>
          </div>

          {/* Pipeline */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <h3 className="font-headline text-xl mb-8 text-on-surface">Restoration Pipeline</h3>
            <div className="relative pl-10 border-l border-outline-variant/30 py-4 flex flex-col gap-12">
              {[
                { id: "I", label: "Initial Scan", msg: "Multi-spectral imaging" },
                { id: "II", label: "Ink Analysis", msg: "Chemical composition" },
                { id: "III", label: "Digital Infills", msg: "Reconstructing characters" },
                { id: "IV", label: "Final Curation", msg: "Historical validation" },
              ].map((step) => {
                const isActive = pipelineStep?.stepId === step.id;
                const isPast = pipelineStep ? (step.id < pipelineStep.stepId || (step.id === pipelineStep.stepId && pipelineStep.isComplete)) : false;
                
                return (
                  <div key={step.id} className={cn("relative transition-opacity duration-500", !isActive && !isPast && "opacity-30")}>
                    <div className={cn(
                      "absolute -left-[54px] top-0 w-8 h-8 rounded-full flex items-center justify-center text-on-surface text-[10px] font-bold transition-all",
                      isPast ? "wax-seal" : isActive ? "wax-seal animate-pulse ring-4 ring-primary/20" : "border-2 border-outline-variant bg-surface"
                    )}>
                      {isPast ? <CheckCircle2 size={14} /> : step.id}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label text-[10px] text-primary uppercase tracking-widest">{step.label}</span>
                      <span className="text-on-surface-variant text-sm italic">
                        {isActive ? pipelineStep.message : isPast ? "Complete" : "Pending..."}
                      </span>
                      {isActive && (
                        <div className="w-full bg-surface-container-high h-1 mt-3 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pipelineStep.progress}%` }}
                            className="bg-primary h-full" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Scribe's Notebook Chat */}
        <section>
          <div className="bg-surface-container-high rounded-xl p-6 shadow-2xl border border-primary/10 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-surface-container-lowest border border-primary/20 flex items-center justify-center">
                <BookOpen className="text-primary" size={32} />
              </div>
              <div className="flex-grow">
                <h4 className="font-headline text-lg text-primary mb-1">Scribe's Notebook</h4>
                <p className="text-on-surface-variant text-sm italic">"Ask me about the paleography of this fragment or the ink's origin."</p>
              </div>
              <div className="w-full md:w-1/2 relative">
                <input 
                  className="w-full bg-surface-container-lowest border-outline-variant/20 border rounded-full py-4 px-8 focus:ring-1 focus:ring-primary focus:border-primary text-sm font-body outline-none" 
                  placeholder="Query the Scribe..." 
                  type="text"
                  value={chatQuery}
                  onChange={(e) => setChatQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChat()}
                />
                <button 
                  onClick={handleChat}
                  disabled={isChatLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {isChatLoading ? <Loader2 className="animate-spin" size={20} /> : <PenTool size={20} />}
                </button>
              </div>
            </div>
            
            {/* Chat History */}
            <AnimatePresence>
              {chatHistory.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="flex flex-col gap-4 mt-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                >
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn(
                      "p-4 rounded-lg text-sm",
                      msg.role === "user" ? "bg-surface-container-low ml-12 border-l-2 border-primary/20" : "bg-surface-container-lowest mr-12 border-r-2 border-primary/40 italic"
                    )}>
                      <span className="text-[10px] uppercase tracking-widest text-primary block mb-1">{msg.role}</span>
                      {msg.text}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body selection:bg-primary/30">
      {/* TopNavBar */}
      <header className="flex justify-between items-center w-full px-12 h-20 fixed top-0 z-50 bg-background border-b-2 border-primary/20 shadow-[0px_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-headline font-bold text-primary tracking-widest uppercase">Ancient Document Restorer</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 font-headline text-on-surface tracking-tight">
          {["Restore", "Gallery", "Review", "Settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Gallery") setSidebarTab("Manuscripts");
                if (tab === "Restore") setSidebarTab("Archival Status");
              }}
              className={cn(
                "transition-colors text-sm uppercase tracking-widest",
                activeTab === tab ? "text-primary border-b-2 border-primary pb-1 font-bold" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tab}
            </button>
          ))}
          <button 
            onClick={() => setReviewMode(!reviewMode)}
            className={cn(
              "px-4 py-1 rounded-full text-[10px] uppercase tracking-widest transition-all",
              reviewMode ? "bg-primary text-on-primary font-bold" : "bg-surface-container-high text-on-surface-variant"
            )}
          >
            Review Mode: {reviewMode ? "ON" : "OFF"}
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <button className="p-2 text-primary hover:bg-surface-container-low rounded-full transition-all duration-300">
            <UserCircle size={24} />
          </button>
        </div>
      </header>

      <div className="flex pt-20">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-20 flex flex-col pt-10 h-[calc(100vh-80px)] bg-surface-container-low w-72 border-r border-primary/10 shadow-2xl z-40 overflow-hidden">
          <div className="px-8 mb-10">
            <h2 className="text-lg font-headline text-primary">The Archivist</h2>
            <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/60">Custodian of Light</p>
          </div>
          <nav className="flex flex-col flex-grow gap-2">
            {[
              { icon: BookOpen, label: "Scribe's Notebook" },
              { icon: ShieldCheck, label: "Archival Status" },
              { icon: Scroll, label: "Manuscripts" },
              { icon: Archive, label: "History" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setSidebarTab(item.label)}
                className={cn(
                  "flex items-center gap-4 py-4 pl-8 transition-all font-headline text-sm uppercase tracking-widest text-left",
                  sidebarTab === item.label 
                    ? "text-primary bg-background rounded-r-full border-y border-r border-primary/20 shadow-[10px_0_15px_rgba(0,0,0,0.3)]" 
                    : "text-on-surface-variant hover:translate-x-2"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-bold py-4 rounded-full shadow-lg hover:scale-[0.98] active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" size={16} /> : "New Restoration"}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-72 flex-grow p-12 bg-surface">
          {renderMainContent()}
        </main>
      </div>


      {/* Decorative Corner Filigree */}
      <div className="fixed bottom-0 right-0 pointer-events-none opacity-20 w-48 h-48 overflow-hidden z-0">
        <svg className="fill-primary" viewBox="0 0 100 100">
          <path d="M100 0 C 100 50, 50 100, 0 100 L 100 100 Z"></path>
        </svg>
      </div>
    </div>
  );
}
