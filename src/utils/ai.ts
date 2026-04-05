import { AI_PROVIDERS } from "../data/constants";

export async function callAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  aiConfig: any
): Promise<string> {
  const cfg = aiConfig || {};
  const prov = AI_PROVIDERS.find((p) => p.id === cfg.provider) || AI_PROVIDERS[0];
  const fullSys =
    systemPrompt +
    (cfg.persona ? `\n\nПерсонаж: ${cfg.persona}` : "") +
    (cfg.systemExtra ? `\n\n${cfg.systemExtra}` : "");
  const model = cfg.model || prov.defaultModel;

  if (prov.id === "claude") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        system: fullSys,
        messages: messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content?.find((b: any) => b.type === "text")?.text || "Нет ответа";
  }

  if (prov.id === "gemini") {
    if (!cfg.apiKey)
      throw new Error("Не указан API ключ Gemini.\n\nПолучи бесплатно: aistudio.google.com → Get API key");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.apiKey}`;
    const contents = messages
      .slice(-20)
      .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: fullSys }] },
        contents,
        generationConfig: { maxOutputTokens: 1400 },
      }),
    });
    if (!res.ok) {
      const e = await res.json();
      throw new Error(e.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Нет ответа";
  }

  let endpoint: string;
  if (prov.id === "openai") endpoint = "https://api.openai.com/v1/chat/completions";
  else if (prov.id === "groq") endpoint = "https://api.groq.com/openai/v1/chat/completions";
  else if (prov.id === "ollama") endpoint = cfg.endpoint || prov.defaultEndpoint || "";
  else endpoint = cfg.endpoint || "";

  if (!endpoint) throw new Error("Не указан endpoint для провайдера");
  if (prov.needsKey && !cfg.apiKey)
    throw new Error(`Не указан API ключ ${prov.name}.\n\n${prov.hint || ""}`);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 1400,
      messages: [
        { role: "system", content: fullSys },
        ...messages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Нет ответа";
}
