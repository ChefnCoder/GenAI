import { GoogleGenAI } from "@google/genai";
import * as readline from "readline";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";
const LOG_FILE = "logs.json";

const MODEL_PRICING = {
  "gemini-2.5-flash":      { input: 0.15, output: 0.60 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.30 },
  "gemini-1.5-flash":      { input: 0.075, output: 0.30 },
};

async function chat(userMessage) {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userMessage,
  });

  const latency = Date.now() - start;
  const usage = response.usageMetadata;
  const pricing = MODEL_PRICING[MODEL];

  const cost =
    (usage.promptTokenCount / 1_000_000) * pricing.input +
    (usage.candidatesTokenCount / 1_000_000) * pricing.output;

  const log = {
    timestamp: new Date().toISOString(),
    prompt: userMessage,
    response: response.text,
    tokens: {
      input: usage.promptTokenCount,
      output: usage.candidatesTokenCount,
    },
    cost_usd: parseFloat(cost.toFixed(8)),
    latency_ms: latency,
  };

  saveLog(log);

  return log;
}

function saveLog(entry) {
  let logs = [];
  if (fs.existsSync(LOG_FILE)) {
    logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  }
  logs.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("Chatbot ready. Type 'exit' to quit.\n");

  const ask = () => {
    rl.question("You: ", async (input) => {
      if (input.trim() === "exit") {
        console.log("Bye.");
        rl.close();
        return;
      }

      const log = await chat(input);
      console.log(`\nBot: ${log.response}`);
      console.log(`[tokens: ${log.tokens.input}in/${log.tokens.output}out | cost: $${log.cost_usd} | latency: ${log.latency_ms}ms]\n`);

      ask(); // loop
    });
  };

  ask();
}

main();

// const models = await ai.models.list();
// console.log(models);