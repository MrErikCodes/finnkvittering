// Rybbit analytics tracking utility

declare global {
  interface Window {
    rybbit?: {
      event: (eventName: string, eventData?: Record<string, unknown>) => void;
      pageview: () => void;
    };
  }
}

// Queue for events that fire before rybbit is ready
const eventQueue: Array<{ event: string; data?: Record<string, unknown> }> = [];

// Process queued events once rybbit is ready
function processQueue() {
  if (typeof window === "undefined" || !window.rybbit) {
    return;
  }

  while (eventQueue.length > 0) {
    const { event, data } = eventQueue.shift()!;
    try {
      if (window.rybbit.event && typeof window.rybbit.event === "function") {
        window.rybbit.event(event, data);
      }
    } catch (error) {
      console.warn("Failed to track queued event:", error);
    }
  }
}

// Check if rybbit is ready and process queue
function checkRybbitReady() {
  if (
    typeof window !== "undefined" &&
    window.rybbit &&
    window.rybbit.event &&
    typeof window.rybbit.event === "function"
  ) {
    processQueue();
    return true;
  }
  return false;
}

// Start checking for rybbit after a short delay
if (typeof window !== "undefined") {
  // Check immediately
  checkRybbitReady();

  // Check periodically for a short time after page load
  // This handles the async script loading
  let attempts = 0;
  const maxAttempts = 20;
  const checkInterval = setInterval(() => {
    attempts++;
    if (checkRybbitReady() || attempts >= maxAttempts) {
      clearInterval(checkInterval);
    }
  }, 100);
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  // Check if rybbit is ready with the correct API
  if (
    window.rybbit &&
    window.rybbit.event &&
    typeof window.rybbit.event === "function"
  ) {
    try {
      window.rybbit.event(event, data);
      return;
    } catch (error) {
      console.warn("Failed to track event:", error);
      return;
    }
  }

  // Queue the event if rybbit is not ready yet
  eventQueue.push({ event, data });

  // Try to process queue after a short delay
  setTimeout(() => {
    checkRybbitReady();
  }, 100);
}

// Specific tracking functions with typed data
export const analytics = {
  // PDF generation events
  previewed: (data?: { price?: number; hasSourceUrl?: boolean }) => {
    trackEvent("pdf_previewed", data);
  },
  downloaded: (data?: {
    price?: number;
    hasSourceUrl?: boolean;
    source?: string;
  }) => {
    trackEvent("pdf_downloaded", data);
  },
  generated: (data?: {
    preview?: boolean;
    price?: number;
    hasSourceUrl?: boolean;
  }) => {
    trackEvent("pdf_generated", data);
  },
  // URL parsing events
  urlParsed: (data?: {
    success: boolean;
    hasPrice?: boolean;
    hasTitle?: boolean;
    error?: string;
  }) => {
    trackEvent("url_parsed", data);
  },
  // Form interaction events
  formSubmitted: (data?: { hasParsedData?: boolean; price?: number }) => {
    trackEvent("form_submitted", data);
  },
  // Error tracking
  error: (data?: { type: string; message?: string; context?: string }) => {
    trackEvent("error", data);
  },
};
