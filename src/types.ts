export type AgentStatus =
  | "IDLE"
  | "INITIALIZING"
  | "SEARCHING_UNIVERSITY"
  | "VERIFYING_OFFICIAL_DOMAIN"
  | "FINDING_COURSE"
  | "VERIFYING_UNDERGRADUATE"
  | "READING_COURSE"
  | "FINDING_ALEVEL"
  | "READING_ALEVEL"
  | "FINDING_IELTS"
  | "READING_IELTS"
  | "VERIFYING_EVIDENCE"
  | "FINALIZING_REPORT"
  | "COMPLETED"
  | "PAUSED"
  | "WAITING_FOR_USER"
  | "BLOCKED"
  | "ERROR";

export type ActionType =
  | "OPEN_URL"
  | "SEARCH"
  | "CLICK"
  | "DOUBLE_CLICK"
  | "TYPE"
  | "PRESS_KEY"
  | "SCROLL"
  | "HOVER"
  | "BACK"
  | "FORWARD"
  | "RELOAD"
  | "WAIT"
  | "OPEN_NEW_TAB"
  | "CLOSE_TAB"
  | "SCREENSHOT"
  | "FINISH"
  | "ASK_USER";

export interface AgentAction {
  type: ActionType;
  x?: number;
  y?: number;
  text?: string;
  url?: string;
  direction?: "down" | "up";
  amount?: number;
  key?: string;
  reason: string;
  displayLabel?: string;
}

export interface ScreenshotMetadata {
  id: string;
  researchId: string;
  stepNumber: number;
  timestamp: string;
  url: string;
  pageTitle: string;
  action: AgentAction;
  cursorX?: number;
  cursorY?: number;
  viewportWidth: number;
  viewportHeight: number;
  dataUrl?: string; // base64 JPEG
}

export interface ALevelRequirement {
  qualification: string;
  awardingBody?: string;
  overallRequirement?: string; // e.g. "A*AA"
  requiredSubjects: string[];
  subjectGrades?: Record<string, string>;
  additionalRequirements?: string[];
  evidenceText: string[];
  sourceUrl: string;
  sourceTitle: string;
  screenshotId?: string;
}

export interface IELTSRequirement {
  testName: string;
  overall?: string; // e.g. "7.0"
  listening?: string;
  reading?: string;
  writing?: string;
  speaking?: string;
  minimumComponent?: string; // e.g. "6.5"
  evidenceText: string[];
  sourceUrl: string;
  sourceTitle: string;
  screenshotId?: string;
}

export interface EvidenceItem {
  id: string;
  sourceUrl: string;
  sourceTitle: string;
  sourceType: "COURSE_PAGE" | "ADMISSIONS" | "INTERNATIONAL_QUALIFICATIONS" | "ENGLISH_REQUIREMENTS" | "PDF" | "FACULTY";
  evidenceText: string;
  category: "ALEVEL" | "IELTS" | "ADDITIONAL" | "ENTRY_YEAR" | "GENERAL";
  screenshotId?: string;
  retrievedAt: string;
  pageNumber?: number;
}

export interface ResearchStep {
  stepNumber: number;
  timestamp: string;
  action: AgentAction;
  url: string;
  pageTitle: string;
  observeText: string;
  planText: string;
  resultSummary: string;
  screenshotId?: string;
  screenshotUrl?: string;
  cursorX?: number;
  cursorY?: number;
  cursorActionTag?: "AI CLICK" | "AI TYPING" | "AI SCROLLING" | "AI READING" | "AI NAVIGATING" | "AI IDLE";
}

export interface AdmissionReport {
  university: string;
  course: string;
  degree?: string;
  entryYear?: string;
  officialCourseUrl?: string;
  internationalALevel?: ALevelRequirement;
  ielts?: IELTSRequirement;
  additionalRequirements?: string[];
  evidence: EvidenceItem[];
  sources: Array<{ url: string; title: string; type: string }>;
  status: "FOUND" | "PARTIALLY_FOUND" | "NOT_FOUND" | "BLOCKED";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  summary: string;
  completedAt: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

export interface ResearchSession {
  researchId: string;
  university: string;
  major: string;
  status: AgentStatus;
  entryYear?: string;
  currentUrl: string;
  currentPageTitle: string;
  currentObjective: string;
  currentAction?: AgentAction;
  cursorPosition?: { x: number; y: number; tag?: string };
  steps: ResearchStep[];
  screenshots: ScreenshotMetadata[];
  evidence: EvidenceItem[];
  tabs: BrowserTab[];
  report?: AdmissionReport;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  isPaused: boolean;
  stepCount: number;
  maxSteps: number;
  createdAt: string;
  updatedAt: string;
  lastFrameDataUrl?: string;
}

export interface WSBrowserFrameMessage {
  type: "browser_frame";
  researchId: string;
  dataUrl: string;
  url: string;
  title: string;
  cursor?: { x: number; y: number; tag?: string };
  viewport: { width: number; height: number };
}

export interface WSStateUpdateMessage {
  type: "state_update";
  researchId: string;
  session: Partial<ResearchSession>;
}

export interface WSStepCompletedMessage {
  type: "step_completed";
  researchId: string;
  step: ResearchStep;
  screenshot?: ScreenshotMetadata;
}

export interface WSEventMessage {
  type: "agent_event";
  researchId: string;
  event: string;
  level: "info" | "warn" | "error" | "success";
  timestamp: string;
}

export type WSMessage =
  | WSBrowserFrameMessage
  | WSStateUpdateMessage
  | WSStepCompletedMessage
  | WSEventMessage;
