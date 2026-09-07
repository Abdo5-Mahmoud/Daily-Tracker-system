# Daily Challenge: Refactoring with Single Responsibility Principle (SRP) 🏗️⚡

> **Date**: 2026-09-06  
> **Topic**: Single Responsibility Principle (SRP), Layered Architecture (Strategy + Service + Route Controller)  
> **Target File**: `engineering-learning/daily-challenges/solutions/solution-2026-09-06-srp-refactoring.ts`

---

## 🎯 The Mission
Take the 195-line monolithic `assistant/route.ts` and refactor it into 3 cleanly decoupled, single-responsibility layers:
1. **Layer 1 (The LLM Strategy Contract)**: Upgrade `LLMProviderStrategy` to accept flexible request options (`LLMRequestOptions`).
2. **Layer 2 (The Concrete Gemini Strategy)**: Handle real Gemini payload construction, abort timeout, error status mapping, and response extraction.
3. **Layer 3 (The Assistant Service)**: Orchestrate portfolio knowledge loading and system prompt construction.
4. **Layer 4 (The Clean Controller)**: A lightweight route handler that only validates HTTP input and maps service results to responses.

---

## 📋 The 4 Progressive Steps

### Step 1: Flexible Options Contract
- Define `interface LLMRequestOptions`:
  - `prompt: string` (required)
  - `systemInstruction?: string` (optional)
  - `maxOutputTokens?: number` (optional)
- Update `interface LLMProviderStrategy`:
  - `readonly providerName: string`
  - `generateResponse: (options: LLMRequestOptions) => Promise<string>`
- Implement `MockProviderStrategy`:
  - Returns `Mock reply to: "${options.prompt}"` after a small delay.

### Step 2: The Real Gemini Strategy (`GeminiProviderStrategy`)
- Constructor takes `apiKey: string` and optional `modelName?: string` (defaults to `"gemini-3.6-flash"`).
- `generateResponse(options: LLMRequestOptions)`:
  - Constructs the Google Gemini REST endpoint URL.
  - Builds the body payload with `contents`, `generationConfig`, and optional `systemInstruction`.
  - Executes `fetch` with `AbortSignal.timeout(30_000)`.
  - Handles network timeout (`LLMError(503)`).
  - Handles non-ok HTTP responses (especially `429` Rate Limit and upstream server errors).
  - Safely extracts text candidates from payload or throws `LLMError(502)` if empty.

### Step 3: The Assistant Service (`askPortfolioAssistant`)
- Simulates loading knowledge base with a 10s timeout (`Promise.race`).
- Constructs the clear system instruction including the knowledge.
- Calls `createLLMProvider().generateResponse(...)`.
- Returns clean text answer or throws if knowledge fails.

### Step 4: The Clean Route Handler (`handleAssistantRoute`)
- Validates:
  - Rate limit simulation.
  - Question string existence and length (`<= 500` chars).
- Calls `askPortfolioAssistant(question)`.
- Catches:
  - `LLMError` ➔ returns `{ status: error.statusCode, error: error.message }`.
  - Knowledge failure ➔ returns `{ status: 503, error: "Knowledge unavailable" }`.
  - Generic error ➔ returns `{ status: 500, error: "Internal error" }`.
- Returns `{ status: 200, answer }`.
