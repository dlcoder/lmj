// Starts scripts/serve-site.mjs and runs linkinator against it, internal links
// only (external ones are skipped: there are thousands of bucket images).
import { spawn } from "node:child_process";
import { once } from "node:events";

const PORT = 8099;
const server = spawn(process.execPath, ["scripts/serve-site.mjs"], {
  stdio: ["ignore", "ignore", "inherit"],
  env: { ...process.env, PORT: String(PORT) }
});

// Wait until the port accepts connections.
for (let i = 0; i < 50; i++) {
  try {
    await fetch(`http://localhost:${PORT}/`);
    break;
  } catch {
    await new Promise(r => setTimeout(r, 100));
  }
}

const linkinator = spawn(
  "npx",
  [
    "--yes", "linkinator",
    `http://localhost:${PORT}/`,
    "--recurse",
    "--skip", "^https?://(?!localhost)"
  ],
  { stdio: "inherit" }
);

const [code] = await once(linkinator, "close");
server.kill();
process.exit(code ?? 0);
