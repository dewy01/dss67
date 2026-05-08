const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const WORKSPACE_ROOT = path.resolve(__dirname);
const DESKTOP_DIR = path.join(WORKSPACE_ROOT, "apps", "desktop");

function log(message, color = "\x1b[36m") {
  console.log(`${color}[DSS67 Build]${"\x1b[0m"} ${message}`);
}

function error(message) {
  console.error(`\x1b[31m[DSS67 Build Error]\x1b[0m ${message}`);
  process.exit(1);
}

function run(command, args, options = {}) {
  log(`Running: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    cwd: WORKSPACE_ROOT,
    ...options,
  });

  if (result.status !== 0) {
    error(
      `Command failed with exit code ${result.status}: ${command} ${args.join(
        " ",
      )}`,
    );
  }
}

function buildForPlatform(platform) {
  log(`Building Decision Support Studio for ${platform}`, "\x1b[35m");

  if (platform === "darwin" && process.platform !== "darwin") {
    error("macOS build can only run on macOS");
  }

  if (platform === "win32" && process.platform === "darwin") {
    error("Windows build cannot run on macOS (use GitHub Actions for CI)");
  }

  run("npm", ["--prefix", DESKTOP_DIR, "run", "build", "--", platform]);

  const distFolder = path.join(DESKTOP_DIR, "dist");
  const outFiles = fs.readdirSync(distFolder).filter((f) => {
    if (platform === "win32") return f.endsWith(".exe");
    if (platform === "darwin") return f.endsWith(".dmg");
    return false;
  });

  if (outFiles.length > 0) {
    log(`✓ Built artifacts for ${platform}:`, "\x1b[32m");
    outFiles.forEach((f) => {
      const fullPath = path.join(distFolder, f);
      const stat = fs.statSync(fullPath);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
      console.log(`  • ${f} (${sizeMB} MB)`);
    });
  } else {
    error(`No output artifacts found for ${platform}`);
  }
}

function main() {
  const targetPlatform = process.argv[2] ?? "current";

  log("Decision Support Studio - Build Orchestrator", "\x1b[33m");
  log(`Platform: ${os.platform()}`);
  log(`Node: ${process.version}`);
  log(`NPM: ${spawnSync("npm", ["-v"], { encoding: "utf8" }).stdout.trim()}`);

  const platformMap = {
    current: process.platform,
    win: "win32",
    windows: "win32",
    mac: "darwin",
    macos: "darwin",
    darwin: "darwin",
    all: "all",
  };

  const platform = platformMap[targetPlatform] ?? targetPlatform;

  if (!["win32", "darwin", "all"].includes(platform)) {
    error(
      `Invalid platform: ${targetPlatform}. Use: current, win, mac, or all`,
    );
  }

  try {
    if (platform === "all") {
      buildForPlatform("win32");

      if (process.platform === "darwin") {
        log(
          "macOS detected. Building macOS DMG after Windows build.",
          "\x1b[33m",
        );
        buildForPlatform("darwin");
      } else {
        log(
          "Skipping macOS build (not on macOS). Run on macOS or use CI to build DMG.",
          "\x1b[33m",
        );
      }
    } else {
      buildForPlatform(platform);
    }

    log("✓ Build completed successfully!", "\x1b[32m");
  } catch (err) {
    error(`Build failed: ${err.message}`);
  }
}

main();
