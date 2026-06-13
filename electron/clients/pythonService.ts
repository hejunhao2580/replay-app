import path from "path";
import { RESOURCES_PATH } from "../constants";
import os from "os";
import type * as ChildProcess from "child_process";
import { showErrorAlert } from "../utils/util";
import { windows } from "../index";
import { app } from "electron";
import api, { apiPort } from "../../shared/clients/api";
import tcpPortUsed from "tcp-port-used";
import fs from "fs";
import isDev from "electron-is-dev";
import ReadableStreamClone from "readable-stream-clone";
import { isLinux, isMac, isMacArm, isMacX64, isWindows } from "../utils/constants.ts";
import { logDir, serverLogger } from "@replay/shared/logger.ts";
import { execa } from "execa";
import LogStreamWrapper from "../utils/log-stream-wrapper.ts";
import find from "find-process";
import terminate from "terminate/promise";
import pidtree from "pidtree";
import type { AxiosProgressEvent } from "axios";
import axios from "axios";
import { httpAgent, httpsAgent } from "./agents.ts";
import jetpack from "fs-jetpack";
import { localAppDir } from "../utils/import-before-all-import.ts";
import decompress from "decompress";
import fsp from "fs/promises";
import axiosRetry from "axios-retry";
import { db } from "../data/database.ts";
import { getCurrentLanguage, getProductName } from "../i18n/language.ts";

const logger = serverLogger;

const serverText = {
  en: {
    fetchingLatest: (version: string) => `Fetching latest backend service, version ${version}`,
    checkingFile: (current: number, total: number) => `Checking file ${current}/${total}`,
    downloadingFile: (current: number, total: number) => `Downloading file ${current}/${total}`,
    extractingFile: (current: number, total: number) => `Extracting file ${current}/${total}`,
    usingBundled: "Using the backend service included with the app",
    downloadingLatest: "Downloading latest backend service",
    downloadComplete: "Download complete",
    errorPrefix: "Error",
    running: "Backend service is running",
    reusingExisting: "Detected an existing backend service; reusing it.",
    starting: "Starting backend service...",
    startingAlready: "Backend service is already starting...",
    portUnavailable: "Backend service port is unavailable",
    missingBackend: "Backend service program was not found",
    missingBackendBody: "Backend service program was not found (python or packaged service file).",
    backendStderr: (message: string) => `Backend service error: ${message}`,
    stopped: "Backend service stopped",
    exited: (code: Error | number | null) => `Backend service exited unexpectedly, exit code ${code}`,
    backendError: (message: string) => `Backend service error: ${message}`,
    appErrorTitle: () => `${getProductName("en")} ran into a problem`,
    appErrorBody: (message: string) => `${message}.\n\nPlease report this issue from the app menu.`,
    retryStopped: "Backend service failed more than 3 times. Retry stopped.",
    stopping: "Stopping backend service...",
    quitting: "Quitting app...",
  },
  zh: {
    fetchingLatest: (version: string) => `正在获取最新版后台服务，版本 ${version}`,
    checkingFile: (current: number, total: number) => `正在检查文件 ${current}/${total}`,
    downloadingFile: (current: number, total: number) => `正在下载文件 ${current}/${total}`,
    extractingFile: (current: number, total: number) => `正在解压文件 ${current}/${total}`,
    usingBundled: "正在使用随软件提供的后台服务",
    downloadingLatest: "正在下载最新版后台服务",
    downloadComplete: "下载完成",
    errorPrefix: "出错",
    running: "后台服务已启动",
    reusingExisting: "检测到已有后台服务，已复用。",
    starting: "正在启动后台服务...",
    startingAlready: "后台服务正在启动...",
    portUnavailable: "后台服务端口不可用",
    missingBackend: "找不到后台服务程序",
    missingBackendBody: "找不到后台服务程序（python 或打包后的服务文件）。",
    backendStderr: (message: string) => `后台服务报错：${message}`,
    stopped: "后台服务已停止",
    exited: (code: Error | number | null) => `后台服务异常退出，退出码 ${code}`,
    backendError: (message: string) => `后台服务出错：${message}`,
    appErrorTitle: () => `${getProductName("zh")}出错了`,
    appErrorBody: (message: string) => `${message}。\n\n请在软件菜单里反馈这个问题。`,
    retryStopped: "后台服务连续出错超过 3 次，已停止重试",
    stopping: "正在停止后台服务...",
    quitting: "正在退出应用...",
  },
};

