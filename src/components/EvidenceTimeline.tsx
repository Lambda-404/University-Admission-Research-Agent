import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Clock,
  ExternalLink,
  X,
  Maximize2,
  Bot,
  Globe,
} from "lucide-react";
import { ResearchSession, ScreenshotMetadata, ResearchStep } from "../types";

interface EvidenceTimelineProps {
  session?: ResearchSession;
  selectedScreenshotId?: string;
  onSelectScreenshot?: (id?: string) => void;
}

export const EvidenceTimeline: React.FC<EvidenceTimelineProps> = ({
  session,
  selectedScreenshotId,
  onSelectScreenshot,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = session?.steps || [];
  const screenshots = session?.screenshots || [];

  const activeModalScreenshot = screenshots.find((s) => s.id === selectedScreenshotId);

  if (steps.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bottom Timeline Bar */}
      <div className="bg-slate-900 border-t border-slate-800 text-slate-200 shadow-2xl z-20">
        {/* Toggle Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 cursor-pointer flex items-center justify-between border-b border-slate-800 text-xs select-none transition"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-100 uppercase tracking-wider">
              Screenshot & Visual Evidence Timeline ({steps.length} steps)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px]">Click thumbnail to inspect full resolution</span>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>

        {/* Expandable Screenshot Strip */}
        {isExpanded && (
          <div className="p-3 overflow-x-auto bg-slate-950 max-h-48 flex items-center gap-3 scrollbar-thin scrollbar-thumb-slate-800">
            {steps.map((step) => {
              const sc = screenshots.find((s) => s.id === step.screenshotId) || screenshots[step.stepNumber - 1];

              return (
                <div
                  key={step.stepNumber}
                  onClick={() => sc && onSelectScreenshot?.(sc.id)}
                  className="shrink-0 w-52 bg-slate-900 border border-slate-800 hover:border-cyan-500 rounded-lg p-2 cursor-pointer transition group shadow-md"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span className="font-bold text-cyan-400">STEP {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </div>

                  {/* Image Preview Box */}
                  <div className="relative aspect-[16/10] bg-slate-950 rounded border border-slate-800 overflow-hidden mb-1.5 group-hover:border-cyan-500/50 transition">
                    {sc?.dataUrl || step.screenshotUrl ? (
                      <img
                        src={sc?.dataUrl || step.screenshotUrl}
                        alt={`Step ${step.stepNumber}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Action Description */}
                  <div className="text-[11px] font-medium text-slate-200 truncate">
                    {step.action.displayLabel || step.action.reason}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {step.url}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Screenshot Inspector Modal */}
      {activeModalScreenshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Top Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Step {activeModalScreenshot.stepNumber} Screenshot Evidence
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {activeModalScreenshot.url}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onSelectScreenshot?.(undefined)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-slate-950">
              {activeModalScreenshot.dataUrl && (
                <img
                  src={activeModalScreenshot.dataUrl}
                  alt={`Screenshot ${activeModalScreenshot.id}`}
                  className="max-w-full max-h-[65vh] object-contain rounded-lg border border-slate-800 shadow-xl"
                />
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 border-t border-slate-800 bg-slate-900 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Action: {activeModalScreenshot.action.displayLabel || activeModalScreenshot.action.reason}
                </span>
                <a
                  href={activeModalScreenshot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Open Source URL
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
