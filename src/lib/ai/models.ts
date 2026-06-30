// Best available free models on OpenRouter (ordered by capability)
// Updated: 2025 — use this as single source of truth across the codebase

export const FREE_TEXT_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",   // 70B — most capable free text model
  "deepseek/deepseek-chat-v3-0324:free",       // DeepSeek V3 — excellent reasoning
  "google/gemini-2.0-flash-exp:free",          // Google Gemini — fast and smart
  "qwen/qwen3-235b-a22b:free",                 // Qwen 235B — very powerful
  "mistralai/mistral-small-3.1-24b-instruct:free", // Mistral fallback
];

export const FREE_VISION_MODELS = [
  "google/gemini-2.0-flash-exp:free",          // Gemini — best free vision model
  "qwen/qwen2.5-vl-72b-instruct:free",         // Qwen Vision 72B
  "meta-llama/llama-3.2-11b-vision-instruct:free", // Llama Vision fallback
];

export const PRIMARY_TEXT_MODEL = FREE_TEXT_MODELS[0];
export const PRIMARY_VISION_MODEL = FREE_VISION_MODELS[0];