const getServerText = () => serverText[getCurrentLanguage()];

axiosRetry(axios, { retries: 2 });
const delay = (delayMs: number) => new Promise<void>((resolve) => setTimeout(resolve, delayMs));
const getPackagedServerBinName = () => {
  if (isWindows) {
    return "packager-win.exe";
  }
  if (isLinux) {
    return "packager-linux";
  }
  return "packager-mac";
};

const isRunning = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e: any) {
    if (e.code === "ESRCH") {
      return false;
    } else {
      throw e;
    }
  }
};

export async function stopServer(proc: { pid?: number | undefined }) {
  const pid = proc.pid;
  if (pid) {
    const pids = await pidtree(pid);

    await softShutdown().catch(serverLogger.error); // If that fails, continue shutting down anyway

    // In each case, that triggers a clean shutdown. We want to make sure it definitely shuts
    // down though, so we poll the process state, and kill it if it's still running in 3 seconds.

    const deadline = Date.now() + 3000;
    for (const pidToKill of [pid, ...pids]) {
      while (isRunning(pidToKill)) {
        await delay(100);

        if (Date.now() >= deadline) {
          await hardKill({ pid: pidToKill }).catch(serverLogger.warn); // Not much we can do if this fails really
          break;
        }
      }
    }
  }
}

function softShutdown() {
  return new Promise<void>(async (resolve, reject) => {
    const res = await api.shutdown();

    if (res.status !== 200) {
      reject(new Error(`Shutdown request received unexpected ${res.status} response`));
      return;
    }
    resolve();
  });
}

const UVICORN_STATUS_MESSAGES = [
  "Started server process",
  "Waiting for application startup",
  "Application startup complete",
  "Uvicorn running on",
];
async function hardKill(proc: { pid?: number | undefined }) {
  if (!proc.pid) {
    return;
  }

  if (!isWindows) {
    process.kill(proc.pid, "SIGKILL");
  } else {
    const resp = await execa("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"]);
    resp.stderr && serverLogger.error(resp.stderr);
    resp.stdout && serverLogger.info(resp.stdout);
  }

  await terminate(proc.pid, { timeout: 3000 });
}

interface ManifestEntry {
  path: string;
  sha1: string;
  asset_name: string;
  zip_size: number;
  file_size?: number;
}

interface RemoteConfig {
  version: string;
  manifest: Record<string, ManifestEntry>;
  symlinks: { from: string; to: string }[];
}
class PythonService {
  server: ChildProcess.ChildProcess | null = null;
  serverKilled = false;
  serverShutdown: Promise<void> | null = null;
  private startServerPromise: Promise<void> | null = null;
  private beforeQuitRegistered = false;
  private readonly bundledServerPath = path.join(RESOURCES_PATH, "server");
  private readonly usingBundledServer =
    !isDev && fs.existsSync(path.join(this.bundledServerPath, getPackagedServerBinName()));
  PYTHON_SERVER_PATH = this.usingBundledServer ? this.bundledServerPath : path.join(localAppDir, "server");
  progress: null | AxiosProgressEvent = null;
  config: RemoteConfig | null = null;
  fileCount: number = 0;
  totalSize: number = 0;
  totalSizeDownloaded: number = 0;
  currentFileNum: number = 0;
  isDownloading: boolean = false;
  downloadStatus: string = "";
  error: null | object = null;

