import React, { useState } from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Building2,
  GraduationCap,
  Sparkles,
  Award,
  BookOpenCheck,
  CheckCircle,
  HelpCircle,
  History,
} from "lucide-react";
import { POPULAR_PRESETS, ResearchPreset } from "../data/presets";
import { ResearchSession } from "../types";

interface TaskPanelProps {
  university: string;
  setUniversity: (val: string) => void;
  major: string;
  setMajor: (val: string) => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  session?: ResearchSession;
  history: ResearchSession[];
  onSelectHistory: (id: string) => void;
  isLoading?: boolean;
}

export const TaskPanel: React.FC<TaskPanelProps> = ({
  university,
  setUniversity,
  major,
  setMajor,
  onStart,
  onPause,
  onResume,
  onStop,
  session,
  history,
  onSelectHistory,
  isLoading,
}) => {
  const [showPresets, setShowPresets] = useState(true);

  const isRunning = session && !["IDLE", "COMPLETED", "ERROR", "BLOCKED"].includes(session.status);
  const isPaused = session?.isPaused;

  const handleApplyPreset = (preset: ResearchPreset) => {
    setUniversity(preset.university);
    setMajor(preset.major);
  };

  return (
    <div className="bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Header section */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            Research Target
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            Auto Agent
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Enter university and undergraduate major. AI will autonomously browse official sources.
        </p>
      </div>

      {/* Main Form */}
      <div className="p-4 space-y-4">
        {/* University input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            University Name
          </label>
          <input
            type="text"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            disabled={isRunning || isLoading}
            placeholder="e.g. University of Manchester"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-60 transition"
          />
        </div>

        {/* Major input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <BookOpenCheck className="w-3.5 h-3.5 text-blue-400" />
            Undergraduate Major / Course
          </label>
          <input
            type="text"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            disabled={isRunning || isLoading}
            placeholder="e.g. Computer Science BSc"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:opacity-60 transition"
          />
        </div>

        {/* Primary Action Buttons */}
        {!isRunning ? (
          <button
            onClick={onStart}
            disabled={!university.trim() || !major.trim() || isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-cyan-600/20 hover:shadow-cyan-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? "Launching Browser..." : "Start Autonomous Research"}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {!isPaused ? (
              <button
                onClick={onPause}
                className="py-2 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Agent
              </button>
            ) : (
              <button
                onClick={onResume}
                className="py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Agent
              </button>
            )}

            <button
              onClick={onStop}
              className="py-2 px-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Session
            </button>
          </div>
        )}

        {/* Requirements checklist auto-researched */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            Agent Research Checklist
          </div>
          <ul className="text-xs space-y-1.5 text-slate-300">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                International A Level Requirements
              </span>
              <span className="text-[10px] text-slate-500">Auto</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                IELTS Academic Scores
              </span>
              <span className="text-[10px] text-slate-500">Auto</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                Subject Prerequisites
              </span>
              <span className="text-[10px] text-slate-500">Auto</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                Entry Year & PDF Sources
              </span>
              <span className="text-[10px] text-slate-500">Auto</span>
            </li>
          </ul>
        </div>

        {/* Popular Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">Quick Test Presets</span>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="hover:text-slate-200 transition text-[11px]"
            >
              {showPresets ? "Hide" : "Show"}
            </button>
          </div>

          {showPresets && (
            <div className="space-y-1.5">
              {POPULAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  disabled={isRunning || isLoading}
                  className="w-full text-left p-2.5 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 transition group"
                >
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition">
                    {preset.university}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                    <span>{preset.major}</span>
                    <span className="text-[10px] text-cyan-500/80 group-hover:text-cyan-400">Use</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Past sessions history */}
        {history.length > 0 && (
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-400" />
              Recent Research History
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {history.slice(0, 5).map((item) => (
                <button
                  key={item.researchId}
                  onClick={() => onSelectHistory(item.researchId)}
                  className={`w-full text-left p-2 rounded-lg border text-xs transition flex items-center justify-between ${
                    session?.researchId === item.researchId
                      ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-200"
                      : "bg-slate-950/50 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate text-slate-200">{item.university}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.major}</div>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-cyan-500/20 text-cyan-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
