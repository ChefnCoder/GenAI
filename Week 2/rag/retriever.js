import { embedText } from "../embedder.js";
import fs from "fs";
import path from "path";

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB); // returns -1 to 1
}

export async function retrieve(query, topK = 2) {
  const vectorStore = JSON.parse(
    fs.readFileSync(path.resolve("rag/vectorstore.json"), "utf-8")
  );

  const queryEmbedding = await embedText(query);

  const scored = vectorStore.map((chunk) => ({
    id: chunk.id,
    text: chunk.text,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  const topChunks = scored.slice(0, topK);

  console.log(`\n=== RETRIEVAL RESULTS for: "${query}" ===`);
  topChunks.forEach((chunk) => {
    console.log(`\n[Chunk ${chunk.id}] similarity: ${chunk.score.toFixed(4)}`);
    console.log(chunk.text.slice(0, 150) + "...");
  });

  return topChunks;
}

retrieve("What backend technologies does Tanmay know?");