  async pythonServerIsValid() {
    if (isDev) {
      return true;
    }
    if (this.usingBundledServer) {
      const isValid = await this.bundledServerIsValid();
      if (isValid && !this.server) {
        logger.info("Using bundled Python server, starting");
        this.startServer();
      }
      return isValid;
    }
    if (this.isDownloading) {
      return false;
    }
    const exists = await fs.promises.stat(this.PYTHON_SERVER_PATH).catch(() => false);
    if (!exists) {
      return false;
    }
    const config = await this.fetchLatestConfig();
    const symlinksOk = await this.checkAndCreateSymLinks(config);
    if (!symlinksOk) {
      return false;
    }
    const invalidOrMissingFiles = await this.getInvalidOrMissingFiles(config, true);
    const isValid = invalidOrMissingFiles.length === 0;
    if (isValid) {
      if (!this.server) {
        logger.info("Server is not running but all files are valid, starting");
        this.startServer();
      }
    }
    return isValid;
  }
  async pythonServerIsValidFast() {
    if (isDev) {
      return true;
    }
    if (this.usingBundledServer) {
      return this.bundledServerIsValid();
    }
    if (this.isDownloading) {
      logger.info("Server is downloading, not counting install as valid");
      return false;
    }
    const binpath = await this.getBinPath();
    const exists = await jetpack.existsAsync(binpath);
    if (!exists) {
      logger.info(`Bin path does not exist: ${binpath}`);
      return false;
    }
    const config = await this.fetchLatestConfig();
    const manifest = config.manifest;
    const entries = Object.entries(manifest);
    const allValid = await Promise.all(
      entries.map(async ([name, entry]) => {
        const { path: filePath } = entry;
        if (name === "other.zip") {
          // for other.zip, check that version.txt is written and matches the version
          const versionPath = path.join(this.PYTHON_SERVER_PATH, "version.txt");
          const versionExists = await jetpack.existsAsync(versionPath);
          if (!versionExists) {
            serverLogger.info(`Version file not found: ${versionPath}`);
            return false;
          }
          const version = await fs.promises.readFile(versionPath, "utf-8").catch(() => null);
          if (!version || version.trim() !== config.version.trim()) {
            serverLogger.info(`Version mismatch: ${version} !== ${config.version}`);
            return false;
          }
          return true;
        }
        const fullPath = path.join(this.PYTHON_SERVER_PATH, filePath);
        const fileExists = Boolean(await jetpack.existsAsync(fullPath));
        if (!fileExists) {
          serverLogger.info(`File not found: ${fullPath}`);
        }
        return fileExists;
      }),
    );
    return allValid.every((v) => v);
  }

  private async bundledServerIsValid() {
    const binpath = await this.getBinPath();
    const exists = Boolean(await jetpack.existsAsync(binpath));
    if (!exists) {
      serverLogger.info(`Bundled server binary not found: ${binpath}`);
    }
    return exists;
  }

  async fetchLatestConfig() {
    if (this.config) {
      return this.config;
    }
    const githubSha = process.env.GITHUB_SHA;
    const usePinned = Boolean(githubSha) && db.configShouldUsePinnedVersion();
    const configPath = path.join(this.PYTHON_SERVER_PATH, usePinned ? `config-${githubSha}.json` : "config.json");
    if (usePinned && (await jetpack.existsAsync(configPath))) {
      const config = await jetpack.readAsync(configPath, "json");
      this.config = config;
      return config as RemoteConfig;
    }

    try {
      const platform = isWindows ? "windows" : isMacX64 ? "mac_x64" : isMacArm ? "mac" : "linux";
      const arch = isMacArm ? "arm64" : "x64";
      const devStr = app.getVersion().includes("0.0.0-dev") || isDev ? "-dev" : "";
      const latest = `latest${devStr}-${platform}-${arch}.json`;
      const gitShaFilename = `${githubSha}-${platform}-${arch}.json`;
      const versionFilename = `${app.getVersion()}-${platform}-${arch}.json`;
      const urlsToTry = usePinned ? [gitShaFilename, versionFilename, latest] : [latest];
      logger.info(`Fetching latest config from ${urlsToTry}, in that priority order`);
      for (const filename of urlsToTry) {
        try {
          const url = `https://replay-servers.replay-music.xyz/${filename}`;
          serverLogger.info(`Fetching latest config from ${url}`);
          const res = await axios.get<RemoteConfig>(url);
          this.config = res.data;
          // write config to disk so we can use it if the server is offline
          await jetpack.writeAsync(configPath, res.data, { atomic: true });

          return res.data;
        } catch (e) {
          serverLogger.info(`Fetching latest config from ${filename} failed - trying next`);
          serverLogger.error(e);
          if (filename === urlsToTry[urlsToTry.length - 1]) {
            throw e;
          }
        }
      }
      throw new Error("Unable to fetch latest config");
    } catch (e) {
      serverLogger.error(e);
      if (await jetpack.existsAsync(configPath)) {
        const config = await jetpack.readAsync(configPath, "json");
        this.config = config;
        return config as RemoteConfig;
      }
      throw e;
    }
  }

