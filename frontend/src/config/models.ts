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
  [MODEL_NAMES.GPT_EXPENSIVE]: { input: 5.00, output: 30.00 },
  [MODEL_NAMES.CLAUDE_EXPENSIVE]: { input: 3.00, output: 15.00 },
  [MODEL_NAMES.GEMINI_EXPENSIVE]: { input: 2.00, output: 12.00 },
  [MODEL_NAMES.GPT_IMAGE]: { input: 0.04, output: 0.04 }, // flat rate
};
