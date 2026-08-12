import React, { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { TaskPanel } from "./components/TaskPanel";
import { LiveBrowserView } from "./components/LiveBrowserView";
import { AgentPanel } from "./components/AgentPanel";
import { EvidenceTimeline } from "./components/EvidenceTimeline";
import { AdmissionReportModal } from "./components/AdmissionReportModal";
import { HistoryModal } from "./components/HistoryModal";
import { ResearchSession, WSMessage } from "./types";

export function App() {
  const [university, setUniversity] = useState("University of Manchester");
  const [major, setMajor] = useState("Computer Science BSc");
  const [session, setSession] = useState<ResearchSession | undefined>(undefined);
  const [history, setHistory] = useState<ResearchSession[]>([]);
  const [frameDataUrl, setFrameDataUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedScreenshotId, setSelectedScreenshotId] = useState<string | undefined>(undefined);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch past research history on load
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/research/list");
      const data = await res.json();
      if (data.sessions) {
        setHistory(data.sessions);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Setup WebSocket connection whenever active research session changes
  useEffect(() => {
    if (!session?.researchId) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/research?researchId=${session.researchId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        if (msg.type === "browser_frame") {
          setFrameDataUrl(msg.dataUrl);
        } else if (msg.type === "state_update") {
          setSession((prev) => (prev ? { ...prev, ...msg.session } : (msg.session as ResearchSession)));
        } else if (msg.type === "step_completed") {
          setSession((prev) => {
            if (!prev) return prev;
            const steps = [...prev.steps];
            const idx = steps.findIndex((s) => s.stepNumber === msg.step.stepNumber);
            if (idx >= 0) {
              steps[idx] = msg.step;
            } else {
              steps.push(msg.step);
            }

            const screenshots = [...prev.screenshots];
            if (msg.screenshot && !screenshots.some((sc) => sc.id === msg.screenshot?.id)) {
              screenshots.push(msg.screenshot);
            }

            return { ...prev, steps, screenshots };
          });
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [session?.researchId]);

  // Automatically pop up admission report when completed
  useEffect(() => {
    if (session?.status === "COMPLETED" && session?.report) {
      setShowReportModal(true);
      fetchHistory();
    }
  }, [session?.status, session?.report]);

  const handleStartResearch = async () => {
    if (!university.trim() || !major.trim()) return;

    setIsLoading(true);
    setFrameDataUrl(undefined);

    try {
      const res = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ university, major }),
      });
      const data = await res.json();

      if (data.session) {
        setSession(data.session);
        fetchHistory();
      }
    } catch (err) {
      console.error("Failed to start research:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    if (!session?.researchId) return;
    await fetch(`/api/research/${session.researchId}/pause`, { method: "POST" });
  };

  const handleResume = async () => {
    if (!session?.researchId) return;
    await fetch(`/api/research/${session.researchId}/resume`, { method: "POST" });
  };

  const handleStop = async () => {
    if (!session?.researchId) return;
    await fetch(`/api/research/${session.researchId}/stop`, { method: "POST" });
  };

  const handleSelectHistorySession = async (id: string) => {
    try {
      const res = await fetch(`/api/research/${id}`);
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setUniversity(data.session.university);
        setMajor(data.session.major);
        if (data.session.report) {
          setShowReportModal(true);
        }
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Application Header */}
      <Header
        researchId={session?.researchId}
        status={session?.status}
        stepCount={session?.stepCount}
        maxSteps={session?.maxSteps}
        evidenceCount={session?.evidence.length}
        onOpenReport={() => setShowReportModal(true)}
        onNewResearch={() => setSession(undefined)}
        onOpenHistory={() => setShowHistoryModal(true)}
        hasReport={!!session?.report}
      />

      {/* Main 3-Column Workstation Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Task Input & Presets */}
        <div className="w-80 shrink-0 hidden lg:block">
          <TaskPanel
            university={university}
            setUniversity={setUniversity}
            major={major}
            setMajor={setMajor}
            onStart={handleStartResearch}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            session={session}
            history={history}
            onSelectHistory={handleSelectHistorySession}
            isLoading={isLoading}
          />
        </div>

        {/* Center Column - Real-time Live Browser Stream Viewport */}
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <LiveBrowserView
            session={session}
            frameDataUrl={frameDataUrl}
            onPause={handlePause}
            onResume={handleResume}
          />
        </div>

        {/* Right Column - Agent Reasoning & Evidence Activity */}
        <div className="w-88 shrink-0 hidden xl:block">
          <AgentPanel
            session={session}
            onOpenReport={() => setShowReportModal(true)}
            onSelectStepScreenshot={(scId) => setSelectedScreenshotId(scId)}
          />
        </div>
      </div>

      {/* Bottom Timeline - Screenshots & Evidence */}
      <EvidenceTimeline
        session={session}
        selectedScreenshotId={selectedScreenshotId}
        onSelectScreenshot={(scId) => setSelectedScreenshotId(scId)}
      />

      {/* Modals */}
      {showReportModal && (
        <AdmissionReportModal
          report={session?.report}
          onClose={() => setShowReportModal(false)}
          onSelectScreenshot={(scId) => setSelectedScreenshotId(scId)}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          sessions={history}
          onClose={() => setShowHistoryModal(false)}
          onSelectSession={handleSelectHistorySession}
        />
      )}
    </div>
  );
}
export default App;