  private setDownloadStatus(status: string) {
    this.downloadStatus = status;
    serverLogger.info(status);
  }

  private async download(entry: ManifestEntry) {
    const filename = entry.asset_name;
    try {
      const downloadUrl = `https://replay-servers.replay-music.xyz/${filename}`;
      serverLogger.info(`Downloading ${filename}`);
      const response = await axios.get(downloadUrl, {
        responseType: "arraybuffer",
        onDownloadProgress: (progress) => {
          this.progress = progress;
        },
        httpsAgent,
        httpAgent,
      });
      const fullDownloadPath = path.join(localAppDir, filename);
      await fsp.writeFile(fullDownloadPath, response.data);
      this.progress = null;
      return fullDownloadPath;
    } catch (error: any) {
      serverLogger.error(`Error downloading ${filename}`);
      serverLogger.error(error);
      this.progress = null;
      this.error = error;
      throw error;
    }
  }

  private async getInvalidOrMissingFiles(config: RemoteConfig, fastBail?: true) {
    if (isDev) {
      return [];
    }
    const manifest = config.manifest;
    const entries = Object.entries(manifest);
    const invalidOrMissingFiles: ManifestEntry[] = [];
    for (let i = 0; i < entries.length; i++) {
      if (!fastBail) {
        this.setDownloadStatus(getServerText().checkingFile(i + 1, entries.length));
      }
      const [name, entry] = entries[i];
      const { sha1: fileSha1, path: filePath, file_size } = entry;
      if (name === "other.zip") {
        // for other.zip, check that version.txt is written and matches the version
        const versionPath = path.join(this.PYTHON_SERVER_PATH, "version.txt");
        const versionExists = await fs.promises.stat(versionPath).catch(() => false);
        if (!versionExists) {
          serverLogger.info(`Version file not found: ${versionPath}`);
          invalidOrMissingFiles.push(entry);
          if (fastBail) {
            return invalidOrMissingFiles;
          }
          continue;
        }
        const version = await fs.promises.readFile(versionPath, "utf-8").catch(() => null);
        if (version !== config.version) {
          serverLogger.info(`Version mismatch: ${version} !== ${config.version}`);
          invalidOrMissingFiles.push(entry);
          if (fastBail) {
            return invalidOrMissingFiles;
          }
          continue;
        }
        continue;
      }
      const fullPath = path.join(this.PYTHON_SERVER_PATH, filePath);
      const exists = await fs.promises.stat(fullPath).catch(() => false);
      if (!exists) {
        serverLogger.info(`File not found: ${fullPath}`);
        invalidOrMissingFiles.push(entry);
        if (fastBail) {
          return invalidOrMissingFiles;
        }
        continue;
      }
      const sizeOnDisk = (await fs.promises.stat(fullPath)).size;
      if (file_size && sizeOnDisk !== file_size) {
        serverLogger.info(`Size mismatch for ${fullPath}: ${sizeOnDisk} !== ${file_size}`);
        invalidOrMissingFiles.push(entry);
        if (fastBail) {
          return invalidOrMissingFiles;
        }
        continue;
      }
      const sha1 = await jetpack.inspectAsync(fullPath, { checksum: "sha1" }).catch(() => null);
      if (sha1?.sha1 !== fileSha1) {
        serverLogger.info(`SHA1 mismatch for ${fullPath}: ${sha1?.sha1} !== ${fileSha1}`);
        invalidOrMissingFiles.push(entry);
        if (fastBail) {
          return invalidOrMissingFiles;
        }
      }
    }
    return invalidOrMissingFiles;
  }

