import { AgentAction } from "../types";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  sanitizedAction?: AgentAction;
}

export class ActionValidator {
  private static readonly VIEWPORT_WIDTH = 1280;
  private static readonly VIEWPORT_HEIGHT = 800;

  private static readonly BLOCKED_DOMAINS = [
    "paypal.com",
    "stripe.com",
    "checkout",
    "login.microsoftonline.com",
    "accounts.google.com",
    "facebook.com/login",
  ];

  public static validate(action: AgentAction, currentUrl?: string): ValidationResult {
    if (!action || !action.type) {
      return { valid: false, reason: "Action is null or missing type" };
    }

    const sanitized: AgentAction = { ...action };

    // Check action type
    const validTypes = [
      "OPEN_URL",
      "SEARCH",
      "CLICK",
      "DOUBLE_CLICK",
      "TYPE",
      "PRESS_KEY",
      "SCROLL",
      "HOVER",
      "BACK",
      "FORWARD",
      "RELOAD",
      "WAIT",
      "OPEN_NEW_TAB",
      "CLOSE_TAB",
      "SCREENSHOT",
      "FINISH",
      "ASK_USER",
    ];

    if (!validTypes.includes(action.type)) {
      return { valid: false, reason: `Invalid action type: ${action.type}` };
    }

    // Check URL restrictions
    if (action.type === "OPEN_URL" && action.url) {
      const lowerUrl = action.url.toLowerCase();
      if (this.BLOCKED_DOMAINS.some((domain) => lowerUrl.includes(domain))) {
        return {
          valid: false,
          reason: "Target URL involves sensitive authentication or payment system which is restricted.",
        };
      }
    }

    // Coordinate validation
    if (action.type === "CLICK" || action.type === "DOUBLE_CLICK" || action.type === "HOVER") {
      if (typeof action.x !== "number" || typeof action.y !== "number") {
        return { valid: false, reason: "Click/Hover action requires numeric x and y coordinates" };
      }

      // Clamp coordinates to viewport
      sanitized.x = Math.max(0, Math.min(Math.round(action.x), this.VIEWPORT_WIDTH));
      sanitized.y = Math.max(0, Math.min(Math.round(action.y), this.VIEWPORT_HEIGHT));
    }

    // Scroll amount sanitization
    if (action.type === "SCROLL") {
      sanitized.amount = Math.min(Math.max(action.amount || 500, 100), 2000);
      sanitized.direction = action.direction === "up" ? "up" : "down";
    }

    // Search query check
    if (action.type === "SEARCH" && (!action.text || action.text.trim().length === "0" as unknown as number || action.text.trim().length === 0)) {
      return { valid: false, reason: "SEARCH action requires search query text" };
    }

    return { valid: true, sanitizedAction: sanitized };
  }
}
