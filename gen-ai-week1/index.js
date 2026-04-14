import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function firstCall() {
  const start = Date.now();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "What is a token in LLMs? Answer in 2 lines.",
  });

  const latency = Date.now() - start;
  const usage = response.usageMetadata;

  console.log("Response:", response.text);
  console.log("Tokens → input:", usage.promptTokenCount, "| output:", usage.candidatesTokenCount);
  console.log("Latency:", latency, "ms");

  const cost =
    (usage.promptTokenCount / 1_000_000) * 0.10 +
    (usage.candidatesTokenCount / 1_000_000) * 0.40;
  console.log("Cost: (self calculation) $" + cost.toFixed(8));
}

firstCall();
// const models = await ai.models.list();
// console.log(models);