import React from "react";
import { Bot, Sparkles, Globe2, Layers, CheckCircle2, RefreshCw } from "lucide-react";

interface HeaderProps {
  researchId?: string;
  status?: string;
  stepCount?: number;
  maxSteps?: number;
  evidenceCount?: number;
  onOpenReport?: () => void;
  onNewResearch?: () => void;
  onOpenHistory?: () => void;
  hasReport?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  stepCount = 0,
  maxSteps = 35,
  evidenceCount = 0,
  onOpenReport,
  onNewResearch,
  onOpenHistory,
  hasReport,
}) => {
  const isRunning = status && !["IDLE", "COMPLETED", "ERROR", "BLOCKED"].includes(status);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg tracking-tight text-white flex items-center gap-2">
                University Admission Research Agent
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Autonomous AI
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              Real Chromium Automation • Playwright + Gemini Multimodal Vision
            </p>
          </div>
        </div>

        {/* Status indicator & stats */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          {isRunning && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <span>
                STEP {stepCount} / {maxSteps}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>EVIDENCE: <strong className="text-emerald-400 font-sans">{evidenceCount}</strong></span>
          </div>

          {hasReport && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-sans text-xs font-medium transition shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              View Official Report
            </button>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            History
          </button>
          <button
            onClick={onNewResearch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New Research
          </button>
        </div>
      </div>
    </header>
  );
};