  private async checkAndCreateSymLinks(config: RemoteConfig) {
    for (const symlink of config.symlinks) {
      const { from, to } = symlink;
      const fromPath = path.join(this.PYTHON_SERVER_PATH, from);
      if (!(await jetpack.existsAsync(fromPath))) {
        serverLogger.info(`Symlink ${fromPath} does not exist`);
        return false;
      }
      const toPath = path.join(this.PYTHON_SERVER_PATH, to);
      if (!(await jetpack.existsAsync(toPath))) {
        await fsp.symlink(fromPath, toPath);
      }
    }
    return true;
  }
  private async fetchRemoteServer(config: RemoteConfig) {
    try {
      this.setDownloadStatus(getServerText().fetchingLatest(config.version));
      const entriesToDownload: ManifestEntry[] = await this.getInvalidOrMissingFiles(config);
      this.fileCount = entriesToDownload.length;
      this.totalSize = entriesToDownload.reduce((acc, { zip_size: size }) => acc + size, 0);
      this.totalSizeDownloaded = 0;
      this.currentFileNum = 0;
      for (const entry of entriesToDownload) {
        const { sha1: fileSha1, path: filePath, zip_size } = entry;
        this.currentFileNum++;
        this.setDownloadStatus(getServerText().downloadingFile(this.currentFileNum, this.fileCount));
        this.progress = null;
        const relFilePath = path.join(this.PYTHON_SERVER_PATH, filePath);
        const exists = await fs.promises.stat(relFilePath).catch(() => false);
        if (exists) {
          const sha1 = await jetpack.inspectAsync(relFilePath, { checksum: "sha1" }).catch(() => null);
          if (sha1?.sha1 === fileSha1) {
            serverLogger.info(`Skipping ${filePath} - already downloaded`);
            this.totalSizeDownloaded += Number(zip_size);
            continue;
          }
        }
        const downloadPath = await this.download(entry);
        this.setDownloadStatus(getServerText().extractingFile(this.currentFileNum, this.fileCount));
        this.totalSizeDownloaded += Number(zip_size);
        await jetpack.removeAsync(relFilePath);
        await decompress(downloadPath, this.PYTHON_SERVER_PATH);
        await jetpack.removeAsync(downloadPath);
      }
    } catch (error: any) {
      this.error = error;
      serverLogger.error(error);
      throw error;
    }
  }
  removeLocalServer = async () => {
    if (this.usingBundledServer) {
      serverLogger.info("Bundled server is in use, skipping server removal");
      return;
    }
    await jetpack.removeAsync(this.PYTHON_SERVER_PATH);
  };

  async downloadLatestServer() {
    if (this.isDownloading) {
      return;
    }
    try {
      this.isDownloading = true;
      this.downloadStatus = "";
      this.progress = null;
      this.error = null;
      this.fileCount = 0;
      this.totalSize = 0;
      this.totalSizeDownloaded = 0;
      if (this.usingBundledServer) {
        this.setDownloadStatus(getServerText().usingBundled);
        await this.startServer();
        return;
      }
      this.setDownloadStatus(getServerText().downloadingLatest);
      const config = await this.fetchLatestConfig();
      await this.fetchRemoteServer(config);
      this.setDownloadStatus(getServerText().downloadComplete);
      await this.checkAndCreateSymLinks(config);
      await fsp.writeFile(path.join(this.PYTHON_SERVER_PATH, "version.txt"), config.version);
      await this.startServer();
    } catch (error: any) {
      this.error = error;
      this.setDownloadStatus(`${getServerText().errorPrefix}: ${error}`);
      serverLogger.error(error);
    } finally {
      this.downloadStatus = "";
      this.progress = null;
      this.fileCount = 0;
      this.totalSize = 0;
      this.totalSizeDownloaded = 0;
      this.isDownloading = false;
    }
  }

  async getBinPath() {
    if (isDev) {
      const { lookpath } = await import("find-bin");
      const conda = await lookpath("/opt/homebrew/Caskroom/miniconda/base/envs/rvc310/bin/python");
      const py3 = await lookpath("python3");
      const py = await lookpath("python");
      const bin = conda || py3 || py;
      if (bin) {
        return bin;
      }
    }
    return path.join(this.PYTHON_SERVER_PATH, getPackagedServerBinName());
  }
  async checkServerPortAvailable(port: number): Promise<void> {
    const inUse = await tcpPortUsed.check(port);
    if (inUse) {
      throw new Error(`Port ${port} is already in use`);
    }
  }

  private async serverOnPortIsHealthy() {
    try {
      await axios.get(`http://127.0.0.1:${apiPort}/health`, {
        timeout: 1500,
        httpAgent,
        httpsAgent,
      });
      return true;
    } catch {
      return false;
    }
  }

