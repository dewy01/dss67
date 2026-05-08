const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const workspaceRoot = path.resolve(__dirname, "..", "..", "..");
const frontendDir = path.join(workspaceRoot, "apps", "frontend");
const backendDir = path.join(workspaceRoot, "services", "backend");

const targetPlatform = process.argv[2] ?? process.platform;

function getPythonCommand() {
  const candidatePaths = [
    path.join(workspaceRoot, ".venv", "Scripts", "python.exe"),
    path.join(workspaceRoot, ".venv", "Scripts", "python"),
    "C:/Users/dawid/AppData/Local/Programs/Python/Python311/python.exe",
    "python",
  ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      const probe = spawnSync(candidatePath, ["-c", "import PyInstaller"], {
        stdio: "ignore",
        shell: false,
      });

      if (probe.status === 0) {
        return candidatePath;
      }
    }
  }

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return "python";
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function buildForPlatform(platform) {
  console.log(`Building for platform: ${platform}`);

  run("npm", ["--prefix", frontendDir, "run", "build"]);
  run(getPythonCommand(), [path.join(backendDir, "build_backend.py")], {
    cwd: backendDir,
  });

  const electronBuilderArgs = ["electron-builder", "--publish", "never"];
  if (platform !== "all" && platform !== process.platform) {
    electronBuilderArgs.push("--", platform);
  }

  run("npx", electronBuilderArgs);
}

if (targetPlatform === "all") {
  buildForPlatform("win32");
  if (process.platform === "darwin") {
    buildForPlatform("darwin");
  }
} else if (["win32", "darwin", "linux"].includes(targetPlatform)) {
  buildForPlatform(targetPlatform);
} else {
  buildForPlatform(process.platform);
}
