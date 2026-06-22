import fs from "fs";
import path from "path";
import { embedText } from "../embedder.js";

/*
- got all individual words via `text.split(/\s+/)` → `words[]`
- `chunks[]` to hold all chunk objects, `i = 0` as pointer
- loop runs while `i < words.length`
- `chunkWords` = slice 200 words from position `i`
- `chunk` = stitch them back with space between each word
- push chunk object → `{ id, text, wordCount, startIndex, endIndex }`
- move `i` forward by `chunkSize - overlap` (200-50=150) → ensures 50 word overlap between consecutive chunks
- repeat until all words covered, last chunk may have < 200 words, slice handles it naturally

*/
function chunkText(text, chunkSize = 200, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  let i = 0;

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunk = chunkWords.join(" ");

    chunks.push({
      id: chunks.length,
      text: chunk,
      wordCount: chunkWords.length,
      startIndex: i,
      endIndex: i + chunkWords.length - 1,
    });

    i += chunkSize - overlap;
  }

  return chunks;
}

/*
- takes `chunks[]` as input (array of chunk objects we built earlier)
- `reduce` loops over all chunks, accumulates `wordCount` of each → gets `totalWords`
- `avgWordCount` = totalWords / number of chunks, rounded
- logs summary → total chunks, avg size, overlap (hardcoded 50), overlap ratio (50/200 = 25%)
- then loops over every chunk via `forEach`
- logs chunk id + wordCount
- `chunk.text.slice(0, 100)` → just first 100 characters (not words) of chunk text as preview, appends `"..."` at end
*/
function analyzeChunks(chunks) {
  const totalWords = chunks.reduce((sum, c) => sum + c.wordCount, 0);
  const avgWordCount = Math.round(totalWords / chunks.length);

  console.log("=== CHUNK ANALYSIS ===");
  console.log(`Total chunks     : ${chunks.length}`);
  console.log(`Avg chunk size   : ${avgWordCount} words`);
  console.log(`Overlap          : 50 words`);
  console.log(`Overlap ratio    : ${((50 / 200) * 100).toFixed(1)}%`);
  console.log("\n=== CHUNKS PREVIEW ===");

  chunks.forEach((chunk) => {
    console.log(`\n[Chunk ${chunk.id}] words: ${chunk.wordCount}`);
    console.log(chunk.text.slice(0, 100) + "...");
  });
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

const filePath = path.resolve("rag/sample.txt");
const text = fs.readFileSync(filePath, "utf-8");

const chunks = chunkText(text, 200, 50);
analyzeChunks(chunks);

async function compareChunkSizes() {
  const chunkConfigs = [
    { size: 50, overlap: 10, label: "Small  (50w)" },
    { size: 100, overlap: 25, label: "Medium (100w)" },
    { size: 200, overlap: 50, label: "Large  (200w)" },
  ];

  const query = "What backend technologies does Tanmay know?";
  const queryEmbedding = await embedText(query);

  console.log("\n=== CHUNK SIZE COMPARISON ===");
  console.log(`Query: "${query}"\n`);

  for (const config of chunkConfigs) {
    const chunks = chunkText(text, config.size, config.overlap);

    const embedded = [];
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      embedded.push({ ...chunk, embedding });
    }

    const scored = embedded
      .map(c => ({
        id: c.id,
        score: cosineSimilarity(queryEmbedding, c.embedding),
        preview: c.text.slice(0, 80),
      }))
      .sort((a, b) => b.score - a.score);

    const top = scored[0];
    const avgScore = (scored.reduce((s, c) => s + c.score, 0) / scored.length).toFixed(3);

    console.log(`--- ${config.label} ---`);
    console.log(`Total chunks    : ${chunks.length}`);
    console.log(`Avg similarity  : ${avgScore}`);
    console.log(`Top chunk score : ${top.score.toFixed(4)}`);
    console.log(`Top chunk preview: "${top.preview}..."`);
    console.log();
  }
}

compareChunkSizes();