import { chat } from "../groq.js";

const question = "A customer bought a product on March 1st. Today is April 15th. The return window is 30 days. They also want to know if they can get a full refund since the product was damaged during shipping. Can they return it?";

// Without CoT
const withoutCoT = `Answer this customer support question:
${question}`;

// With CoT
const withCoT = `Answer this customer support question by thinking step by step.
Break down your reasoning before giving the final answer.

Question: ${question}

Think through:
1. Calculate if they are within the return window
2. Check if damaged-during-shipping qualifies for special consideration
3. Give final answer based on your reasoning`;

async function run() {
  console.log("=== WITHOUT CoT ===");
  const normalResponse = await chat(withoutCoT);
  console.log(normalResponse);

  console.log("\n=== WITH CoT ===");
  const cotResponse = await chat(withCoT);
  console.log(cotResponse);
}

run();