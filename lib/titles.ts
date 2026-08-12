// Builder Title generator — hardcoded keyword → witty title rules table.
// Not randomness: the stack/role the user types in decides the title,
// so it feels personal. Fallback pool never leaves the field empty.

type Rule = { keywords: string[]; title: string };

const RULES: Rule[] = [
  {
    keywords: ["rust", "solidity", "evm", "chain", "web3", "crypto", "eth", "smart contract", "solana"],
    title: "Chaos Engineer, Borrow-Checker Division",
  },
  {
    keywords: ["react", "frontend", "front-end", "ui", "ux", "css", "tailwind", "web", "javascript", "typescript", "vue", "next"],
    title: "Pixel Wrangler, Layout Alchemist",
  },
  {
    keywords: ["backend", "back-end", "api", "node", "server", "database", "postgres", "go lang", "golang", "python", "django", "fastapi"],
    title: "API Whisperer, Latency Assassin",
  },
  {
    keywords: ["ai", "ml", "llm", "gpt", "model", "data", "dataset", "openai", "pytorch", "tensorflow", "prompt"],
    title: "Prompt Deity, Hallucination Patcher",
  },
  {
    keywords: ["mobile", "ios", "android", "flutter", "react native", "swift", "kotlin", "app"],
    title: "Thumb-First Architect, Play Store Wizard",
  },
  {
    keywords: ["design", "figma", "product design", "illustrator", "brand", "creative"],
    title: "Visual Provocateur, Gradient Evangelist",
  },
  {
    keywords: ["devops", "cloud", "aws", "azure", "gcp", "infra", "kubernetes", "k8s", "docker", "ci", "terraform"],
    title: "Container Shepherd, Blast-Radius Minimizer",
  },
  {
    keywords: ["security", "hack", "pentest", "cyber", "infosec", "exploit", "crypto"],
    title: "Zero-Day Sommelier, Firewall Critic",
  },
  {
    keywords: ["founder", "ceo", "entrepreneur", "startup", "product manager", "pm", "business"],
    title: "Chief Impossibility Officer, Roadmap Roulette Champion",
  },
  {
    keywords: ["hardware", "iot", "embedded", "sensor", "robotics", "arduino", "esp"],
    title: "Hardware Alchemist, Soldering Hero",
  },
  {
    keywords: ["game", "unity", "unreal", "gamedev", "3d", "blender"],
    title: "Polygon Sculptor, Frame-Rate Keeper",
  },
  {
    keywords: ["marketing", "growth", "community", "content", "social", "youtube", "tiktok"],
    title: "Viral Vector, Attention Arbitrageur",
  },
  {
    keywords: ["blockchain", "defi", "nft", "token", "web", "market"],
    title: "Ledger Juggler, Token Tinkerer",
  },
];

const FALLBACKS: string[] = [
  "Builder-in-Chief, Ship-On-Friday League",
  "Full-Stack Chaos Monarch",
  "The Builder Who Ships",
  "Midnight Manifestor",
  "Goa-Ready Builder",
  "Break-It-Fix-It Specialist",
  "Resident Builder, Vibe Maintainer",
  "The Cohort's Favourite Builder",
];

/** Pick a title for a stack/role string (case-insensitive keyword match). */
export function builderTitle(stack: string): string {
  const hay = stack.toLowerCase();
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      // prefer whole-word-ish matches on web-ish tokens, simple includes otherwise
      if (hay.includes(kw)) return rule.title;
    }
  }
  // deterministic pick from the fallback pool (hash of input) so it's
  // stable per-user rather than a fresh random each render.
  let h = 0;
  for (let i = 0; i < hay.length; i++) h = (h * 31 + hay.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}