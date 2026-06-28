import { chat } from "../groq.js";

const question = "Our API is throwing a 429 error under heavy load. What should we do?";

// No role
const noRole = `Answer this question:
${question}`;

// With role
const withRole = `You are a senior backend engineer with 10 years of experience in distributed systems and API design.
You give precise, technical answers with concrete implementation steps. No fluff, no basics.

Question: ${question}`;

// Wrong role (to show contrast)
const wrongRole = `You are a friendly customer support agent helping non-technical users.
Explain things simply, avoid jargon.

Question: ${question}`;

async function run() {
  console.log("=== NO ROLE ===");
  const noRoleResponse = await chat(noRole);
  console.log(noRoleResponse);

  console.log("\n=== SENIOR BACKEND ENGINEER ===");
  const engineerResponse = await chat(withRole);
  console.log(engineerResponse);

  console.log("\n=== CUSTOMER SUPPORT AGENT ===");
  const supportResponse = await chat(wrongRole);
  console.log(supportResponse);
}

run();