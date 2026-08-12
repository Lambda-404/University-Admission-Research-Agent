import React, { useState } from "react";
import {
  Activity,
  History,
  Award,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Bot,
  Layers,
  Search,
  BookOpen,
  Globe,
  FileText,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { ResearchSession, EvidenceItem, ResearchStep } from "../types";

interface AgentPanelProps {
  session?: ResearchSession;
  onOpenReport?: () => void;
  onSelectStepScreenshot?: (screenshotId: string) => void;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  session,
  onOpenReport,
  onSelectStepScreenshot,
}) => {
  const [activeTab, setActiveTab] = useState<"activity" | "timeline" | "evidence">("activity");

  const latestStep: ResearchStep | undefined = session?.steps[session.steps.length - 1];
  const steps = session?.steps || [];
  const evidence = session?.evidence || [];

  const confidenceColor =
    session?.confidence === "HIGH"
      ? "text-emerald-400 bg-emerald-950/60 border-emerald-500/30"
      : session?.confidence === "MEDIUM"
      ? "text-amber-400 bg-amber-950/60 border-amber-500/30"
      : "text-slate-400 bg-slate-900 border-slate-700";

  return (
    <div className="bg-slate-900 text-slate-200 flex flex-col h-full border-l border-slate-800">
      {/* Panel Top Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Agent Reasoning & State
          </h2>
        </div>

        {/* Confidence Badge */}
        {session && (
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${confidenceColor}`}
          >
            CONFIDENCE: {session.confidence}
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-xs bg-slate-950 font-medium">
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "activity"
              ? "border-cyan-500 text-cyan-300 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Activity
        </button>

        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "timeline"
              ? "border-cyan-500 text-cyan-300 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Timeline ({steps.length})
        </button>

        <button
          onClick={() => setActiveTab("evidence")}
          className={`flex-1 py-2 px-3 text-center border-b-2 transition flex items-center justify-center gap-1.5 ${
            activeTab === "evidence"
              ? "border-cyan-500 text-cyan-300 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Evidence ({evidence.length})
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* LIVE ACTIVITY TAB */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            {/* Observe - Plan - Action - Result Breakdown */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Agent Loop (Observe → Plan → Act)
              </div>

              {/* Observe */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3" /> OBSERVE
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestStep?.observeText || "Browser is navigating to university search results..."}
                </p>
              </div>

              {/* Plan */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-blue-400 tracking-wider uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PLAN
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestStep?.planText || session?.currentObjective || "Locating official undergraduate course page..."}
                </p>
              </div>

              {/* Action */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1">
                  <Bot className="w-3 h-3" /> ACTION
                </div>
                <p className="text-xs font-mono text-indigo-200 bg-indigo-950/40 p-1.5 rounded border border-indigo-800/40">
                  {session?.currentAction?.type}: {session?.currentAction?.displayLabel || session?.currentAction?.reason}
                </p>
              </div>

              {/* Result */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> RESULT
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {latestStep?.resultSummary || "Executing browser automation event and refreshing viewport frame."}
                </p>
              </div>
            </div>

            {/* Discovered Evidence Summary Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Discovered Entry Requirements
                </span>
                <span className="text-xs font-bold text-emerald-400">{evidence.length} verified</span>
              </div>

              {evidence.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  No explicit requirements extracted yet. Agent is navigating university pages...
                </p>
              ) : (
                <div className="space-y-2">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {item.category}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {item.sourceTitle}
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium">{item.evidenceText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Official Report Button */}
            {session?.status === "COMPLETED" && (
              <button
                onClick={onOpenReport}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <FileCheck className="w-4 h-4" />
                Open Full Official Admission Report
              </button>
            )}
          </div>
        )}

        {/* STEP TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="space-y-3">
            {steps.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">No research steps executed yet.</p>
            ) : (
              steps.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className="font-mono text-cyan-400 font-bold">
                      STEP {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      {step.action.displayLabel || step.action.reason}
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 truncate">
                      {step.url}
                    </div>

                    <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
                      {step.resultSummary}
                    </p>
                  </div>

                  {step.screenshotId && (
                    <button
                      onClick={() => onSelectStepScreenshot?.(step.screenshotId!)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition pt-1"
                    >
                      <FileText className="w-3 h-3" />
                      View Step Screenshot
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* EVIDENCE LIST TAB */}
        {activeTab === "evidence" && (
          <div className="space-y-3">
            {evidence.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">
                No verified requirements discovered yet.
              </p>
            ) : (
              evidence.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.sourceType}</span>
                  </div>

                  <p className="text-slate-100 font-medium leading-relaxed bg-slate-900 p-2 rounded border border-slate-800">
                    "{item.evidenceText}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition flex items-center gap-1 truncate max-w-[200px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {item.sourceTitle || item.sourceUrl}
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
