import React from "react";
import { X, History, Building2, BookOpen, Calendar, CheckCircle2, Award } from "lucide-react";
import { ResearchSession } from "../types";

interface HistoryModalProps {
  sessions: ResearchSession[];
  onClose: () => void;
  onSelectSession: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  sessions,
  onClose,
  onSelectSession,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Research Sessions History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950">
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No research history available yet.
            </p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.researchId}
                onClick={() => {
                  onSelectSession(session.researchId);
                  onClose();
                }}
                className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500 rounded-xl cursor-pointer transition space-y-2 group shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    {session.university}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      session.status === "COMPLETED"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-cyan-950 text-cyan-400 border border-cyan-800"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  {session.major}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(session.createdAt).toLocaleString()}
                  </span>
                  <span className="text-cyan-400 font-medium group-hover:underline">
                    Load Session & Report →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
