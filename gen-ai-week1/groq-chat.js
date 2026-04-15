import Groq from "groq-sdk";
import * as readline from "readline";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";
const LOG_FILE = "groq-logs.json";

const MODEL_PRICING = {
  "llama-3.3-70b-versatile": { input: 0.59, output: 0.79 },
  "llama-3.1-8b-instant":    { input: 0.05, output: 0.08 },
  "mixtral-8x7b-32768":      { input: 0.24, output: 0.24 },
};

async function chat(userMessage) {
  const start = Date.now();

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: userMessage }],
    temperature: 0.7,
  });

  const latency = Date.now() - start;
  const usage = response.usage;
  const pricing = MODEL_PRICING[MODEL];

  const cost =
    (usage.prompt_tokens / 1_000_000) * pricing.input +
    (usage.completion_tokens / 1_000_000) * pricing.output;

  const log = {
    timestamp: new Date().toISOString(),
    prompt: userMessage,
    response: response.choices[0].message.content,
    tokens: { input: usage.prompt_tokens, output: usage.completion_tokens },
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

  console.log("Groq chatbot ready. Type 'exit' to quit.\n");

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

      ask();
    });
  };

  ask();
}

main();