import { BrowserController, BrowserFrameInfo } from "./browserController";
import { GeminiAgentService } from "./geminiService";
import { ActionValidator } from "./actionValidator";
import {
  ResearchSession,
  AgentStatus,
  ResearchStep,
  ScreenshotMetadata,
  EvidenceItem,
  WSMessage,
} from "../types";
import { WebSocket } from "ws";

export class AdmissionResearchAgent {
  private sessions: Map<string, ResearchSession> = new Map();
  private browserControllers: Map<string, BrowserController> = new Map();
  private geminiService: GeminiAgentService;
  private wsClients: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    this.geminiService = new GeminiAgentService();
  }

  public registerWSClient(researchId: string, ws: WebSocket) {
    if (!this.wsClients.has(researchId)) {
      this.wsClients.set(researchId, new Set());
    }
    this.wsClients.get(researchId)!.add(ws);

    // Send latest frame and session state immediately upon connection
    const session = this.sessions.get(researchId);
    if (session) {
      this.sendToClient(ws, {
        type: "state_update",
        researchId,
        session,
      });
      if (session.lastFrameDataUrl) {
        this.sendToClient(ws, {
          type: "browser_frame",
          researchId,
          dataUrl: session.lastFrameDataUrl,
          url: session.currentUrl,
          title: session.currentPageTitle,
          cursor: session.cursorPosition,
          viewport: { width: 1280, height: 800 },
        });
      }
    }

    ws.on("close", () => {
      const set = this.wsClients.get(researchId);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          this.wsClients.delete(researchId);
        }
      }
    });
  }

  private broadcast(researchId: string, message: WSMessage) {
    const clients = this.wsClients.get(researchId);
    if (clients) {
      const payload = JSON.stringify(message);
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  }

  private sendToClient(ws: WebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public getSession(researchId: string): ResearchSession | undefined {
    return this.sessions.get(researchId);
  }

  public getAllSessions(): ResearchSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async startResearch(
    university: string,
    major: string,
    existingResearchId?: string
  ): Promise<ResearchSession> {
    const researchId = existingResearchId || `research-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const session: ResearchSession = {
      researchId,
      university,
      major,
      status: "INITIALIZING",
      currentUrl: "about:blank",
      currentPageTitle: "Initializing Live Browser...",
      currentObjective: `Research official undergraduate entry requirements (International A Level & IELTS) for ${university} - ${major}`,
      steps: [],
      screenshots: [],
      evidence: [],
      tabs: [{ id: "tab-0", title: "Blank Page", url: "about:blank", isActive: true }],
      confidence: "MEDIUM",
      isPaused: false,
      stepCount: 0,
      maxSteps: 35,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(researchId, session);

    // Initialize browser controller
    const browser = new BrowserController();
    this.browserControllers.set(researchId, browser);

    await browser.init((frame: BrowserFrameInfo) => {
      session.currentUrl = frame.url;
      session.currentPageTitle = frame.title;
      session.lastFrameDataUrl = frame.dataUrl;

      this.broadcast(researchId, {
        type: "browser_frame",
        researchId,
        dataUrl: frame.dataUrl,
        url: frame.url,
        title: frame.title,
        cursor: session.cursorPosition,
        viewport: frame.viewport,
      });
    });

    // Start background research loop asynchronously
    this.runResearchLoop(researchId).catch((err) => {
      console.error(`Research loop error for ${researchId}:`, err);
      session.status = "ERROR";
      this.updateSession(researchId, { status: "ERROR" });
    });

    return session;
  }

  private updateSession(researchId: string, partial: Partial<ResearchSession>) {
    const session = this.sessions.get(researchId);
    if (!session) return;

    Object.assign(session, partial, { updatedAt: new Date().toISOString() });
    this.broadcast(researchId, {
      type: "state_update",
      researchId,
      session: partial,
    });
  }

  private async runResearchLoop(researchId: string) {
    const session = this.sessions.get(researchId);
    const browser = this.browserControllers.get(researchId);

    if (!session || !browser) return;

    this.updateSession(researchId, { status: "SEARCHING_UNIVERSITY" });

    // Step 1: Initial search on Google for official university course
    const initialQuery = `${session.university} ${session.major} undergraduate entry requirements A Level IELTS`;
    session.currentAction = {
      type: "SEARCH",
      text: initialQuery,
      reason: `Initiating Google Search to locate official ${session.university} course page`,
      displayLabel: `AI searching Google: "${session.university} ${session.major}"`,
    };
    session.cursorPosition = { x: 640, y: 350, tag: "AI SEARCHING" };

    this.updateSession(researchId, {
      currentAction: session.currentAction,
      cursorPosition: session.cursorPosition,
    });

    await browser.searchGoogle(initialQuery);

    const visitedUrls: string[] = [];

    while (
      session.stepCount < session.maxSteps &&
      session.status !== "COMPLETED" &&
      session.status !== "ERROR" &&
      session.status !== "BLOCKED"
    ) {
      if (session.isPaused) {
        this.updateSession(researchId, { status: "PAUSED" });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      session.stepCount++;
      const currentStepNum = session.stepCount;

      this.broadcast(researchId, {
        type: "agent_event",
        researchId,
        event: `Step ${currentStepNum}: Analyzing current browser page and determining optimal research action...`,
        level: "info",
        timestamp: new Date().toISOString(),
      });

      // OBSERVE & GET PAGE INFO
      const pageInfo = await browser.getPageInfo();
      if (!visitedUrls.includes(pageInfo.url)) {
        visitedUrls.push(pageInfo.url);
      }

      // CAPTURE HIGH-RES SCREENSHOT FOR GEMINI ANALYSIS
      const screenshotBase64 = await browser.takeHighResScreenshot();
      const screenshotId = `sc-${researchId}-${currentStepNum}-${Date.now()}`;

      // GEMINI ANALYSIS
      this.updateSession(researchId, { status: "READING_COURSE" });

      const analysis = await this.geminiService.analyzePage({
        university: session.university,
        major: session.major,
        currentUrl: pageInfo.url,
        pageTitle: pageInfo.title,
        textSnippet: pageInfo.textSnippet,
        linksSnippet: pageInfo.links,
        screenshotBase64,
        stepNumber: currentStepNum,
        maxSteps: session.maxSteps,
        visitedUrls,
        discoveredEvidence: session.evidence,
        currentStatus: session.status,
      });

      // VALIDATE ACTION
      const validation = ActionValidator.validate(analysis.action, pageInfo.url);
      const actionToExecute = validation.valid && validation.sanitizedAction ? validation.sanitizedAction : analysis.action;

      // UPDATE CURSOR POSITION BASED ON ACTION
      let cursorActionTag: "AI CLICK" | "AI TYPING" | "AI SCROLLING" | "AI READING" | "AI NAVIGATING" | "AI IDLE" = "AI READING";
      if (actionToExecute.type === "CLICK" || actionToExecute.type === "DOUBLE_CLICK") {
        cursorActionTag = "AI CLICK";
        session.cursorPosition = {
          x: actionToExecute.x || 640,
          y: actionToExecute.y || 400,
          tag: "AI CLICK",
        };
      } else if (actionToExecute.type === "SEARCH" || actionToExecute.type === "TYPE") {
        cursorActionTag = "AI TYPING";
        session.cursorPosition = { x: 640, y: 150, tag: "AI TYPING" };
      } else if (actionToExecute.type === "SCROLL") {
        cursorActionTag = "AI SCROLLING";
        session.cursorPosition = { x: 640, y: 400, tag: "AI SCROLLING" };
      } else {
        cursorActionTag = "AI NAVIGATING";
        session.cursorPosition = { x: 640, y: 400, tag: "AI NAVIGATING" };
      }

      // SAVE EVIDENCE DISCOVERED
      if (analysis.extractedEvidence && analysis.extractedEvidence.length > 0) {
        for (const item of analysis.extractedEvidence) {
          const evidenceItem: EvidenceItem = {
            id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sourceUrl: pageInfo.url,
            sourceTitle: pageInfo.title,
            sourceType: item.sourceType,
            evidenceText: item.evidenceText,
            category: item.category,
            screenshotId,
            retrievedAt: new Date().toISOString(),
          };

          // Avoid duplicates
          const exists = session.evidence.some(
            (e) => e.evidenceText === item.evidenceText || e.sourceUrl === pageInfo.url && e.category === item.category
          );
          if (!exists) {
            session.evidence.push(evidenceItem);
            this.broadcast(researchId, {
              type: "agent_event",
              researchId,
              event: `Official Evidence Discovered [${item.category}]: "${item.evidenceText.substring(0, 100)}..."`,
              level: "success",
              timestamp: new Date().toISOString(),
            });
          }
        }
      }

      if (analysis.entryYear) {
        session.entryYear = analysis.entryYear;
      }

      // STORE SCREENSHOT METADATA
      const screenshotMetadata: ScreenshotMetadata = {
        id: screenshotId,
        researchId,
        stepNumber: currentStepNum,
        timestamp: new Date().toISOString(),
        url: pageInfo.url,
        pageTitle: pageInfo.title,
        action: actionToExecute,
        cursorX: session.cursorPosition?.x,
        cursorY: session.cursorPosition?.y,
        viewportWidth: 1280,
        viewportHeight: 800,
        dataUrl: screenshotBase64,
      };
      session.screenshots.push(screenshotMetadata);

      // STORE STEP
      const researchStep: ResearchStep = {
        stepNumber: currentStepNum,
        timestamp: new Date().toISOString(),
        action: actionToExecute,
        url: pageInfo.url,
        pageTitle: pageInfo.title,
        observeText: analysis.observeText,
        planText: analysis.planText,
        resultSummary: analysis.resultSummary,
        screenshotId,
        screenshotUrl: screenshotBase64,
        cursorX: session.cursorPosition?.x,
        cursorY: session.cursorPosition?.y,
        cursorActionTag,
      };
      session.steps.push(researchStep);

      this.broadcast(researchId, {
        type: "step_completed",
        researchId,
        step: researchStep,
        screenshot: screenshotMetadata,
      });

      this.updateSession(researchId, {
        currentAction: actionToExecute,
        currentObjective: analysis.planText,
        status: analysis.suggestedStatus || session.status,
        stepCount: session.stepCount,
        confidence: analysis.confidence || session.confidence,
      });

      // CHECK FINISH CONDITION
      if (actionToExecute.type === "FINISH" || analysis.isComplete) {
        break;
      }

      // EXECUTE BROWSER ACTION
      try {
        switch (actionToExecute.type) {
          case "OPEN_URL":
            if (actionToExecute.url) {
              await browser.goto(actionToExecute.url);
            }
            break;
          case "SEARCH":
            if (actionToExecute.text) {
              await browser.searchGoogle(actionToExecute.text);
            }
            break;
          case "CLICK":
            if (typeof actionToExecute.x === "number" && typeof actionToExecute.y === "number") {
              await browser.click(actionToExecute.x, actionToExecute.y);
            }
            break;
          case "DOUBLE_CLICK":
            if (typeof actionToExecute.x === "number" && typeof actionToExecute.y === "number") {
              await browser.doubleClick(actionToExecute.x, actionToExecute.y);
            }
            break;
          case "TYPE":
            if (actionToExecute.text) {
              await browser.typeText(actionToExecute.text);
            }
            break;
          case "PRESS_KEY":
            if (actionToExecute.key) {
              await browser.pressKey(actionToExecute.key);
            }
            break;
          case "SCROLL":
            await browser.scroll(actionToExecute.direction || "down", actionToExecute.amount || 500);
            break;
          case "HOVER":
            if (typeof actionToExecute.x === "number" && typeof actionToExecute.y === "number") {
              await browser.hover(actionToExecute.x, actionToExecute.y);
            }
            break;
          case "BACK":
            await browser.back();
            break;
          case "FORWARD":
            await browser.forward();
            break;
          case "RELOAD":
            await browser.reload();
            break;
          case "WAIT":
            await new Promise((resolve) => setTimeout(resolve, 2000));
            break;
        }
      } catch (err: unknown) {
        console.warn(`Browser action execution note (step ${currentStepNum}):`, err);
      }

      // Pause briefly between agent steps for visual real-time readability
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // FINALIZATION & ADMISSION REPORT GENERATION
    this.updateSession(researchId, { status: "FINALIZING_REPORT" });

    const sources = Array.from(
      new Map(session.screenshots.map((s) => [s.url, { url: s.url, title: s.pageTitle }])).values()
    );

    const finalReport = await this.geminiService.summarizeReport({
      university: session.university,
      major: session.major,
      evidence: session.evidence,
      sources,
    });

    session.report = finalReport;
    session.status = "COMPLETED";

    this.updateSession(researchId, {
      status: "COMPLETED",
      report: finalReport,
      currentObjective: `Research completed for ${session.university} - ${session.major}. Official admission report ready.`,
    });

    this.broadcast(researchId, {
      type: "agent_event",
      researchId,
      event: `Admission Research Completed! Official entry report generated with ${session.evidence.length} evidence items verified.`,
      level: "success",
      timestamp: new Date().toISOString(),
    });
  }

  public pauseResearch(researchId: string) {
    const session = this.sessions.get(researchId);
    if (session) {
      session.isPaused = true;
      this.updateSession(researchId, { isPaused: true, status: "PAUSED" });
    }
  }

  public resumeResearch(researchId: string) {
    const session = this.sessions.get(researchId);
    if (session) {
      session.isPaused = false;
      this.updateSession(researchId, { isPaused: false, status: "READING_COURSE" });
    }
  }

  public async stopResearch(researchId: string) {
    const session = this.sessions.get(researchId);
    if (session) {
      session.status = "COMPLETED";
      this.updateSession(researchId, { status: "COMPLETED" });
    }
    const browser = this.browserControllers.get(researchId);
    if (browser) {
      await browser.close().catch(() => {});
      this.browserControllers.delete(researchId);
    }
  }
}
