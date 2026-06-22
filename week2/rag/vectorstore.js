import { embedText } from "../embedder.js";
import { chunkText } from "./chunker.js";
import fs from "fs";
import path from "path";

export async function buildVectorStore(filePath) {
  const text = fs.readFileSync(path.resolve(filePath), "utf-8");
  const chunks = chunkText(text, 200, 50);

  console.log(`Embedding ${chunks.length} chunks...`);

  const vectorStore = [];

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.text);
    vectorStore.push({
      id: chunk.id,
      text: chunk.text,
      embedding,
    });
    console.log(`✓ Chunk ${chunk.id} embedded — vector size: ${embedding.length}`);
  }

  fs.writeFileSync(
    path.resolve("rag/vectorstore.json"),
    JSON.stringify(vectorStore, null, 2)
  );

  console.log("\n✅ Vector store saved to rag/vectorstore.json");
  return vectorStore;
}

buildVectorStore("rag/sample.txt");
