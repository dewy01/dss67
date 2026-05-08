const { contextBridge } = require("electron");

const backendUrlArgument = process.argv.find((argument) =>
  argument.startsWith("--backend-url="),
);

const backendUrl = backendUrlArgument
  ? decodeURIComponent(backendUrlArgument.slice("--backend-url=".length))
  : "http://127.0.0.1:8000";

contextBridge.exposeInMainWorld("desktopApi", {
  backendUrl,
});
