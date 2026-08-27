#!/usr/bin/env node
/**
 * First-time setup: env file, Postgres (Docker), npm install, database, seed data.
 * No paid API keys. Redis is optional (jobs run inline by default).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function log(message) {
  console.log(`\n==> ${message}`);
}

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} failed (exit ${result.status ?? "unknown"})`);
  }
}

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { stdio: "ignore", shell: process.platform === "win32" });
  return result.status === 0;
}

function portOpen(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function waitForPort(host, port, timeoutMs = 120_000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      if (await portOpen(host, port, 2000)) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`Timed out waiting for ${host}:${port}`));
        return;
      }
      setTimeout(attempt, 1000);
    };
    attempt();
  });
}

const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
if (major < 20) {
  fail(`Node.js 20+ is required (found ${process.version}). Install from https://nodejs.org`);
}

if (!existsSync(".env")) {
  log("Creating .env from .env.example (no API keys needed)");
  copyFileSync(".env.example", ".env");
} else {
  log(".env already exists — leaving it unchanged");
}

const postgresUp = await portOpen("127.0.0.1", 5432);
if (postgresUp) {
  log("Postgres already running on localhost:5432 — skipping Docker");
} else if (commandExists("docker")) {
  const compose = spawnSync("docker", ["compose", "version"], { stdio: "ignore" });
  if (compose.status !== 0) {
    fail("Docker Compose is required (`docker compose`). Update Docker Desktop and retry.");
  }
  log("Starting Postgres + Redis with Docker (first image pull can take a few minutes)");
  run("docker", ["compose", "up", "-d"]);
  log("Waiting for Postgres on localhost:5432");
  try {
    await waitForPort("127.0.0.1", 5432);
  } catch (error) {
    fail(error instanceof Error ? error.message : "Postgres did not become ready");
  }
} else {
  fail(
    "Postgres is not running on localhost:5432 and Docker was not found. Install Docker Desktop (recommended) or start Postgres with user/password/db `leadintel`, then re-run: npm run setup"
  );
}

log("Installing npm packages");
run("npm", ["install"]);

log("Creating database tables");
run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "db", "push"]);

log("Loading sample leads so the dashboard is not empty");
run("npm", ["run", "db:seed"]);

console.log(`
LeadIntel is ready. Completely free: OpenStreetMap + DuckDuckGo, no API keys.

Next:

  npm run dev

Then open http://localhost:3000

1. Dashboard shows seeded sample leads (demo data).
2. Click Generate leads.
3. Enter a business type and city (example: cafe / Dubai).
4. Keep OpenStreetMap checked. Leave Google Places unchecked (that one is paid).
5. Start with 10–20 leads. Wait on the job page until it completes.
6. Open Leads, sort by HOT / HIGH, export CSV if you want.

Optional later:
- Redis + INLINE_JOBS=false for background workers
- GOOGLE_PLACES_API_KEY if you choose to pay for Google Places
- OPENAI_API_KEY for AI notes on HOT/HIGH leads
`);
