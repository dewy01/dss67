const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const https = require("https");
const net = require("net");
const path = require("path");

const BACKEND_HOST = "127.0.0.1";
const FRONTEND_DEV_URL = "http://127.0.0.1:5173";

let backendProcess = null;
let backendUrl = `http://${BACKEND_HOST}:8000`;
let mainWindow = null;

function getWorkspaceRoot() {
  return path.resolve(__dirname, "..", "..");
}

function getBackendWorkingDirectory() {
  return path.join(getWorkspaceRoot(), "services", "backend");
}

function getDevPythonExecutable() {
  const workspaceRoot = getWorkspaceRoot();
  const candidatePaths = [
    path.join(workspaceRoot, ".venv", "Scripts", "python.exe"),
    path.join(workspaceRoot, ".venv", "Scripts", "python"),
  ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return process.env.PYTHON || "python";
}

function getPackagedBackendExecutable() {
  const executableName =
    process.platform === "win32"
      ? "decision-support-backend.exe"
      : "decision-support-backend";

  const candidates = [
    path.join(process.resourcesPath ?? "", "backend", executableName),
    path.join(app.getAppPath(), "..", "backend", executableName),
    path.join(app.getAppPath(), "..", "..", "backend", executableName),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      console.log(`[Backend] Found at: ${candidate}`);
      return candidate;
    }
  }

  console.error(`[Backend] Not found in any candidate location:`);
  candidates.forEach((c) => console.error(`  - ${c}`));

  return path.join(app.getAppPath(), "..", "backend", executableName);
}

function waitForPortOpen(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const check = () => {
      const client = url.startsWith("https:") ? https : http;
      const request = client.get(url, (response) => {
        response.resume();

        if (
          response.statusCode &&
          response.statusCode >= 200 &&
          response.statusCode < 500
        ) {
          resolve(undefined);
          return;
        }

        retry();
      });

      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() >= deadline) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(check, 200);
    };

    check();
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, BACKEND_HOST, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close(() =>
          reject(new Error("Unable to determine backend port")),
        );
        return;
      }

      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function startBackend(port) {
  const isPackaged = app.isPackaged;
  const command = isPackaged
    ? getPackagedBackendExecutable()
    : getDevPythonExecutable();
  const args = isPackaged
    ? ["--host", BACKEND_HOST, "--port", String(port)]
    : ["-m", "app.cli", "--host", BACKEND_HOST, "--port", String(port)];
  const cwd = isPackaged ? undefined : getBackendWorkingDirectory();

  console.log(`[Backend] Starting in ${isPackaged ? "packaged" : "dev"} mode`);
  console.log(`[Backend] Command: ${command}`);
  console.log(`[Backend] Args: ${args.join(" ")}`);
  console.log(`[Backend] CWD: ${cwd ?? "default"}`);

  backendProcess = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
    stdio: "inherit",
    windowsHide: true,
  });

  backendProcess.on("error", (err) => {
    console.error(`[Backend] Failed to start:`, err.message);
    if (err.code === "ENOENT") {
      console.error(`[Backend] Executable not found at: ${command}`);
    }
  });

  backendProcess.on("exit", (code, signal) => {
    if (!app.isQuitting && code !== 0 && signal !== "SIGTERM") {
      console.error(
        `[Backend] Exited unexpectedly with code ${code ?? "unknown"}`,
      );
    }
  });
}

function stopBackend() {
  if (!backendProcess || backendProcess.killed) {
    return;
  }

  backendProcess.kill();
  backendProcess = null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    backgroundColor: "#0f1115",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--backend-url=${encodeURIComponent(backendUrl)}`],
    },
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (app.isPackaged) {
    const frontendIndex = path.join(
      process.resourcesPath,
      "frontend",
      "index.html",
    );
    return mainWindow.loadFile(frontendIndex);
  }

  return mainWindow.loadURL(FRONTEND_DEV_URL);
}

async function bootstrap() {
  const backendPort = await getFreePort();
  backendUrl = `http://${BACKEND_HOST}:${backendPort}`;
  startBackend(backendPort);

  await waitForPortOpen(`${backendUrl}/health`);

  if (!app.isPackaged) {
    await waitForPortOpen(FRONTEND_DEV_URL);
  }

  await createWindow();
}

app.whenReady().then(() => {
  void bootstrap().catch((error) => {
    console.error(error);
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
