import React, { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Lock,
  Globe,
  MousePointer2,
  Eye,
  AlertCircle,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  ExternalLink,
  Layers,
  Sparkles,
  Bot,
} from "lucide-react";
import { ResearchSession, AgentAction } from "../types";

interface LiveBrowserViewProps {
  session?: ResearchSession;
  frameDataUrl?: string;
  onPause?: () => void;
  onResume?: () => void;
}

export const LiveBrowserView: React.FC<LiveBrowserViewProps> = ({
  session,
  frameDataUrl,
  onPause,
  onResume,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number; tag: string }>({
    x: 640,
    y: 400,
    tag: "AI READING",
  });

  const isRunning = session && !["IDLE", "COMPLETED", "ERROR", "BLOCKED"].includes(session.status);
  const isPaused = session?.isPaused;

  // Update AI cursor overlay based on session state or step action
  useEffect(() => {
    if (session?.cursorPosition) {
      setCursorPos({
        x: session.cursorPosition.x ?? 640,
        y: session.cursorPosition.y ?? 400,
        tag: session.cursorPosition.tag || "AI READING",
      });
    } else if (session?.currentAction) {
      const act = session.currentAction;
      let tag = "AI READING";
      if (act.type === "CLICK" || act.type === "DOUBLE_CLICK") tag = "AI CLICK";
      else if (act.type === "SEARCH" || act.type === "TYPE") tag = "AI TYPING";
      else if (act.type === "SCROLL") tag = "AI SCROLLING";

      setCursorPos({
        x: act.x ?? 640,
        y: act.y ?? 400,
        tag,
      });
    }
  }, [session?.cursorPosition, session?.currentAction]);

  const currentUrl = session?.currentUrl || "https://www.google.com";
  const currentTitle = session?.currentPageTitle || "Autonomous Browser Active";
  const currentAction = session?.currentAction;

  // Compute cursor position scaled to container
  const cursorLeftPercent = (cursorPos.x / 1280) * 100;
  const cursorTopPercent = (cursorPos.y / 800) * 100;

  return (
    <div
      ref={containerRef}
      className={`bg-slate-950 flex flex-col h-full border-r border-slate-800 ${
        isFullscreen ? "fixed inset-0 z-50 p-4 bg-slate-950" : "relative"
      }`}
    >
      {/* Top Browser Chrome / Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-2.5 flex flex-col gap-2">
        {/* Tab Strip */}
        <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2 px-1">
          <div className="flex items-center gap-1 overflow-x-auto max-w-[80%]">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 text-cyan-300 rounded-t-lg border-t-2 border-cyan-500 font-medium text-[11px] truncate shadow-inner">
              <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate max-w-[200px]">{currentTitle}</span>
            </div>
            {session?.university && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 text-slate-400 rounded-t-lg font-medium text-[11px] truncate">
                <span>{session.university} Official Site</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                isRunning
                  ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                  : isPaused
                  ? "bg-amber-950/80 border-amber-500/40 text-amber-300"
                  : session?.status === "COMPLETED"
                  ? "bg-blue-950/80 border-blue-500/40 text-blue-300"
                  : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? "bg-emerald-400 animate-pulse"
                    : isPaused
                    ? "bg-amber-400"
                    : session?.status === "COMPLETED"
                    ? "bg-blue-400"
                    : "bg-slate-500"
                }`}
              />
              <span className="uppercase font-bold tracking-wider text-[10px]">
                {session?.status || "IDLE"}
              </span>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
              title="Toggle Fullscreen Viewport"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Address & Navigation Bar */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400">
            <button className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-40" disabled>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-slate-800 rounded transition disabled:opacity-40" disabled>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-slate-800 rounded transition" title="Refresh frame">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Address input */}
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 shadow-inner">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-mono text-[11px] truncate flex-1">{currentUrl}</span>
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-cyan-400 transition"
              title="Open current page in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-950 border border-slate-800 rounded">
            VIEW-ONLY
          </div>
        </div>
      </div>

      {/* Main Live Browser Frame Screen */}
      <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-2 min-h-[420px]">
        {/* Render Live Browser Stream or Idle Placeholder */}
        {frameDataUrl || session?.lastFrameDataUrl ? (
          <div className="relative w-full h-full max-w-[1280px] max-h-[800px] flex items-center justify-center bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
            <img
              src={frameDataUrl || session?.lastFrameDataUrl}
              alt="Live Browser Viewport"
              className="w-full h-full object-contain select-none"
            />

            {/* AI Cursor Pointer Overlay */}
            {isRunning && (
              <div
                className="absolute pointer-events-none transition-all duration-500 ease-out z-20 flex flex-col items-start"
                style={{
                  left: `${cursorLeftPercent}%`,
                  top: `${cursorTopPercent}%`,
                  transform: "translate(-2px, -2px)",
                }}
              >
                {/* SVG Pointer Icon */}
                <div className="relative">
                  <MousePointer2 className="w-6 h-6 text-cyan-400 fill-cyan-400/30 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] stroke-[2]" />

                  {/* Ripple animation ring when clicking */}
                  {cursorPos.tag === "AI CLICK" && (
                    <span className="absolute -inset-2 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                  )}
                </div>

                {/* AI Tag badge */}
                <div className="mt-1 px-2 py-0.5 rounded-full bg-cyan-900/90 border border-cyan-400/80 text-[10px] font-bold text-cyan-200 tracking-wider uppercase shadow-lg shadow-cyan-950 backdrop-blur-sm whitespace-nowrap flex items-center gap-1">
                  <Bot className="w-3 h-3 text-cyan-300" />
                  {cursorPos.tag}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Idle or Initializing State */
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-xl">
              <Globe className="w-8 h-8 animate-pulse text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                {session ? "Initializing Real Playwright Browser..." : "Ready for Autonomous Research"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {session
                  ? "Launching Chromium instance and connecting live frame stream..."
                  : "Enter a university name and undergraduate major on the left panel to watch the AI browse live."}
              </p>
            </div>
          </div>
        )}

        {/* Floating Viewport Status Banner */}
        {isRunning && (
          <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 flex items-center gap-2 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-medium text-emerald-400">LIVE BROWSER STREAM</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px]">1280 × 800 Viewport</span>
          </div>
        )}
      </div>

      {/* Current Action Bar Below Browser */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 truncate">
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 shrink-0">
            CURRENT ACTION
          </span>
          <p className="text-slate-200 font-medium truncate">
            {currentAction?.displayLabel || currentAction?.reason || "AI agent observing current page layout..."}
          </p>
        </div>

        {/* Action Controls */}
        {isRunning && (
          <div className="flex items-center gap-2 shrink-0">
            {isPaused ? (
              <button
                onClick={onResume}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium flex items-center gap-1 transition"
              >
                <Play className="w-3 h-3" /> Resume
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-2.5 py-1 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1 transition"
              >
                <Pause className="w-3 h-3" /> Pause
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
