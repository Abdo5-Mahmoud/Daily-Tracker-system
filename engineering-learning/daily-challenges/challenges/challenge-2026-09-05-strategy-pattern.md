# Daily Challenge: The LLM Provider Strategy Pattern 🧠⚡

> **Date**: 2026-09-05  
> **Topic**: Strategy Pattern & Factory Pattern (Decoupling AI Providers)  
> **Target File**: `engineering-learning/daily-challenges/solutions/solution-2026-09-05-strategy-pattern.ts`

---

## 🎯 The Mission
Build a production-grade LLM provider system using the **Strategy Pattern** and a **Factory Pattern** in TypeScript.

---

## 📋 Requirements

### 1. The Strategy Interface (`LLMProviderStrategy`)
Define an interface with:
- `readonly providerName: string`
- `generateResponse(prompt: string): Promise<string>`

### 2. Concrete Strategy 1: `MockProviderStrategy`
- Used for local tests & offline development (0 tokens consumed).
- `providerName`: `"mock"`
- Behavior: Returns a deterministic string: `"Mock response for: [prompt]"`.

### 3. Concrete Strategy 2: `GeminiProviderStrategy`
- Simulates or calls the actual Gemini Flash API.
- `providerName`: `"gemini-3.6-flash"`
- Accepts an `apiKey` in its constructor.
- If `apiKey` is empty or invalid, throws an `LLMError` with `statusCode: 401`.
- If prompt contains the word `"rate-limit"`, throws an `LLMError` with `statusCode: 429`.
- Otherwise, returns `"Gemini generated response for: [prompt]"`.

### 4. Custom Error Class: `LLMError`
- Extends standard `Error`.
- Properties:
  - `readonly statusCode: number`
  - `readonly providerName: string`

### 5. The Factory: `createLLMProvider(env?: string, apiKey?: string): LLMProviderStrategy`
- If `env === 'test'` or `!apiKey`: returns an instance of `MockProviderStrategy`.
- Otherwise: returns an instance of `GeminiProviderStrategy`.

### 6. The Consumer (Route Simulation Handler):
A function `handleAssistantRequest(prompt: string, provider: LLMProviderStrategy)`:
- Invokes the provider.
- Catches errors gracefully:
  - If `err instanceof LLMError`: returns `{ status: err.statusCode, body: err.message }`.
  - Else: returns `{ status: 500, body: "Internal Server Error" }`.
