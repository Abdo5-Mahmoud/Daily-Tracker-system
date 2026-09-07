/**
 * Daily Challenge: Single Responsibility Principle (SRP) & Layered Architecture
 * Author: Abdo (Abdullah Mahmoud)
 * Date: 2026-09-06
 *
 * Instructions: Implement the 4 decoupled layers step-by-step.
 */

// ==========================================
// LAYER 0: Custom Error Class (LLMError)
// ==========================================
export class LLMError extends Error {
  constructor(
    readonly statusCode: number,
    readonly providerName: string,
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message, { cause });
    this.name = "LLMError";
  }
}

// ==========================================
// LAYER 1: The Flexible Strategy Contract
// ==========================================

// TODO 1: Define LLMRequestOptions interface
// Should have: prompt (string), systemInstruction? (string), maxOutputTokens? (number)
export interface LLMRequestOptions {
  // Write properties here...
  prompt: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
}

// TODO 2: Define LLMProviderStrategy interface
// Should have: readonly providerName (string), generateResponse (options: LLMRequestOptions) => Promise<string>
export interface LLMProviderStrategy {
  // Write properties here...
  readonly providerName: string;
  generateResponse: (options: LLMRequestOptions) => Promise<string>;
}

// TODO 3: Implement MockProviderStrategy
export class MockProviderStrategy implements LLMProviderStrategy {
  readonly providerName = "mock-provider";

  async generateResponse(options: LLMRequestOptions): Promise<string> {
    // Return a mock response with options.prompt
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `Mock reply to: ${options.prompt}`;
  }
}

// ==========================================
// LAYER 2: Concrete Gemini Strategy
// ==========================================
interface GeminiPayload {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { code?: number; message?: string; status?: string };
}

export class GeminiProviderStrategy implements LLMProviderStrategy {
  readonly providerName: string;

  constructor(
    private apiKey: string,
    modelName = "gemini-3.6-flash",
  ) {
    this.providerName = modelName;
  }

  async generateResponse(options: LLMRequestOptions): Promise<string> {
    // TODO 4: Construct endpoint with this.providerName and this.apiKey
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.providerName}:generateContent?key=${this.apiKey}`;
    // TODO 5: Construct bodyPayload with contents, optional systemInstruction, and generationConfig

    let response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: options.prompt.trim() }], role: "user" },
          ],
          systemInstruction: { parts: [{ text: options.systemInstruction }] },
          generationConfig: { maxOutputTokens: options.maxOutputTokens },
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) {
        const errorMsg =
          response.status === 429
            ? "Rate limit reached"
            : `Upstream error: ${response.status}`;
        throw new LLMError(response.status, this.providerName, errorMsg);
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new LLMError(502, this.providerName, "Empty response");
      return text;
    } catch (err) {
      if (err instanceof LLMError) throw err;
      throw new LLMError(503, this.providerName, "Network timeout");
    }
    // TODO 6: Call fetch with AbortSignal.timeout(30_000) inside try/catch (map timeout to LLMError 503)

    // TODO 7: Check response.ok -> Handle 429 and generic upstream errors via LLMError

    // TODO 8: Parse JSON and extract answer text, throw LLMError 502 if empty
    const data = response.json();
    if (!data) throw new LLMError(502, this.providerName, "Empty");

    return data;
  }
}

// ==========================================
// Factory: createLLMProvider
// ==========================================
export function createLLMProvider(
  apiKey?: string,
  isTest = false,
): LLMProviderStrategy {
  if (isTest || !apiKey) {
    return new MockProviderStrategy();
  }
  return new GeminiProviderStrategy(apiKey);
}

// ==========================================
// LAYER 3: Assistant Service (Business Logic)
// ==========================================

const mockData = async (): Promise<Record<string, unknown>> => {
  return {
    about: "Fullstack Engineer portfolio data",
    skills: ["TypeScript", "Next.js", "React", "Node.js"],
  };
};
export async function askPortfolioAssistant(
  question: string,
  provider: LLMProviderStrategy,
  mockKnowledgeLoader: () => Promise<Record<string, unknown>> = mockData,
): Promise<string> {
  // TODO 9: Load portfolio knowledge with a timeout guard (e.g. Promise.race)

  const portfolioKnowledge = await Promise.race([
    mockKnowledgeLoader(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Portfolio knowledge load timed out")),
        10000,
      ),
    ),
  ]);
  // TODO 10: Format systemInstruction with knowledge
  const systemInstruction = `You are an AI assistant. Portfolio context:\n${JSON.stringify(portfolioKnowledge)}`;

  // TODO 11: Call provider.generateResponse({ prompt: question, systemInstruction }) and return result
  return await provider.generateResponse({
    prompt: question,
    systemInstruction,
  });
}

// ==========================================
// LAYER 4: Route Handler / Controller
// ==========================================
export interface MockRequest {
  ip: string;
  body: { question?: unknown };
}

export interface MockResponse {
  status: number;
  data: { ok: boolean; answer?: string; error?: string };
}

export async function handleAssistantRoute(
  request: MockRequest,
  provider: LLMProviderStrategy,
): Promise<MockResponse> {
  // TODO 12: Validate question (is string, trimmed length > 0, length <= 500)
  const raw = request.body.question;
  const question = typeof raw === "string" ? raw.trim() : "";
  if (question.length === 0 || question.length > 500) {
    return { status: 400, data: { ok: false, error: "Invalid question" } };
  }

  // TODO 13 & 14: Call askPortfolioAssistant inside try/catch and return MockResponse
  try {
    const answer = await askPortfolioAssistant(question, provider);
    return { status: 200, data: { ok: true, answer } };
  } catch (err) {
    if (err instanceof LLMError) {
      return {
        status: err.statusCode,
        data: { ok: false, error: err.message },
      };
    }
    return { status: 503, data: { ok: false, error: "Upstream error" } };
  }
}
