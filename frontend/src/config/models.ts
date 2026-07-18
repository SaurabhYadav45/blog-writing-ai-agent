export const MODEL_NAMES = {
  GPT_EXPENSIVE: "GPT-5.6-Sol",
  GPT_CHEAP: "GPT-5.6-Luna",
  GPT_IMAGE: "gpt-image-1",
  CLAUDE_EXPENSIVE: "Claude-Sonnet-5",
  CLAUDE_CHEAP: "Claude-Haiku-4-5",
  GEMINI_EXPENSIVE: "Gemini-3.1-Pro",
  GEMINI_CHEAP: "Gemini-3.5-Flash",
};

export const MODEL_PRICING = {
  [MODEL_NAMES.GPT_EXPENSIVE]: { input: 2.50, output: 10.00 },
  [MODEL_NAMES.GPT_CHEAP]: { input: 0.15, output: 0.60 },
  [MODEL_NAMES.GPT_IMAGE]: { input: 0.04, output: 0.04 }, // flat rate
  [MODEL_NAMES.CLAUDE_EXPENSIVE]: { input: 3.00, output: 15.00 },
  [MODEL_NAMES.CLAUDE_CHEAP]: { input: 0.25, output: 1.25 },
  [MODEL_NAMES.GEMINI_EXPENSIVE]: { input: 2.00, output: 12.00 },
  [MODEL_NAMES.GEMINI_CHEAP]: { input: 1.50, output: 9.00 },
  // the user also mentioned 2.5 in their prompt, so just in case:
  "Gemini-2.5-Pro": { input: 1.25, output: 10.00 },
  "Gemini-2.5-Flash": { input: 0.30, output: 2.50 },
};
