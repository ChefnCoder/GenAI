import * as fs from "fs";

const LOG_FILE = "logs.json";

function showStats() {
  if (!fs.existsSync(LOG_FILE)) {
    console.log("No logs found. Chat first.");
    return;
  }

  const logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));

  if (logs.length === 0) {
    console.log("No entries in logs.");
    return;
  }

  const totalRequests = logs.length;
  const totalInputTokens = logs.reduce((sum, l) => sum + l.tokens.input, 0);
  const totalOutputTokens = logs.reduce((sum, l) => sum + l.tokens.output, 0);
  const totalCost = logs.reduce((sum, l) => sum + l.cost_usd, 0);
  const avgLatency = logs.reduce((sum, l) => sum + l.latency_ms, 0) / totalRequests;

  console.log("\n===== TELEMETRY STATS =====");
  console.log(`Total requests   : ${totalRequests}`);
  console.log(`Total tokens     : ${totalInputTokens + totalOutputTokens} (in: ${totalInputTokens} | out: ${totalOutputTokens})`);
  console.log(`Total cost       : $${totalCost.toFixed(6)}`);
  console.log(`Avg latency      : ${avgLatency.toFixed(0)}ms`);
  console.log(`Most expensive   : $${Math.max(...logs.map(l => l.cost_usd)).toFixed(8)}`);
  console.log(`Fastest response : ${Math.min(...logs.map(l => l.latency_ms))}ms`);
  console.log("===========================\n");
}

showStats();