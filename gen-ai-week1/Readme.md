## 🛠️ 6. Mini Project: CLI Chatbot + Telemetry

Build a Node.js CLI chatbot that:

- Sends prompts to an LLM (Gemini or Groq)
- Measures latency and token usage
- Calculates estimated cost
- Logs interactions to JSON
- Runs prompt-engineering A/B tests

### Project Structure

```
gen-ai-week1/
├── index.js         → CLI chatbot loop + Gemini API call + telemetry logging
├── stats.js         → Reads logs.json and shows total cost, tokens, avg latency
├── ab-test.js       → A/B testing for Direct, Role-based, and CoT prompts
├── groq-chat.js     → CLI chatbot using Groq models with telemetry logging
├── list-models.js   → Lists available Groq models and verifies API access
├── logs.json        → Auto-generated Gemini chatbot interaction logs
├── groq-logs.json   → Auto-generated Groq chatbot interaction logs
├── ab-logs.json     → Auto-generated A/B test results
├── .env             → GEMINI_API_KEY / GROQ_API_KEY
├── .env.example     → Example environment variable template
├── package.json     → Project config + dependencies ("type": "module")
├── package-lock.json→ Dependency lock file
└── node_modules/    → Installed npm packages
```

### Understand in This Order

```
1. package.json
2. .env
3. index.js
4. logs.json
5. stats.js
6. ab-test.js
```

---

### Setup

Install dependencies:

```
npm install
```

Configure API keys:

```
GEMINI_API_KEY=your_key
GROQ_API_KEY=your_key
```

---

### Run the CLI Chatbot

```bash
node index.js
```

Example:

```
You: Explain transformers simply
Bot: Transformers are neural network architectures...
```

For every message:

- prompt is sent to model
- response is received
- latency measured , token usage collected , estimated cost calculated
- interaction appended to `logs.json`

#### Expected Telemetry Output : Saved in logs

```json
{
  "timestamp": "2026-04-15T10:00:00.000Z",
  "prompt": "Explain transformers",
  "response": "...",
  "tokens": {
    "input": 15,
    "output": 180
  },
  "cost_usd": 0.0001,
  "latency_ms": 1200
}
```

This file covers making API calls to LLMs, working with asynchronous operations using async/await, tracking token usage and request costs, measuring response latency, logging telemetry data, and persisting results in JSON format.

---

### View Usage Statistics

```bash
node stats.js
```

Reads `logs.json`  and calculates total requests, total tokens, total cost, average latency, fastest response, most expensive request

#### Expected Output :

```
===== TELEMETRY STATS =====

Total requests   : 14
Total tokens     : 2847
  Input tokens   : 312
  Output tokens  : 2535
Total cost       : $0.001623
Avg latency      : 1380ms
Most expensive   : $0.00032100
Fastest response : 890ms

===========================
```

#### Main Learning

This file taught how to read and process JSON files, perform data aggregation and analytics, monitor API costs, and understand the fundamentals of observability and system monitoring. 

It can be thought of as a simplified version of tools such as the OpenAI Usage Dashboard, LangSmith, Datadog, and Grafana, which are commonly used for tracking usage, costs, performance metrics, and system health.

---

### Run Prompt A/B Testing

```bash
node ab-test.js
```

Compare prompt styles:

```
Direct:
Explain RAG.

Role-Based:
You are a senior AI engineer. Explain RAG.

Chain-of-Thought:
Think step-by-step and explain RAG.
```

---

For each prompt style, it measures: 

- latency
- output tokens
- estimated cost
- response quality

Results are saved to: `ab-logs.json`

---

#### Expected Output

```
===== A/B TEST RESULTS =====

[DIRECT]
Latency : 13104ms
Tokens  : 10in / 791out
Cost    : $0.0004761
Response preview: API stands for **Application Programming Interface**.

In simple terms, think of an API as a **messenger** or a **transl...

[ROLE_BASED]
Latency : 11359ms
Tokens  : 22in / 895out
Cost    : $0.0005403
Response preview: Alright, [Junior Dev's Name], pull up a chair. Let's talk about APIs. It sounds fancy, but it's a super fundamental conc...

[CHAIN_OF_THOUGHT]
Latency : 9069ms
Tokens  : 18in / 505out
Cost    : $0.0003057
Response preview: Let's break down what an API is in the simplest terms possible.

API stands for **Application Programming Interface**.

...

===== WINNER =====
Fastest      : chain_of_thought
Cheapest     : chain_of_thought
Most detailed: role_based
==================
```

### A/B Test Results (your actual run)

| Prompt Type | Latency | Tokens Out | Cost | Winner |
| --- | --- | --- | --- | --- |
| Direct | 11065ms | 531 | $0.000320 | 🏆 Fastest + Cheapest |
| Role-based | 14245ms | 1149 | $0.000693 | 🏆 Most Detailed |
| Chain-of-thought | 14099ms | 946 | $0.000570 | Middle ground |

### Key insight from A/B test

```
Direct      → production user chat    (optimize for cost + speed)
Role-based  → onboarding flows        (worth the 2x cost)
CoT         → reasoning / debugging   (structured, reliable)
```

---

## Main Learning

This file taught:

- Prompt engineering
- Performance tradeoffs
- Cost vs quality analysis
- Experimentation workflow

---

### How Everything Connects

```
User Prompt
    ↓
 index.js
    ↓
   LLM
    ↓
 Response
    ├── Telemetry Log :logs.json
    └── Performance Metrics : stats.js
```

And:

```
Prompt Variants
      ↓
  ab-test.js
      ↓
Compare Cost / Quality / Speed
```

---

#### Quick Start

```bash
# Install packages
npm install

# Chat with the Gemini
node index.js

# Chat with the Groq API
node groq-chat.js

# View accumulated metrics
node stats.js

# Run prompt experiments
node ab-test.js
```

---

## 🔗 Everything connects to RAG

```
Tokens       → RAG cost
Embeddings   → Retrieval search
Transformers → Context limits
Prompts      → Answer quality
```
