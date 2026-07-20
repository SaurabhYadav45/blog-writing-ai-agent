export const MODEL_NAMES = {
  GPT_EXPENSIVE: "gpt-5.6-sol",
  GPT_BALANCED: "gpt-5.6-terra",
  GPT_CHEAP: "gpt-5.6-luna",
  GPT_IMAGE: "gpt-image-1",
  CLAUDE_EXPENSIVE: "Claude-Sonnet-5",
  CLAUDE_CHEAP: "Claude-Haiku-4-5",
  GEMINI_EXPENSIVE: "Gemini-3.1-Pro",
  GEMINI_CHEAP: "Gemini-3.5-Flash",
  DEEPSEEK: "DeepSeek-V4",
  OPENROUTER: "OpenRouter-Auto",
  COHERE: "Cohere-Command",
};

export const MODEL_PRICING = {
  // Expensive models
  [MODEL_NAMES.GPT_EXPENSIVE]: { input: 5.00, output: 30.00 },
  [MODEL_NAMES.CLAUDE_EXPENSIVE]: { input: 3.00, output: 15.00 },
  [MODEL_NAMES.GEMINI_EXPENSIVE]: { input: 2.00, output: 12.00 },
  
  // Balanced models
  [MODEL_NAMES.GPT_BALANCED]: { input: 2.50, output: 15.00 },
  
  // Cheap models
  [MODEL_NAMES.GPT_CHEAP]: { input: 0.15, output: 0.60 },
  [MODEL_NAMES.CLAUDE_CHEAP]: { input: 0.25, output: 1.25 },
  [MODEL_NAMES.GEMINI_CHEAP]: { input: 0.35, output: 1.50 },
  
  // Free / New Models
  [MODEL_NAMES.DEEPSEEK]: { input: 0.00, output: 0.00 },
  [MODEL_NAMES.OPENROUTER]: { input: 0.00, output: 0.00 },
  [MODEL_NAMES.COHERE]: { input: 0.00, output: 0.00 },
  
  // Other models
  [MODEL_NAMES.GPT_IMAGE]: { input: 0.04, output: 0.04 }, // flat rate per image
  "gemini-3.1-flash-image": { input: 0.03, output: 0.03 },
  "@cf/stabilityai/stable-diffusion-xl-base-1.0": { input: 0.00, output: 0.00 }, // Free
  "black-forest-labs/FLUX.1-schnell": { input: 0.00, output: 0.00 }, // Free
  "pollinations-flux": { input: 0.00, output: 0.00 }, // Free
};

export const IMAGE_MODELS = [
  { id: "pollinations-flux", name: "Pollinations AI (Flux)", free: true },
  { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", name: "Cloudflare (SDXL)", free: true },
  { id: "black-forest-labs/FLUX.1-schnell", name: "Hugging Face (Flux Schnell)", free: true },
  { id: "gemini-3.1-flash-image", name: "Gemini 3.1 Flash Image", free: false },
  { id: MODEL_NAMES.GPT_IMAGE, name: "OpenAI GPT Image 1", free: false },
];
