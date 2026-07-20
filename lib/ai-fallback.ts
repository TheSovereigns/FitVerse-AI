const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function getGroqApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

function isRetryableError(msg: string): boolean {
  return msg.includes("503") || msg.includes("502") || msg.includes("429");
}

function parseJsonFromText(text: string): string {
  let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Pattern A: Vercel AI SDK — generateObject / generateText fallback
// Used by: generate-workouts, generate-recipes, calculate-macros
// ---------------------------------------------------------------------------

export async function generateObjectWithFallback<T>({
  geminiCall,
  prompt,
  schemaName,
}: {
  geminiCall: () => Promise<T>;
  prompt: string;
  schemaName: string;
}): Promise<T> {
  const groqKey = getGroqApiKey();

  // Attempt 1 & 2: Gemini
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await geminiCall();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-fallback] Gemini attempt ${attempt}/2 failed: ${msg}`);
      if (!isRetryableError(msg) || attempt === 2) break;
      await delay(1000 * attempt);
    }
  }

  // Fallback: Groq
  if (!groqKey) throw new Error("Gemini failed and no GROQ_API_KEY configured");

  console.log("[ai-fallback] Falling back to Groq");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");

  const cleaned = parseJsonFromText(text);
  return JSON.parse(cleaned) as T;
}

export async function generateTextWithFallback({
  geminiCall,
  prompt,
}: {
  geminiCall: () => Promise<string>;
  prompt: string;
}): Promise<string> {
  const groqKey = getGroqApiKey();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await geminiCall();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-fallback] Gemini attempt ${attempt}/2 failed: ${msg}`);
      if (!isRetryableError(msg) || attempt === 2) break;
      await delay(1000 * attempt);
    }
  }

  if (!groqKey) throw new Error("Gemini failed and no GROQ_API_KEY configured");

  console.log("[ai-fallback] Falling back to Groq");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------------------------------------------------------------------------
// Pattern B: @google/generative-ai — generateContent fallback
// Used by: chatbot, analyze-sleep, biological-age, generate-initial-plan,
//          generate-weekly-meals, food-substitutions, recommend-supplements,
//          generate-metabolic-plan
// ---------------------------------------------------------------------------

export async function generateContentWithFallback({
  geminiCall,
  prompt,
  generationConfig,
}: {
  geminiCall: () => Promise<string>;
  prompt: string;
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
}): Promise<string> {
  const groqKey = getGroqApiKey();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await geminiCall();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-fallback] Gemini attempt ${attempt}/2 failed: ${msg}`);
      if (!isRetryableError(msg) || attempt === 2) break;
      await delay(1000 * attempt);
    }
  }

  if (!groqKey) throw new Error("Gemini failed and no GROQ_API_KEY configured");

  console.log("[ai-fallback] Falling back to Groq");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: generationConfig?.temperature ?? 0.7,
      max_tokens: generationConfig?.maxOutputTokens,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

// ---------------------------------------------------------------------------
// Pattern C: Raw fetch — Gemini REST fallback
// Used by: weekly-report, analyze-product (text-only variant)
// ---------------------------------------------------------------------------

export async function fetchGeminiWithFallback({
  geminiCall,
  prompt,
  generationConfig,
}: {
  geminiCall: () => Promise<string>;
  prompt: string;
  generationConfig?: { temperature?: number; maxOutputTokens?: number };
}): Promise<string> {
  const groqKey = getGroqApiKey();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      return await geminiCall();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-fallback] Gemini attempt ${attempt}/2 failed: ${msg}`);
      if (!isRetryableError(msg) || attempt === 2) break;
      await delay(1000 * attempt);
    }
  }

  if (!groqKey) throw new Error("Gemini failed and no GROQ_API_KEY configured");

  console.log("[ai-fallback] Falling back to Groq");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: generationConfig?.temperature ?? 0.7,
      max_tokens: generationConfig?.maxOutputTokens,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Groq API returned ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

// ---------------------------------------------------------------------------
// Streaming fallback for chatbot
// Returns a ReadableStream that tries Gemini first, falls back to Groq
// ---------------------------------------------------------------------------

export async function createStreamingFallback({
  geminiStreamCall,
  prompt,
  systemPrompt,
  onChunk,
  onError,
  onDone,
}: {
  geminiStreamCall: () => Promise<AsyncIterable<{ text: () => string }>>;
  prompt: string;
  systemPrompt: string;
  onChunk: (text: string) => void;
  onError: (error: string) => void;
  onDone: (responseTimeMs: number) => void;
}): Promise<void> {
  const startTime = Date.now();
  const groqKey = getGroqApiKey();

  // Attempt Gemini streaming (2 tries)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await geminiStreamCall();
      let fullReply = "";
      for await (const chunk of result) {
        const text = chunk.text();
        if (text) {
          fullReply += text;
          onChunk(text);
        }
      }
      onDone(Date.now() - startTime);
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ai-fallback] Gemini stream attempt ${attempt}/2 failed: ${msg}`);
      if (!isRetryableError(msg) || attempt === 2) {
        break;
      }
      await delay(1000 * attempt);
    }
  }

  // Fallback: Groq streaming
  if (!groqKey) {
    onError("Gemini failed and no GROQ_API_KEY configured");
    return;
  }

  console.log("[ai-fallback] Falling back to Groq streaming");
  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      onError(`Groq API returned ${res.status}: ${errBody}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onError("No response body from Groq");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            onChunk(content);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    onDone(Date.now() - startTime);
  } catch (err) {
    onError(err instanceof Error ? err.message : "Groq streaming failed");
  }
}
