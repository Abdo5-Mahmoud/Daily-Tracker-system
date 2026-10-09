/**
 * Subagent DAG Generator & Telemetry Visualizer
 * Reads subagent tasks and outputs:
 * 1. Mermaid Flowchart DAG with color-coded states
 * 2. Terminal Live Dependency Table
 * 3. Export to file for Miro MCP synchronization
 */

const fs = require('fs');
const path = require('path');

// Parse CLI flags
const args = process.argv.slice(2);
let pipelineFile = null;
let outputFile = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pipeline' && args[i + 1]) {
    pipelineFile = args[i + 1];
    i++;
  } else if (args[i] === '--output' && args[i + 1]) {
    outputFile = args[i + 1];
    i++;
  }
}

// Fallback search for default pipeline file
if (!pipelineFile) {
  const defaultPipeline = path.join(__dirname, 'active_subagent_pipeline.json');
  if (fs.existsSync(defaultPipeline)) {
    pipelineFile = defaultPipeline;
  }
}

// Sample or fallback task registry
const fallbackTasks = [
  {
    id: "TASK-01",
    name: "Amazon Egypt Price Scraper",
    agent: "Backend Scraper Subagent",
    dependsOn: [],
    status: "COMPLETED",
    elapsedSec: 14,
    tokens: 3200,
    deliverable: "local-business-store/scripts/amazon_competitor_analyzer.py"
  },
  {
    id: "TASK-02",
    name: "Competitor Schema & Price Extractor",
    agent: "Data Parser Subagent",
    dependsOn: ["TASK-01"],
    status: "COMPLETED",
    elapsedSec: 8,
    tokens: 1850,
    deliverable: "local-business-store/data/competitor_pricing.json"
  },
  {
    id: "TASK-03",
    name: "Adversarial Code Reviewer",
    agent: "Nemotron Audit Subagent",
    dependsOn: ["TASK-02"],
    status: "COMPLETED",
    elapsedSec: 12,
    tokens: 2400,
    deliverable: "Verification Report"
  },
  {
    id: "TASK-04",
    name: "Free Marketing Creative Asset Engine",
    agent: "Creative AI Subagent",
    dependsOn: ["TASK-03"],
    status: "COMPLETED",
    elapsedSec: 19,
    tokens: 4100,
    deliverable: "local-business-store/scripts/remove_background.py"
  }
];

let tasks = fallbackTasks;
if (pipelineFile && fs.existsSync(pipelineFile)) {
  try {
    const raw = fs.readFileSync(pipelineFile, 'utf8');
    tasks = JSON.parse(raw);
  } catch (err) {
    console.error(`[!] Error parsing pipeline file ${pipelineFile}:`, err.message);
  }
}

function generateMermaidDAG(taskList) {
  let mermaid = "flowchart TD\n";
  mermaid += "    Root[\"Lead Orchestrator (Blue)\"]\n\n";

  // Define Nodes
  taskList.forEach(t => {
    const statusIcon = t.status === "COMPLETED" ? "✅" :
                       t.status === "RUNNING" ? "⚡" :
                       t.status === "BLOCKED" ? "⏸" :
                       t.status === "AWAITING_REVIEW" ? "🔍" : "❌";
    const label = `"${statusIcon} ${t.id}: ${t.name}<br/>Agent: ${t.agent}<br/>Status: [${t.status}]"`;
    mermaid += `    ${t.id.replace(/-/g, "_")}[${label}]\n`;
  });

  mermaid += "\n    %% Dependencies & Handover Channels\n";
  taskList.forEach(t => {
    if (!t.dependsOn || t.dependsOn.length === 0) {
      mermaid += `    Root --> ${t.id.replace(/-/g, "_")}\n`;
    } else {
      t.dependsOn.forEach(dep => {
        mermaid += `    ${dep.replace(/-/g, "_")} -->|Handover Artifact| ${t.id.replace(/-/g, "_")}\n`;
      });
    }
  });

  mermaid += "\n    %% Color Coded State Styling\n";
  mermaid += "    classDef completed fill:#1c4532,stroke:#38a169,stroke-width:2px,color:#fff;\n";
  mermaid += "    classDef running fill:#1a365d,stroke:#3182ce,stroke-width:2px,color:#fff;\n";
  mermaid += "    classDef blocked fill:#744210,stroke:#d69e2e,stroke-width:2px,color:#fff;\n";
  mermaid += "    classDef review fill:#553c9a,stroke:#805ad5,stroke-width:2px,color:#fff;\n";

  taskList.forEach(t => {
    const nodeKey = t.id.replace(/-/g, "_");
    if (t.status === "COMPLETED") mermaid += `    class ${nodeKey} completed;\n`;
    else if (t.status === "RUNNING") mermaid += `    class ${nodeKey} running;\n`;
    else if (t.status === "BLOCKED") mermaid += `    class ${nodeKey} blocked;\n`;
    else if (t.status === "AWAITING_REVIEW") mermaid += `    class ${nodeKey} review;\n`;
  });

  return mermaid;
}

function renderConsoleTable(taskList) {
  console.log("\n=========================================================================================");
  console.log("                     SUBAGENT TASK DAG & OBSERVABILITY MONITOR                           ");
  console.log("=========================================================================================");
  console.log("ID       | STATUS            | AGENT                       | ELAPSED | TOKENS  | BLOCKED BY");
  console.log("---------|-------------------|-----------------------------|---------|---------|-----------");
  taskList.forEach(t => {
    const id = t.id.padEnd(8);
    const status = `[${t.status}]`.padEnd(17);
    const agent = (t.agent.length > 27 ? t.agent.substring(0, 24) + "..." : t.agent).padEnd(27);
    const elapsed = `${t.elapsedSec}s`.padEnd(7);
    const tokens = `${t.tokens}`.padEnd(7);
    const blockedBy = (t.dependsOn && t.dependsOn.length > 0) ? t.dependsOn.join(", ") : "None";
    console.log(`${id} | ${status} | ${agent} | ${elapsed} | ${tokens} | ${blockedBy}`);
  });
  console.log("=========================================================================================\n");
}

// Execute
renderConsoleTable(tasks);
const mermaidCode = generateMermaidDAG(tasks);
console.log("Generated Mermaid DAG Code:\n");
console.log(mermaidCode);

if (outputFile) {
  try {
    fs.writeFileSync(outputFile, mermaidCode, 'utf8');
    console.log(`[+] Exported Mermaid DAG to: ${outputFile}`);
  } catch (err) {
    console.error(`[!] Failed to write output file:`, err.message);
  }
}

module.exports = { generateMermaidDAG, renderConsoleTable, tasks };
