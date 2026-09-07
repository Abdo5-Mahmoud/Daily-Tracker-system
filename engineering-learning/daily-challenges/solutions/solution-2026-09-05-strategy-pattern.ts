/**
 * Daily Challenge: Strategy & Factory Pattern (LLM Providers)
 * Author: Abdo (Abdullah Mahmoud)
 * Date: 2026-09-05
 *
 * Instructions: Implement the 6 required components below cleanly in TypeScript.
 */

// 1. Custom Error Class (LLMError)
export class LLMError extends Error {
  constructor(
    readonly statusCode: number,
    readonly providerName: string,
    readonly message: string,
    readonly cause?: Error,
  ) {
    super(message, { cause });
    this.cause = cause;
    this.message = message;
  }
}

// 2. Strategy Interface (LLMProviderStrategy)
export interface LLMProviderStrategy {
  // TODO: Define providerName and generateResponse method
  readonly providerName: string;
  generateProviderResponse: (prompt: string) => Promise<string>;
}

// 3. Concrete Strategy 1 (MockProviderStrategy)
export class MockProviderStrategy implements LLMProviderStrategy {
  readonly providerName: string = "MockProvider";
  async generateProviderResponse(prompt: string): Promise<string> {
    // Simulate a delay to mimic real API response time
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `Mock response for prompt: "${prompt}"`;
  }
}

// 4. Concrete Strategy 2 (GeminiProviderStrategy)
export class GeminiProviderStrategy implements LLMProviderStrategy {
  // TODO: Implement gemini strategy with error handling (401, 429)
  readonly providerName: string = "gemini-3.6-flash";

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new LLMError(401, this.providerName, "API key is required");
    }
  }
  async generateProviderResponse(prompt: string): Promise<string> {
    if (prompt.includes("rate-limit")) {
      throw new LLMError(429, this.providerName, "Rate limit exceeded");
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.providerName}:generateContent?key=${this.apiKey}`;

    let resp: Response;
    try {
      resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt.trim() }], role: "user" }],
        }),
      });
      if (!resp.ok) {
        const errorMessage = await resp.text();
        throw new LLMError(resp.status, this.providerName, errorMessage);
      }
    } catch (error) {
      if (error instanceof LLMError) throw error;
      console.error(
        `[Assistant API] Network or timeout error connecting to Google Generative AI (${this.providerName}):`,
        error,
      );
      throw new LLMError(
        503,
        this.providerName,
        "Network timeout contacting AI provider",
        error as Error,
      );
    }
    return resp.text().catch(() => "Unable to read response text");
  }
}

// 5. The Factory Function (createLLMProvider)
export function createLLMProvider(
  env?: string,
  apiKey?: string,
): LLMProviderStrategy {
  // TODO: Implement factory logic returning the appropriate strategy
  if (env === "test" || !apiKey) return new MockProviderStrategy();
  return new GeminiProviderStrategy(apiKey);
}

// 6. The Consumer Function (handleAssistantRequest)

export async function handleAssistatnRequest({
  prompt,
  provider,
}: {
  prompt: string;
  provider: LLMProviderStrategy;
}): Promise<{
  status: number;
  body: string;
}> {
  try {
    const resp = await provider.generateProviderResponse(prompt);
    return {
      status: 200,
      body: resp,
    };
  } catch (error) {
    if (error instanceof LLMError) {
      return {
        status: error.statusCode,
        body: `Error from ${error.providerName}: ${error.message}`,
      };
    }
    return {
      status: 500,
      body: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
