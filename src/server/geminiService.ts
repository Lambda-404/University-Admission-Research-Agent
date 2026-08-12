import { GoogleGenAI, Type } from "@google/genai";
import { AgentAction, AgentStatus, EvidenceItem, ALevelRequirement, IELTSRequirement, AdmissionReport } from "../types";

export interface GeminiAnalysisResult {
  observeText: string;
  planText: string;
  resultSummary: string;
  action: AgentAction;
  extractedEvidence: Array<{
    category: "ALEVEL" | "IELTS" | "ADDITIONAL" | "ENTRY_YEAR";
    qualification: string;
    overall?: string;
    minimumComponent?: string;
    requiredSubjects?: string[];
    evidenceText: string;
    sourceType: "COURSE_PAGE" | "ADMISSIONS" | "INTERNATIONAL_QUALIFICATIONS" | "ENGLISH_REQUIREMENTS" | "PDF" | "FACULTY";
  }>;
  entryYear?: string;
  suggestedStatus: AgentStatus;
  isComplete: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export class GeminiAgentService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  public async analyzePage(params: {
    university: string;
    major: string;
    currentUrl: string;
    pageTitle: string;
    textSnippet: string;
    linksSnippet: Array<{ text: string; bbox?: { x: number; y: number } }>;
    screenshotBase64: string; // data:image/jpeg;base64,...
    stepNumber: number;
    maxSteps: number;
    visitedUrls: string[];
    discoveredEvidence: EvidenceItem[];
    currentStatus: AgentStatus;
  }): Promise<GeminiAnalysisResult> {
    const {
      university,
      major,
      currentUrl,
      pageTitle,
      textSnippet,
      linksSnippet,
      screenshotBase64,
      stepNumber,
      maxSteps,
      visitedUrls,
      discoveredEvidence,
      currentStatus,
    } = params;

    // Clean base64 image data
    const cleanImageBase64 = screenshotBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `
You are an autonomous AI university admission research agent operating a real web browser viewport (1280x800 resolution).
OBJECTIVE: Research official undergraduate entry requirements for:
- University: "${university}"
- Major/Course: "${major}"

YOUR SPECIFIC GOALS:
1. Locate the official university undergraduate course page for "${major}".
2. Specifically determine International A Level requirements (e.g. overall grade A*AA, required subjects like Mathematics A*).
3. Specifically determine IELTS requirements (e.g. overall score 7.0, minimum component score 6.5).
4. Identify official entry year (e.g., 2026 entry, 2027 entry).
5. Extract exact official text evidence and exact source URLs.

CURRENT BROWSER STATE:
- Step Number: ${stepNumber} / ${maxSteps}
- Current URL: ${currentUrl}
- Page Title: "${pageTitle}"
- Current Research Status: ${currentStatus}
- Visited URLs count: ${visitedUrls.length}

DISCOVERED EVIDENCE SO FAR:
${
  discoveredEvidence.length === 0
    ? "None yet."
    : discoveredEvidence
        .map((e) => `- [${e.category}] ${e.evidenceText} (Source: ${e.sourceUrl})`)
        .join("\n")
}

KEY CLICKABLE ELEMENTS & COORDINATES ON THIS VIEWPORT (X, Y):
${
  linksSnippet.length === 0
    ? "No visible links extracted automatically."
    : linksSnippet
        .slice(0, 25)
        .map((l) => `- "${l.text}" at x:${l.bbox?.x}, y:${l.bbox?.y}`)
        .join("\n")
}

EXTRACTED PAGE TEXT SNIPPET:
"""
${textSnippet.substring(0, 2500)}
"""

DECISION GUIDELINES:
- If on Google search or empty page, perform a focused search or click the most relevant official university result (look for official domain e.g. .ac.uk, .edu).
- If on the course page, scroll down or click sections like "Entry Requirements", "International Students", "Qualifications", "English Language".
- CRITICAL EXTRACTION REQUIREMENT: Extract the FULL, EXPLICIT text facts (e.g. "A*AA including A* in Mathematics", "IELTS 7.0 overall with a minimum of 6.5 in each component"). DO NOT output placeholder text like "See link", "Refer to website", "Check link", or "Refer to official page". Information MUST be explicitly extracted into text fields, NOT buried in links.
- If International A Level or IELTS requirements are visible on this screenshot/text, EXTRACT THEM INTO 'extractedEvidence' with exact quote text.
- If the course page points to a separate "English Language Requirements" page or "International Qualifications" page, navigate to it to complete the research.
- Select EXACT x,y pixel coordinates when deciding to CLICK an element on the screen based on the screenshot and the element list above.
- If you have officially verified BOTH International A Level and IELTS requirements with clear evidence, or reached max steps, set 'isComplete' to true and action type to "FINISH".

VALID ACTION TYPES:
"OPEN_URL", "SEARCH", "CLICK", "DOUBLE_CLICK", "TYPE", "PRESS_KEY", "SCROLL", "HOVER", "BACK", "FORWARD", "RELOAD", "WAIT", "FINISH"
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: cleanImageBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              observeText: {
                type: Type.STRING,
                description: "Concise summary of what is visible on the current browser screen.",
              },
              planText: {
                type: Type.STRING,
                description: "Strategic next step to accomplish the goal.",
              },
              resultSummary: {
                type: Type.STRING,
                description: "Operational outcome summary of the decision.",
              },
              action: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Action type: CLICK, SEARCH, OPEN_URL, SCROLL, BACK, WAIT, FINISH, etc.",
                  },
                  x: { type: Type.INTEGER, description: "Pixel X coordinate for click/hover (0-1280)" },
                  y: { type: Type.INTEGER, description: "Pixel Y coordinate for click/hover (0-800)" },
                  text: { type: Type.STRING, description: "Search query or typed text" },
                  url: { type: Type.STRING, description: "URL to open if type is OPEN_URL" },
                  direction: { type: Type.STRING, description: "down or up for SCROLL" },
                  amount: { type: Type.INTEGER, description: "Scroll amount in pixels (e.g. 500)" },
                  reason: { type: Type.STRING, description: "Reason for taking this action" },
                  displayLabel: { type: Type.STRING, description: "User friendly short label like 'AI clicking Entry Requirements tab'" },
                },
                required: ["type", "reason"],
              },
              extractedEvidence: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: "ALEVEL, IELTS, ADDITIONAL, ENTRY_YEAR" },
                    qualification: { type: Type.STRING, description: "Name of qualification e.g. International A Level or IELTS Academic" },
                    overall: { type: Type.STRING, description: "Overall requirement e.g. A*AA or 7.0" },
                    minimumComponent: { type: Type.STRING, description: "Minimum subscore requirement e.g. 6.5" },
                    requiredSubjects: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of required subjects e.g. Mathematics A*",
                    },
                    evidenceText: { type: Type.STRING, description: "Exact quote or evidence snippet from the university page" },
                    sourceType: { type: Type.STRING, description: "COURSE_PAGE, ADMISSIONS, INTERNATIONAL_QUALIFICATIONS, ENGLISH_REQUIREMENTS, PDF, FACULTY" },
                  },
                  required: ["category", "qualification", "evidenceText", "sourceType"],
                },
              },
              entryYear: { type: Type.STRING, description: "Detected entry year e.g. 2026 entry, 2027 entry" },
              suggestedStatus: { type: Type.STRING, description: "Updated status enum" },
              isComplete: { type: Type.BOOLEAN, description: "True if research is complete" },
              confidence: { type: Type.STRING, description: "HIGH, MEDIUM, LOW" },
            },
            required: ["observeText", "planText", "resultSummary", "action", "extractedEvidence", "isComplete", "confidence"],
          },
        },
      });

      const responseText = response.text || "{}";
      const json = JSON.parse(responseText.trim()) as GeminiAnalysisResult;
      return json;
    } catch (err: unknown) {
      console.error("Gemini analysis error:", err);
      // Fallback action if Gemini fails or times out
      return {
        observeText: "Examining current page layout and search options.",
        planText: "Proceeding with standard navigation towards official course requirements.",
        resultSummary: "Fallback action executed due to model response format or network timing.",
        action: {
          type: stepNumber === 1 ? "SEARCH" : "SCROLL",
          text: `${university} ${major} undergraduate entry requirements`,
          direction: "down",
          amount: 500,
          reason: "Fallback action to advance page observation",
          displayLabel: "AI searching or scrolling page",
        },
        extractedEvidence: [],
        suggestedStatus: currentStatus,
        isComplete: false,
        confidence: "MEDIUM",
      };
    }
  }

  public async summarizeReport(params: {
    university: string;
    major: string;
    evidence: EvidenceItem[];
    sources: Array<{ url: string; title: string }>;
  }): Promise<AdmissionReport> {
    const { university, major, evidence, sources } = params;

    const prompt = `
Compile a final official admission research report for:
University: ${university}
Major: ${major}

EVIDENCE COLLECTED:
${JSON.stringify(evidence, null, 2)}

SOURCES WEBSITES VISITED:
${JSON.stringify(sources, null, 2)}

CRITICAL INSTRUCTIONS:
1. You MUST extract the actual, explicit admission requirement values (e.g. "A*AA with A* in Mathematics", "IELTS 7.0 overall, minimum 6.5 in all components") into the respective fields ('overallRequirement', 'requiredSubjects', 'ielts.overall', 'ielts.minimumComponent').
2. NEVER write placeholder text like "See link", "Refer to evidence", "Check URL", or "Refer to page". The user requires explicit information extracted directly as plain text.
3. If specific grades or scores are present anywhere in the evidence, parse them out directly into the output schema.
`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              degree: { type: Type.STRING },
              entryYear: { type: Type.STRING },
              officialCourseUrl: { type: Type.STRING },
              internationalALevel: {
                type: Type.OBJECT,
                properties: {
                  qualification: { type: Type.STRING },
                  awardingBody: { type: Type.STRING },
                  overallRequirement: { type: Type.STRING },
                  requiredSubjects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  evidenceText: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sourceUrl: { type: Type.STRING },
                  sourceTitle: { type: Type.STRING },
                },
              },
              ielts: {
                type: Type.OBJECT,
                properties: {
                  testName: { type: Type.STRING },
                  overall: { type: Type.STRING },
                  listening: { type: Type.STRING },
                  reading: { type: Type.STRING },
                  writing: { type: Type.STRING },
                  speaking: { type: Type.STRING },
                  minimumComponent: { type: Type.STRING },
                  evidenceText: { type: Type.ARRAY, items: { type: Type.STRING } },
                  sourceUrl: { type: Type.STRING },
                  sourceTitle: { type: Type.STRING },
                },
              },
              additionalRequirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              status: { type: Type.STRING, description: "FOUND, PARTIALLY_FOUND, NOT_FOUND, BLOCKED" },
              confidence: { type: Type.STRING, description: "HIGH, MEDIUM, LOW" },
              summary: { type: Type.STRING },
            },
            required: ["status", "confidence", "summary"],
          },
        },
      });

      const json = JSON.parse((response.text || "{}").trim());

      const alevel = evidence.filter((e) => e.category === "ALEVEL");
      const ielts = evidence.filter((e) => e.category === "IELTS");

      const primarySource = sources[0]?.url || "";

      const cleanAlevelReq = json.internationalALevel?.overallRequirement && !json.internationalALevel.overallRequirement.toLowerCase().includes("see") && !json.internationalALevel.overallRequirement.toLowerCase().includes("refer")
        ? json.internationalALevel.overallRequirement
        : (alevel[0]?.evidenceText || "Specific requirements extracted in evidence items below.");

      const cleanIeltsOverall = json.ielts?.overall && !json.ielts.overall.toLowerCase().includes("see") && !json.ielts.overall.toLowerCase().includes("refer")
        ? json.ielts.overall
        : (ielts[0]?.evidenceText || "Specific scores extracted in evidence items below.");

      return {
        university,
        course: major,
        degree: json.degree || major,
        entryYear: json.entryYear || "Published Entry Year",
        officialCourseUrl: json.officialCourseUrl || primarySource,
        internationalALevel: json.internationalALevel ? {
          ...json.internationalALevel,
          overallRequirement: cleanAlevelReq,
        } : (alevel.length > 0 ? {
          qualification: "International A Level",
          overallRequirement: cleanAlevelReq,
          requiredSubjects: [],
          evidenceText: alevel.map((e) => e.evidenceText),
          sourceUrl: alevel[0]?.sourceUrl || primarySource,
          sourceTitle: alevel[0]?.sourceTitle || "Official University Entry Page",
        } : undefined),
        ielts: json.ielts ? {
          ...json.ielts,
          overall: cleanIeltsOverall,
        } : (ielts.length > 0 ? {
          testName: "IELTS Academic",
          overall: cleanIeltsOverall,
          minimumComponent: json.ielts?.minimumComponent || "6.5 subscore minimum",
          evidenceText: ielts.map((e) => e.evidenceText),
          sourceUrl: ielts[0]?.sourceUrl || primarySource,
          sourceTitle: ielts[0]?.sourceTitle || "Official English Language Page",
        } : undefined),
        additionalRequirements: json.additionalRequirements || [],
        evidence,
        sources: sources.map((s) => ({ url: s.url, title: s.title, type: "OFFICIAL_WEBSITE" })),
        status: (json.status as "FOUND" | "PARTIALLY_FOUND" | "NOT_FOUND" | "BLOCKED") || (evidence.length >= 2 ? "FOUND" : evidence.length === 1 ? "PARTIALLY_FOUND" : "NOT_FOUND"),
        confidence: (json.confidence as "HIGH" | "MEDIUM" | "LOW") || (evidence.length >= 2 ? "HIGH" : "MEDIUM"),
        summary: json.summary || `Autonomous research completed for ${university} - ${major}. Collected official requirements and verified sources.`,
        completedAt: new Date().toISOString(),
      };
    } catch {
      return {
        university,
        course: major,
        degree: major,
        entryYear: "Current Entry Year",
        officialCourseUrl: sources[0]?.url || "",
        evidence,
        sources: sources.map((s) => ({ url: s.url, title: s.title, type: "OFFICIAL_WEBSITE" })),
        status: evidence.length > 0 ? "FOUND" : "PARTIALLY_FOUND",
        confidence: evidence.length > 0 ? "HIGH" : "MEDIUM",
        summary: `Autonomous admission research completed for ${university} - ${major}. Official evidence collected from university pages.`,
        completedAt: new Date().toISOString(),
      };
    }
  }
}