  private isPortInUseError(message: string | undefined) {
    if (!message) {
      return false;
    }
    return message.includes("10048") || message.toLowerCase().includes("address already in use");
  }

  getPathEnvVariable() {
    const localBinPath = path.join(RESOURCES_PATH, "bin");
    serverLogger.info(`Adding ${localBinPath} and ${this.PYTHON_SERVER_PATH} to PATH`);
    const pathSplitter = isWindows ? ";" : ":";
    return `${localBinPath}${pathSplitter}${this.PYTHON_SERVER_PATH}${pathSplitter}${process.env.PATH}`;
  }

  getScriptPath() {
    if (isDev) {
      const isWindows = os.platform() === "win32";
      const binName = "server.py";
      let serverBinPath = path.join(RESOURCES_PATH, "./python", binName);

      let count = 0;
      while (!fs.existsSync(serverBinPath)) {
        serverBinPath = path.join(RESOURCES_PATH, "../".repeat(count), "python", binName);
        count++;

        if (count > 10) {
          throw new Error(getServerText().missingBackend);
        }
      }

      return isWindows ? `"${serverBinPath}"` : serverBinPath;
    }
    return "";
  }
  statusMessage: string = "";

  logs() {}
  stopProcessOnPort = async () => {
    const inUse = await tcpPortUsed.check(apiPort);
    if (inUse) {
      serverLogger.info("Port in use, finding process");
      try {
        const proc = await find("port", apiPort);
        if (proc.length) {
          serverLogger.info(`Found process ${proc[0].pid}, killing...`);
          await stopServer(proc[0]);
        } else {
          serverLogger.error("Unable to find process listening on port");
        }
        serverLogger.info("Waiting for port to become free");
        await tcpPortUsed.waitUntilFree(apiPort, 1000, 10 * 1000);
      } catch (e) {
        serverLogger.error("Error finding process", e);
      }
    }
    serverLogger.info("Port is free, starting server");
  };
  async restartServer() {
    serverLogger.info("Restarting server");
    await this.stopServer();
    await this.stopProcessOnPort();
    await this.startServer();
  }

  async stopServer() {
    serverLogger.info("Stopping server");
    if (this.server) {
      this.serverKilled = true;
      serverLogger.info("Found existing server, restarting...");
      await stopServer(this.server);
      this.server = null;
      serverLogger.info("Server stopped");
    } else {
      serverLogger.info("Server not running");
    }
  }
  async startServer(retries = 2) {
    if (this.startServerPromise) {
      this.statusMessage = getServerText().startingAlready;
      serverLogger.info("Server startup already in progress, waiting for it");
      return this.startServerPromise;
    }

    this.startServerPromise = this.startServerImpl(retries).finally(() => {
      this.startServerPromise = null;
    });
    return this.startServerPromise;
  }

  private async startServerImpl(retries = 2) {
    this.statusMessage = getServerText().starting;
    if (this.server) {
      serverLogger.info("Server already running, not starting");
      return;
    }

    if (await this.serverOnPortIsHealthy()) {
      this.statusMessage = getServerText().reusingExisting;
      serverLogger.info("A healthy backend service is already listening, reusing it");
      return;
    }

    if (!(await this.pythonServerIsValidFast())) {
      serverLogger.info("Python server not valid, not starting");
      return;
    }

    try {
      await this.checkServerPortAvailable(apiPort);
    } catch {
      this.statusMessage = getServerText().portUnavailable;
      serverLogger.warn("Port is not available");
      if (await this.serverOnPortIsHealthy()) {
        this.statusMessage = getServerText().reusingExisting;
        serverLogger.info("Port is occupied by a healthy backend service, reusing it");
        return;
      }
      if (isDev) {
        return;
      }
      await this.stopProcessOnPort();
    }

    const binPath = await this.getBinPath();

    if (!binPath) {
      this.statusMessage = getServerText().missingBackend;
      showErrorAlert(getServerText().errorPrefix, getServerText().missingBackendBody);
      return;
    }
    const parentPid = process.pid;

    const args = [
      this.getScriptPath(),
      "--parent-pid",
      String(parentPid),
      "--log-dir",
      isWindows ? `"${logDir}"` : logDir,
    ].filter(Boolean);
    serverLogger.info(`Spawning server with args: ${args.join(" ")}`);
    if (this.server) {
      serverLogger.info(`Server already exists, not starting...`);
      return;
    }
    this.serverKilled = false;
    this.server = execa(`"${binPath}"`, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      cleanup: true,
      windowsVerbatimArguments: false,
      detached: false,
      env: {
        ...process.env,
        ...(isMac ? { PYTORCH_ENABLE_MPS_FALLBACK: "1" } : {}),
        PATH: this.getPathEnvVariable(),
        REPLAY_PORT: String(apiPort),
      },
      windowsHide: true,
    });

