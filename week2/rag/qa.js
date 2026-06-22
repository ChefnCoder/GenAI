import { retrieve } from "./retriever.js";
import { chat } from "../groq.js";

// ── Citation Validator ──────────────────────────────────────────
function validateCitation(response, chunks) {
  // extract [Chunk X] or (Chunk X) from response
  const citationMatches = response.match(/\[?Chunk\s*(\d+)\]?/gi) || [];
  const citedIds = citationMatches.map(m => parseInt(m.replace(/\D/g, "")));

  if (citedIds.length === 0) {
    return { citationFound: false, citationValid: false, citedChunkIds: [] };
  }

  // verify each cited chunk actually contains keywords from response
  const responseWords = response.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const validations = citedIds.map(id => {
    const chunk = chunks.find(c => c.id === id);
    if (!chunk) return { id, valid: false, reason: "Chunk ID not found" };

    const chunkWords = chunk.text.toLowerCase().split(/\s+/);
    const matchCount = responseWords.filter(w => chunkWords.includes(w)).length;
    const matchRatio = matchCount / responseWords.length;

    return {
      id,
      valid: matchRatio > 0.2,
      matchRatio: parseFloat(matchRatio.toFixed(3)),
    };
  });

  const allValid = validations.every(v => v.valid);

  return {
    citationFound: true,
    citationValid: allValid,
    citedChunkIds: citedIds,
    validations,
  };
}

// ── Consistency Checker ─────────────────────────────────────────
async function checkConsistency(response) {
  const consistencyPrompt = `Read this answer and check if it contradicts itself.
Reply with ONLY a JSON object, no extra text:
{"consistent": true/false, "reason": "one line explanation"}

Answer to check:
"${response}"`;

  const result = await chat(consistencyPrompt);

  try {
    const clean = result.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return { consistent: true, reason: "Could not parse consistency check" };
  }
}

// ── Hallucination Rate Tracker ──────────────────────────────────
const hallucinationLog = [];

function logHallucination(query, detected) {
  hallucinationLog.push({ query, detected });
}

function getHallucinationRate() {
  if (hallucinationLog.length === 0) return 0;
  const flagged = hallucinationLog.filter(l => l.detected).length;
  return parseFloat(((flagged / hallucinationLog.length) * 100).toFixed(1));
}

// ── Master QA Function ──────────────────────────────────────────
async function answer(userQuery) {
  const startTotal = Date.now();

  // STEP 1: Retrieve
  const retrievalStart = Date.now();
  const topChunks = await retrieve(userQuery, 2);
  const retrievalMs = Date.now() - retrievalStart;

  // STEP 2: Build context
  const context = topChunks
    .map(c => `[Chunk ${c.id} | score: ${c.score.toFixed(3)}]\n${c.text}`)
    .join("\n\n");

  const avgRetrievalScore = parseFloat(
    (topChunks.reduce((s, c) => s + c.score, 0) / topChunks.length).toFixed(3)
  );

  // STEP 3: Prompt
  const prompt = `
You are a precise document assistant.
Answer ONLY from the provided context. Never use outside knowledge.
If not in context, say "Not found in document."
Always cite which chunk your answer came from using format: [Chunk X]

Examples:
Q: What is Tanmay's CGPA?
A: Tanmay's CGPA is 8.05. [Chunk 0]

Q: What languages does Tanmay know?
A: Tanmay knows C, C++, Java, Node.js, React.js. [Chunk 0]

Think step by step:
1. Find relevant info in context
2. Verify it is from context
3. Give concise answer with chunk citation

CONTEXT:
${context}

Question: ${userQuery}
Answer:`.trim();

  // STEP 4: Generate
  const llmStart = Date.now();
  const responseText = await chat(prompt);
  const llmMs = Date.now() - llmStart;

  // STEP 5: Citation tracking
  const citation = validateCitation(responseText, topChunks);

  // STEP 6: Consistency check
  const consistencyStart = Date.now();
  const consistency = await checkConsistency(responseText);
  const consistencyMs = Date.now() - consistencyStart;

  // STEP 7: Hallucination detection
  const responseWords = responseText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const contextWords = context.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const precisionMatches = responseWords.filter(w => contextWords.includes(w)).length;
  const precision = parseFloat((precisionMatches / responseWords.length).toFixed(3));
  const hallucinationDetected = precision < 0.25 || !citation.citationValid;

  logHallucination(userQuery, hallucinationDetected);

  const totalMs = Date.now() - startTotal;

  // STEP 8: Cost estimate (Groq llama-3.3-70b — free tier, approximate)
  const inputTokens = Math.round(prompt.split(/\s+/).length * 1.3);
  const outputTokens = Math.round(responseText.split(/\s+/).length * 1.3);
  const estimatedCost = parseFloat(((inputTokens * 0.00000059) + (outputTokens * 0.00000079)).toFixed(6));

  // STEP 9: Telemetry
  const telemetry = {
    query: userQuery,
    avgRetrievalScore,
    citation,
    consistency,
    hallucinationDetected,
    hallucinationRate: `${getHallucinationRate()}%`,
    precision,
    latency: {
      retrievalMs,
      llmMs,
      consistencyMs,
      totalMs,
    },
    tokens: { inputTokens, outputTokens },
    estimatedCostUSD: estimatedCost,
  };

  console.log("\n=== ANSWER ===");
  console.log(responseText);
  console.log("\n=== TELEMETRY ===");
  console.log(JSON.stringify(telemetry, null, 2));

  return { response: responseText, telemetry };
}

// Test queries
const queries = [
  "What backend technologies does Tanmay know?",
  "What is Tanmay's CGPA?",
  "Where did Tanmay do his internship?",
];

for (const q of queries) {
  await answer(q);
}

console.log(`\n✅ Final Hallucination Rate: ${getHallucinationRate()}%`);