import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface BrowserFrameInfo {
  dataUrl: string;
  url: string;
  title: string;
  viewport: { width: number; height: number };
}

export class BrowserController {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private pages: Page[] = [];
  private activePageIndex: number = 0;
  private viewport = { width: 1280, height: 800 };
  private frameCallback: ((frame: BrowserFrameInfo) => void) | null = null;
  private isStreamActive = false;
  private streamIntervalTimer: NodeJS.Timeout | null = null;

  public async init(
    frameCallback?: (frame: BrowserFrameInfo) => void,
    viewport = { width: 1280, height: 800 }
  ): Promise<void> {
    this.viewport = viewport;
    if (frameCallback) {
      this.frameCallback = frameCallback;
    }

    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      });
    }

    this.context = await this.browser.newContext({
      viewport: this.viewport,
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      deviceScaleFactor: 1,
    });

    const page = await this.context.newPage();
    this.pages = [page];
    this.activePageIndex = 0;

    // Listen to new tabs opened by target = _blank
    this.context.on("page", (newPage) => {
      if (!this.pages.includes(newPage)) {
        this.pages.push(newPage);
        this.activePageIndex = this.pages.length - 1;
        this.setupPageListeners(newPage);
      }
    });

    this.setupPageListeners(page);
    this.startStreaming();
  }

  private setupPageListeners(page: Page) {
    page.on("load", () => this.triggerFrameUpdate());
    page.on("domcontentloaded", () => this.triggerFrameUpdate());
    page.on("framenavigated", () => this.triggerFrameUpdate());
  }

  public get activePage(): Page {
    if (!this.pages[this.activePageIndex]) {
      throw new Error("No active browser page available");
    }
    return this.pages[this.activePageIndex];
  }

  public startStreaming(intervalMs = 300) {
    this.isStreamActive = true;
    if (this.streamIntervalTimer) {
      clearInterval(this.streamIntervalTimer);
    }
    this.streamIntervalTimer = setInterval(async () => {
      if (this.isStreamActive) {
        await this.triggerFrameUpdate();
      }
    }, intervalMs);
  }

  public stopStreaming() {
    this.isStreamActive = false;
    if (this.streamIntervalTimer) {
      clearInterval(this.streamIntervalTimer);
      this.streamIntervalTimer = null;
    }
  }

  public async triggerFrameUpdate(): Promise<BrowserFrameInfo | null> {
    if (!this.pages[this.activePageIndex] || !this.frameCallback) {
      return null;
    }
    try {
      const page = this.activePage;
      const buffer = await page.screenshot({ type: "jpeg", quality: 65, fullPage: false });
      const dataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
      const url = page.url();
      const title = await page.title().catch(() => url);

      const frameInfo: BrowserFrameInfo = {
        dataUrl,
        url,
        title,
        viewport: this.viewport,
      };

      this.frameCallback(frameInfo);
      return frameInfo;
    } catch {
      return null;
    }
  }

  public async takeHighResScreenshot(): Promise<string> {
    const page = this.activePage;
    const buffer = await page.screenshot({ type: "jpeg", quality: 85, fullPage: false });
    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  }

  public async goto(url: string): Promise<void> {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }
    const page = this.activePage;
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 25000 }).catch(async (err) => {
      console.warn("Navigation warning/timeout:", err.message);
    });
    await this.triggerFrameUpdate();
  }

  public async searchGoogle(query: string): Promise<void> {
    const page = this.activePage;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 }).catch((e) => {
      console.warn("Google search navigation note:", e.message);
    });
    // Accept Google consent dialog if visible
    try {
      const consentBtn = page.locator('button:has-text("Accept all"), button:has-text("I agree"), #L2AGLb');
      if (await consentBtn.isVisible({ timeout: 1500 })) {
        await consentBtn.click();
      }
    } catch {
      // ignore
    }
    await this.triggerFrameUpdate();
  }

  public async click(x: number, y: number): Promise<void> {
    const page = this.activePage;
    // Bound check
    const clampedX = Math.max(0, Math.min(x, this.viewport.width));
    const clampedY = Math.max(0, Math.min(y, this.viewport.height));

    await page.mouse.move(clampedX, clampedY);
    await page.mouse.click(clampedX, clampedY, { delay: 100 });
    await page.waitForTimeout(1000);
    await this.triggerFrameUpdate();
  }

  public async doubleClick(x: number, y: number): Promise<void> {
    const page = this.activePage;
    const clampedX = Math.max(0, Math.min(x, this.viewport.width));
    const clampedY = Math.max(0, Math.min(y, this.viewport.height));

    await page.mouse.dblclick(clampedX, clampedY);
    await page.waitForTimeout(1000);
    await this.triggerFrameUpdate();
  }

  public async typeText(text: string, selector?: string): Promise<void> {
    const page = this.activePage;
    if (selector) {
      await page.fill(selector, text).catch(async () => {
        await page.keyboard.type(text, { delay: 50 });
      });
    } else {
      await page.keyboard.type(text, { delay: 50 });
    }
    await page.waitForTimeout(500);
    await this.triggerFrameUpdate();
  }

  public async pressKey(key: string): Promise<void> {
    const page = this.activePage;
    await page.keyboard.press(key);
    await page.waitForTimeout(1000);
    await this.triggerFrameUpdate();
  }

  public async scroll(direction: "down" | "up" = "down", amount = 500): Promise<void> {
    const page = this.activePage;
    const deltaY = direction === "down" ? amount : -amount;
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(800);
    await this.triggerFrameUpdate();
  }

  public async hover(x: number, y: number): Promise<void> {
    const page = this.activePage;
    await page.mouse.move(x, y);
    await page.waitForTimeout(300);
    await this.triggerFrameUpdate();
  }

  public async back(): Promise<void> {
    const page = this.activePage;
    await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
    await this.triggerFrameUpdate();
  }

  public async forward(): Promise<void> {
    const page = this.activePage;
    await page.goForward({ waitUntil: "domcontentloaded" }).catch(() => {});
    await this.triggerFrameUpdate();
  }

  public async reload(): Promise<void> {
    const page = this.activePage;
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await this.triggerFrameUpdate();
  }

  public async getPageInfo(): Promise<{
    url: string;
    title: string;
    textSnippet: string;
    links: Array<{ text: string; href: string; bbox?: { x: number; y: number; width: number; height: number } }>;
  }> {
    const page = this.activePage;
    const url = page.url();
    const title = await page.title().catch(() => url);

    // Extract DOM text content and key links with coordinates for better Gemini understanding
    const info = await page.evaluate(() => {
      const bodyText = document.body ? document.body.innerText : "";
      const textSnippet = bodyText.substring(0, 3500);

      const linkElements = Array.from(document.querySelectorAll("a, button, input[type='submit']")).slice(0, 40);
      const links = linkElements.map((el) => {
        const rect = el.getBoundingClientRect();
        const text = (el as HTMLElement).innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "";
        const href = (el as HTMLAnchorElement).href || "";
        return {
          text: text.trim().substring(0, 80),
          href,
          bbox: {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      }).filter(l => l.text.length > 0 && l.bbox.width > 0 && l.bbox.height > 0);

      return { textSnippet, links };
    }).catch(() => ({ textSnippet: "", links: [] }));

    return {
      url,
      title,
      textSnippet: info.textSnippet,
      links: info.links,
    };
  }

  public getTabs(): Array<{ id: string; title: string; url: string; isActive: boolean }> {
    return this.pages.map((p, idx) => ({
      id: `tab-${idx}`,
      title: p.url(),
      url: p.url(),
      isActive: idx === this.activePageIndex,
    }));
  }

  public switchTab(index: number): void {
    if (index >= 0 && index < this.pages.length) {
      this.activePageIndex = index;
      this.triggerFrameUpdate();
    }
  }

  public async close(): Promise<void> {
    this.stopStreaming();
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }
}