    // Both not null because we pass 'pipe' for args 2 & 3 above.
    const serverStdout = this.server.stdout!;
    const serverStderr = this.server.stderr!;

    const infoStream = new LogStreamWrapper(serverLogger, {
      level: "info",
      splitLines: true,
      skipEmptyLines: true,
    });

    const errorStream = new LogStreamWrapper(serverLogger, {
      level: "error",
      splitLines: true,
      skipEmptyLines: true,
    });

    new ReadableStreamClone(serverStdout).pipe(infoStream);
    new ReadableStreamClone(serverStderr).pipe(errorStream);

    let lastError: string | undefined = undefined;
    new ReadableStreamClone(serverStderr).on("data", (data: Buffer) => {
      const errorOutput = data.toString("utf8");
      // so dumb but uvicorn writes to stderr for its startup messages...
      if (UVICORN_STATUS_MESSAGES.some((l) => errorOutput.includes(l))) {
        return;
      }
      lastError = errorOutput;
      this.statusMessage = getServerText().backendStderr(errorOutput);
    });

    const serverStartTime = Date.now();

    const spawnedServer = this.server;
    this.serverShutdown = new Promise<Error | number | null>((resolve) => {
      spawnedServer.once("error", resolve);
      spawnedServer.once("exit", resolve);
    }).then(async (errorOrCode) => {
      if (this.server === spawnedServer) {
        this.server = null;
      }
      if (this.serverKilled) {
        this.statusMessage = getServerText().stopped;
        return;
      }

      // The server should never shutdown unless the whole process is finished, so this is bad.
      const serverRunTime = Date.now() - serverStartTime;

      let error: Error;

      if (errorOrCode && typeof errorOrCode !== "number") {
        error = errorOrCode;
      } else if (lastError) {
        error = new Error(`'${lastError}' (${errorOrCode})`);
      } else {
        error = new Error(getServerText().exited(errorOrCode));
      }
      this.statusMessage = getServerText().backendError(error.message);

      serverLogger.error(error);
      serverLogger.error(["server-exit", error.message, (error as any).code?.toString() || ""]);

      if (this.isPortInUseError(lastError || error.message) && (await this.serverOnPortIsHealthy())) {
        this.statusMessage = getServerText().reusingExisting;
        serverLogger.warn("Spawned backend exited because the port is already used by a healthy service");
        return;
      }

      showErrorAlert(getServerText().appErrorTitle(), getServerText().appErrorBody(error.message));

      // Retry limited times, but not for near-immediate failures.
      if (retries > 0 && serverRunTime > 5000) {
        // This will break the app, so refresh it
        windows.forEach((window) => window.reload());
        return this.startServerImpl(retries - 1);
      }
      this.statusMessage = getServerText().retryStopped;

      serverLogger.error("Backend service retries exhausted");
    });

    if (!this.beforeQuitRegistered) {
      this.beforeQuitRegistered = true;
      app.on("before-quit", (event) => {
        serverLogger.info("App is quitting, killing server");
        if (this.server && !this.serverKilled) {
          // Don't shutdown until we've tried to kill the server
          event.preventDefault();
          this.serverKilled = true;
          (async () => {
            try {
              if (this.server) {
                this.statusMessage = getServerText().stopping;
                serverLogger.info("Killing server");
                await stopServer(this.server);
                serverLogger.info("Server killed");
              }
            } catch (error) {
              serverLogger.error("Failed to kill server", error);
              serverLogger.error(error);
            } finally {
              // We've done our best - now shut down for real.
              serverLogger.info("Quitting app");
              app.quit();
              this.statusMessage = getServerText().quitting;
              serverLogger.close();
            }
          })();
          return false;
        }
      });
    }
  }
}

export const pythonService = new PythonService();
export default pythonService;
