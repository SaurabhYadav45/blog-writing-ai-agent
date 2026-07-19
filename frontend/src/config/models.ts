export const MODEL_NAMES = {
  GPT_EXPENSIVE: "gpt-5.6-sol",
  GPT_BALANCED: "gpt-5.6-terra",
  GPT_CHEAP: "gpt-5.6-luna",
  GPT_IMAGE: "gpt-image-1",
  CLAUDE_EXPENSIVE: "Claude-Sonnet-5",
  CLAUDE_CHEAP: "Claude-Haiku-4-5",
  GEMINI_EXPENSIVE: "Gemini-3.1-Pro",
  GEMINI_CHEAP: "Gemini-3.5-Flash",
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
  
  // Other models
  [MODEL_NAMES.GPT_IMAGE]: { input: 0.04, output: 0.04 }, // flat rate per image
};
