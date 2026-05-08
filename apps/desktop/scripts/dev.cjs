const { spawn } = require("child_process");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
const frontendDir = path.join(workspaceRoot, "apps", "frontend");

function run(command, args, options = {}) {
  const childProcess = spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  childProcess.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return childProcess;
}

const frontend = run("npm", [
  "--prefix",
  frontendDir,
  "run",
  "dev",
  "--",
  "--host",
  "127.0.0.1",
  "--port",
  "5173",
]);
const electron = run("npm", ["run", "start"]);

function shutdown() {
  if (!frontend.killed) {
    frontend.kill();
  }

  if (!electron.killed) {
    electron.kill();
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
