# University Admission Research Agent 🎓🤖

An autonomous AI web agent built with **Playwright (Chromium)** and **Gemini 3.6 Multimodal Vision**. The agent navigates official university websites, parses admission pages and entry requirement PDFs, and extracts verified International A Level and IELTS language entry requirements into structured reports.

---

## ✨ Key Features

- **Autonomous Web Automation**: Controls a real headless Playwright Chromium instance that searches Google, navigates university portals, opens entry requirement pages, and parses official PDFs.
- **Gemini Multimodal Vision Loop**: Evaluates high-resolution browser viewport screenshots in an **Observe → Plan → Act → Result** loop to decide optimal click, scroll, type, and search coordinates.
- **Real-Time Live Viewport Stream**: Streams live Chromium viewport frames to the browser UI via WebSocket (`ws://`). Includes an interactive AI pointer overlay showing real-time cursor position and active state (`AI CLICK`, `AI TYPING`, `AI SCROLLING`, `AI READING`).
- **Clean Minimalism UI**: Styled with crisp typography, subtle borders, high contrast elements, and a 3-column workstation layout.
- **Visual Evidence Timeline**: Captures full-resolution screenshots at every execution step. Includes an expandable horizontal thumbnail strip and full-resolution screenshot modal inspector.
- **Direct Text Extraction**: Ensures explicit requirement text (e.g. `A*AA including Mathematics`, `IELTS 7.0 overall with min 6.5 in all subscores`) is extracted directly into plain text cards, avoiding generic link-only placeholders.
- **Official Admission Report**: Generates structured reports with Markdown and JSON export capabilities, along with historical session tracking.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, WebSockets (`ws`), Node.js
- **Browser Automation**: Playwright (Chromium)
- **AI Engine**: `@google/genai` (Gemini 3.6 Flash Multimodal Vision)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Gemini API Key (`GEMINI_API_KEY`)

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd university-admission-research-agent
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set Environment Variables**:
   Create a `.env` file (or copy `.env.example`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Access the workstation at `http://localhost:3000`.

---

## 📁 Project Structure

```
├── src/
│   ├── components/        # React UI components (Header, TaskPanel, LiveBrowserView, AgentPanel, etc.)
│   ├── data/              # University test presets & mock initial states
│   ├── server/            # Playwright controller, Gemini Vision loop, Agent WebSocket service
│   ├── App.tsx            # Main 3-column layout application
│   ├── main.tsx           # Client entry point
│   └── types.ts           # Shared TypeScript interfaces & models
├── server.ts              # Express server + WebSocket server entry point
├── package.json           # Dependencies and run scripts
└── README.md              # Project documentation
```

---

## 📄 License

MIT License.
