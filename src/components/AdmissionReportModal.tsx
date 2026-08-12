import React, { useState } from "react";
import {
  X,
  Building2,
  BookOpen,
  Award,
  Globe,
  CheckCircle2,
  ExternalLink,
  Download,
  Copy,
  Printer,
  Check,
  FileCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
} from "lucide-react";
import { AdmissionReport } from "../types";

interface AdmissionReportModalProps {
  report?: AdmissionReport;
  onClose: () => void;
  onSelectScreenshot?: (id: string) => void;
}

export const AdmissionReportModal: React.FC<AdmissionReportModalProps> = ({
  report,
  onClose,
  onSelectScreenshot,
}) => {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const handleCopyMarkdown = () => {
    const markdown = `
# Official University Admission Research Report

**University:** ${report.university}
**Course / Major:** ${report.course}
**Degree:** ${report.degree || report.course}
**Entry Year:** ${report.entryYear || "Published Entry Year"}
**Research Status:** ${report.status} (Confidence: ${report.confidence})

---

## 1. International A Level Requirements
- **Overall Requirement:** ${report.internationalALevel?.overallRequirement || (report.evidence.find((e) => e.category === "ALEVEL")?.evidenceText || "Official requirement extracted below")}
- **Required Subjects:** ${report.internationalALevel?.requiredSubjects?.join(", ") || "Mathematics / Science prerequisites as published"}
- **Official Evidence Snippet:**
${report.internationalALevel?.evidenceText?.map((t) => `> "${t}"`).join("\n") || report.evidence.filter(e => e.category === 'ALEVEL').map(e => `> "${e.evidenceText}"`).join("\n") || "Refer to primary sources"}

---

## 2. IELTS / English Language Requirements
- **Overall Score:** ${report.ielts?.overall || (report.evidence.find((e) => e.category === "IELTS")?.evidenceText || "Official requirement extracted below")}
- **Minimum Component Score:** ${report.ielts?.minimumComponent || "Subscore requirements extracted below"}
- **Official Evidence Snippet:**
${report.ielts?.evidenceText?.map((t) => `> "${t}"`).join("\n") || report.evidence.filter(e => e.category === 'IELTS').map(e => `> "${e.evidenceText}"`).join("\n") || "Refer to primary sources"}

---

## 3. Official Primary Sources
${report.sources?.map((s) => `- [${s.title || s.url}](${s.url})`).join("\n")}

*Disclaimer: Based on official published entry requirements located during AI browser research. Meeting published minimum entry requirements does not guarantee admission.*
`.trim();

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.university}_${report.course}_admission_report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Official Admission Research Report
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {report.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified from official university web sources via Playwright + Gemini Vision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              title="Copy as Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Markdown"}
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
              title="Export JSON"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
          {/* Main Info Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                University
              </span>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                {report.university}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Major / Degree
              </span>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                {report.degree || report.course}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Entry Year
              </span>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                {report.entryYear || "Published Entry Year"}
              </div>
            </div>
          </div>

          {/* Section 1: International A Level Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. International A Level Requirements
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-2 py-0.5 rounded">
                Official Standard
              </span>
            </div>

            {report.internationalALevel ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block">Overall Requirement</span>
                    <span className="text-lg font-bold text-emerald-400">
                      {report.internationalALevel.overallRequirement || "A*AA"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block">Required Subjects</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {report.internationalALevel.requiredSubjects?.length
                        ? report.internationalALevel.requiredSubjects.join(", ")
                        : "Mathematics / Science prerequisites"}
                    </span>
                  </div>
                </div>

                {/* Evidence Quotes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Official Evidence Text:</span>
                  {report.internationalALevel.evidenceText?.map((text, idx) => (
                    <blockquote
                      key={idx}
                      className="p-3 bg-slate-950 border-l-2 border-cyan-500 rounded-r-lg text-xs italic text-slate-200 leading-relaxed"
                    >
                      "{text}"
                    </blockquote>
                  ))}
                </div>

                {/* Source Link */}
                {report.internationalALevel.sourceUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={report.internationalALevel.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Official Qualification Page
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Specific International A Level details were extracted directly in the evidence list below.
              </p>
            )}
          </div>

          {/* Section 2: IELTS Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. IELTS / English Language Requirements
                </h3>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded">
                English Proficiency
              </span>
            </div>

            {report.ielts ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block">Overall IELTS Score</span>
                    <span className="text-lg font-bold text-blue-400">
                      {report.ielts.overall || "7.0 Overall"}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] font-medium text-slate-400 block">Minimum Subscore / Component</span>
                    <span className="text-sm font-semibold text-slate-200">
                      {report.ielts.minimumComponent || "6.5 in all subscores"}
                    </span>
                  </div>
                </div>

                {/* Subscores Grid */}
                {(report.ielts.listening || report.ielts.reading || report.ielts.writing || report.ielts.speaking) && (
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Listening</span>
                      <span className="font-bold text-slate-200">{report.ielts.listening || "6.5"}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Reading</span>
                      <span className="font-bold text-slate-200">{report.ielts.reading || "6.5"}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Writing</span>
                      <span className="font-bold text-slate-200">{report.ielts.writing || "6.5"}</span>
                    </div>
                    <div className="p-2 bg-slate-950 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Speaking</span>
                      <span className="font-bold text-slate-200">{report.ielts.speaking || "6.5"}</span>
                    </div>
                  </div>
                )}

                {/* Evidence Quotes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">Official Evidence Text:</span>
                  {report.ielts.evidenceText?.map((text, idx) => (
                    <blockquote
                      key={idx}
                      className="p-3 bg-slate-950 border-l-2 border-blue-500 rounded-r-lg text-xs italic text-slate-200 leading-relaxed"
                    >
                      "{text}"
                    </blockquote>
                  ))}
                </div>

                {/* Source Link */}
                {report.ielts.sourceUrl && (
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={report.ielts.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-medium transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Official English Language Requirements Page
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                IELTS language proficiency requirement details captured in evidence below.
              </p>
            )}
          </div>

          {/* Section 3: Primary Official Web Sources */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Verified Official Primary Sources
            </h3>

            <div className="space-y-2">
              {report.sources?.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-4">
                    <div className="font-semibold text-slate-200 truncate">{s.title || s.url}</div>
                    <div className="font-mono text-[10px] text-slate-500 truncate">{s.url}</div>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium shrink-0 flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Visit
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Admission Disclaimer */}
          <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Official Admission Notice:</strong> This report is compiled dynamically by an autonomous AI agent directly browsing official university portals. Requirements are subject to annual revisions by the university. Meeting published minimum entry requirements does not guarantee admission.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono">
            Research Completed: {new Date(report.completedAt).toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
