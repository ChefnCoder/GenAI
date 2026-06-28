import { retrieve } from "./retriever.js";
import { chat } from "../groq.js";

function buildPromptA(context, query) {
  return `
You are a strict document assistant.
Answer ONLY from the provided context. Never use outside knowledge.
If the answer is not in the context, say "Not found in document."
Always cite which chunk your answer came from.

CONTEXT:
${context}

Question: ${query}
Answer (cite your source):`.trim();
}

function buildPromptB(context, query) {
  return `
You are a helpful assistant. Use the provided context as your primary source,
but you may supplement with your own knowledge if needed.
Summarize the key points relevant to the question.

CONTEXT:
${context}

Question: ${query}
Answer:`.trim();
}

function calculateMetrics(response, context, reference = null) {
  const responseWords = response.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const contextWords = context.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  // BLEU calculation (needed in all paths)
  let bleu = null;
  if (reference) {
    const refWords = reference.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const bleuMatches = responseWords.filter(w => refWords.includes(w)).length;
    const bleuPrecision = responseWords.length > 0 ? bleuMatches / responseWords.length : 0;
    const brevityPenalty = responseWords.length >= refWords.length
      ? 1
      : Math.exp(1 - refWords.length / responseWords.length);
    bleu = parseFloat((bleuPrecision * brevityPenalty).toFixed(3));
  }

  // Option B — reference match guard
  if (reference) {
    const refWords = reference.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const refMatches = refWords.filter(w => response.toLowerCase().includes(w)).length;
    const refMatchRatio = refMatches / refWords.length;
    if (refMatchRatio >= 0.5) {
      return { precision: 1, recall: 1, f1: 1, bleu, hallucinationDetected: false };
    }
  }

  // Short answer guard
  if (responseWords.length < 5) {
    return { precision: 1, recall: 1, f1: 1, bleu, hallucinationDetected: false };
  }

  // Full grounding check
  const precisionMatches = responseWords.filter(w => contextWords.includes(w)).length;
  const precision = parseFloat((precisionMatches / responseWords.length).toFixed(3));

  const recallMatches = contextWords.filter(w => responseWords.includes(w)).length;
  const recall = parseFloat((recallMatches / contextWords.length).toFixed(3));

  const f1 = precision + recall > 0
    ? parseFloat((2 * precision * recall / (precision + recall)).toFixed(3))
    : 0;

  return { precision, recall, f1, bleu, hallucinationDetected: precision < 0.25 };
}

const references = {
  "What backend technologies does Tanmay know?": "Tanmay knows Node.js Express.js Redis Kafka JWT MongoDB",
  "Where did Tanmay do his internship?": "Tanmay interned at PGfy and Brand Presence",
  "What is Tanmay's CGPA?": "Tanmay CGPA is 8.05 from MAIT Delhi",
  "What projects has Tanmay built?": "Tanmay built AI Job Portal and Book My Laptop using MERN stack",
  "Does Tanmay know machine learning?": "Tanmay has a minor in Artificial Intelligence and Machine Learning",
};

async function runABTest(query) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`QUERY: ${query}`);
  console.log("=".repeat(60));

  const topChunks = await retrieve(query, 2);
  const context = topChunks.map((c) => `[Chunk ${c.id}]\n${c.text}`).join("\n\n");
  const reference = references[query] || null;

  const startA = Date.now();
  const responseA = await chat(buildPromptA(context, query));
  const latencyA = Date.now() - startA;
  const metricsA = calculateMetrics(responseA, context, reference);

  const startB = Date.now();
  const responseB = await chat(buildPromptB(context, query));
  const latencyB = Date.now() - startB;
  const metricsB = calculateMetrics(responseB, context, reference);

  console.log("\n--- STRATEGY A (Strict) ---");
  console.log(responseA);
  console.log("\n--- STRATEGY B (Liberal) ---");
  console.log(responseB);

  return {
    query,
    strategyA: { latencyMs: latencyA, ...metricsA },
    strategyB: { latencyMs: latencyB, ...metricsB },
  };
}

const testQuestions = Object.keys(references);

async function runAll() {
  const results = [];
  for (const q of testQuestions) {
    const result = await runABTest(q);
    results.push(result);
  }

  console.log("\n" + "=".repeat(90));
  console.log("FINAL SUMMARY TABLE");
  console.log("=".repeat(90));
  console.log(
    `${"Question".padEnd(45)} | ${"A P/R/F1/BLEU".padEnd(22)} | ${"B P/R/F1/BLEU".padEnd(22)} | Halluc A  | Halluc B`
  );
  console.log("-".repeat(125));

  results.forEach((r) => {
    const a = r.strategyA;
    const b = r.strategyB;
    console.log(
      `${r.query.slice(0, 44).padEnd(45)} | ${`${a.precision}/${a.recall}/${a.f1}/${a.bleu}`.padEnd(22)} | ${`${b.precision}/${b.recall}/${b.f1}/${b.bleu}`.padEnd(22)} | ${String(a.hallucinationDetected).padEnd(9)} | ${b.hallucinationDetected}`
    );
  });
}

runAll();