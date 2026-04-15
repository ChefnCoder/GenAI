import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";
const PRICING = { input: 0.15, output: 0.60 };
const AB_LOG_FILE = "ab-logs.json";

const TEST_QUESTION = "Explain what is an API in simple terms.";

const PROMPTS = {
  direct: {
    type: "direct",
    contents: TEST_QUESTION,
    config: { temperature: 0.7 },
  },
  role_based: {
    type: "role_based",
    contents: `You are a senior backend engineer explaining to a junior dev. ${TEST_QUESTION}`,
    config: { temperature: 0.7 },
  },
  chain_of_thought: {
    type: "chain_of_thought",
    contents: `Think step by step and then answer: ${TEST_QUESTION}`,
    config: { temperature: 0.3 },
  },
};

async function runPrompt(promptConfig) {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: promptConfig.contents,
    config: promptConfig.config,
  });

  const latency = Date.now() - start;
  const usage = response.usageMetadata;
  const cost =
    (usage.promptTokenCount / 1_000_000) * PRICING.input +
    (usage.candidatesTokenCount / 1_000_000) * PRICING.output;

  return {
    type: promptConfig.type,
    response: response.text,
    tokens: { input: usage.promptTokenCount, output: usage.candidatesTokenCount },
    cost_usd: parseFloat(cost.toFixed(8)),
    latency_ms: latency,
    timestamp: new Date().toISOString(),
  };
}

function saveABLogs(results) {
  let logs = [];
  if (fs.existsSync(AB_LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(AB_LOG_FILE, "utf-8"));
  }
  logs.push({ question: TEST_QUESTION, results, timestamp: new Date().toISOString() });
  fs.writeFileSync(AB_LOG_FILE, JSON.stringify(logs, null, 2));
}

function printSummary(results) {
  console.log("\n===== A/B TEST RESULTS =====");
  results.forEach(r => {
    console.log(`\n[${r.type.toUpperCase()}]`);
    console.log(`Latency : ${r.latency_ms}ms`);
    console.log(`Tokens  : ${r.tokens.input}in / ${r.tokens.output}out`);
    console.log(`Cost    : $${r.cost_usd}`);
    console.log(`Response preview: ${r.response.slice(0, 120)}...`);
  });

  const fastest = results.reduce((a, b) => a.latency_ms < b.latency_ms ? a : b);
  const cheapest = results.reduce((a, b) => a.cost_usd < b.cost_usd ? a : b);
  const mostDetailed = results.reduce((a, b) => a.tokens.output > b.tokens.output ? a : b);

  console.log("\n===== WINNER =====");
  console.log(`Fastest      : ${fastest.type}`);
  console.log(`Cheapest     : ${cheapest.type}`);
  console.log(`Most detailed: ${mostDetailed.type}`);
  console.log("==================\n");
}

async function main() {
  console.log("Running A/B test on 3 prompt types...\n");
  const results = [];

  for (const key of Object.keys(PROMPTS)) {
    console.log(`Testing: ${key}...`);
    const result = await runPrompt(PROMPTS[key]);
    results.push(result);
  }

  saveABLogs(results);
  printSummary(results);
}

main();