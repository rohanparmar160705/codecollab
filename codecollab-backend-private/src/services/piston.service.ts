// src/services/piston.service.ts
import { ENV } from "../config/env";
import CircuitBreaker from "opossum";
import { logger } from "../utils/logger";

interface PistonExecuteResponse {
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number;
    signal: string | null;
  };
  language: string;
  version: string;
}

// 🛡️ Circuit Breaker Options
const breakerOptions = {
  timeout: 3000, // 3s timeout
  errorThresholdPercentage: 50, // Trip if 50% fail
  resetTimeout: 5000, // Try again after 5s
};

// Internal execution function
async function executeInternal(payload: { language: string; code: string; input: string }) {
  const { language, code, input } = payload;
  
  // Map CodeCollab languages to Piston languages
  const langMap: Record<string, string> = {
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    cpp: "c++",
    java: "java",
    c: "c",
  };

  const pistonLang = langMap[language.toLowerCase()] || language;
  const version = "*";

  const response = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: pistonLang,
      version,
      files: [{ content: code }],
      stdin: input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston API Error: ${response.statusText}`);
  }

  const data = (await response.json()) as PistonExecuteResponse;
  return {
    success: data.run.code === 0,
    output: data.run.output,
    duration: 0,
    memory: 0,
    error: data.run.code !== 0 ? data.run.stderr : null,
  };
}

// Create Breaker
const breaker = new CircuitBreaker(executeInternal, breakerOptions);

breaker.fallback(() => ({
  success: false,
  output: "",
  duration: 0,
  memory: 0,
  error: "Service temporarily unavailable (Circuit Open)",
}));

breaker.on("open", () => logger.warn("⚠️ Piston Circuit Breaker OPEN"));
breaker.on("close", () => logger.info("✅ Piston Circuit Breaker CLOSED"));

export const PistonService = {
  async execute(language: string, code: string, input: string = "") {
    try {
      return await breaker.fire({ language, code, input });
    } catch (error: any) {
      logger.error("❌ Piston Execution Failed:", error);
      return {
        success: false,
        output: "",
        duration: 0,
        memory: 0,
        error: error.message || "Execution failed",
      };
    }
  },

  getHealth() {
    return {
      closed: breaker.closed,
      opened: breaker.opened,
      halfOpen: breaker.halfOpen,
      stats: breaker.stats,
    };
  },
};
