import { chat } from "../groq.js";

const userQuestion = "Can I exchange a product instead of returning it?";

// Zero-shot
const zeroShot = `Answer the user's question about our refund policy.
Question: ${userQuestion}`;

// Few-shot
const fewShot = `You answer questions about company policy. Follow this exact format — short, direct, no fluff.

Q: Can I return a product after 15 days?
A: Yes, returns are accepted within 30 days of purchase. Initiate via the orders page.

Q: Is the refund instant?
A: Refunds take 5-7 business days after the return is received.

Q: Do I need the original packaging?
A: Original packaging is preferred but not mandatory for returns.

Q: ${userQuestion}
A:`;

async function run() {
  console.log("=== ZERO SHOT ===");
  const zeroResponse = await chat(zeroShot);
  console.log(zeroResponse);

  console.log("\n=== FEW SHOT ===");
  const fewResponse = await chat(fewShot);
  console.log(fewResponse);
}

run();