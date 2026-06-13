import { isLinux, isMacArm, isMacX64, isWindows } from "./utils/constants";
import logger from "../shared/logger";
import { app, dialog, shell } from "electron";
import { getCurrentLanguage } from "./i18n/language.ts";
import packageJson from "../package.json";

const updateText = {
  en: {
    checkErrorTitle: "Error checking for update",
    title: "New Update Available",
    message: "New Update Available - would you like to download it now?",
    notNow: "Not now",
    yes: "Yes",
  },
  zh: {
    checkErrorTitle: "检查更新失败",
    title: "发现新版本",
    message: "发现新版本，要现在去下载吗？",
    notNow: "暂不下载",
    yes: "下载",
  },
};

const getSubdomain = () => {
  if (isWindows) {
    return "updates-windows";
  }

  if (isMacX64) {
    return "updates-mac-x64";
  }
  if (isMacArm) {
    return "updates-mac-arm64";
  }
  if (isLinux) {
    return "updates-linux";
  }
};

// autoUpdater.on("update-downloaded", () => {
//   // Should never get here for Windows users, but just in case
//   if (isMac) {
//     autoUpdater.quitAndInstall();
//   }
// });

export default async function checkForUpdates() {
  try {
    if ((packageJson as typeof packageJson & { displayVersion?: string }).displayVersion) {
      return;
    }
    if (isLinux) {
      return; // no autoupdate
    }
    if (app.getVersion().includes("development")) {
      return; // dont check for updates on dev builds
    }
    const { autoUpdater } = await import("electron-updater");
    autoUpdater.logger = logger;
    // windows is not signed so it wont work
    // autoUpdater.autoDownload = !isWindows;
    autoUpdater.autoDownload = false;
    autoUpdater.setFeedURL({
      provider: "generic",
      url: `https://${getSubdomain()}.replay-music.xyz`,
    });
    autoUpdater.checkForUpdates();
    autoUpdater.on("error", (error) => {
      const content = error == null ? "unknown" : (error.stack || error).toString();
      if (content.includes("ERR_INTERNET_DISCONNECTED") || content.includes("ERR_CONN_RESET")) {
        logger.info("Internet disconnected, not checking for updates");
        return;
      }
      dialog.showErrorBox(updateText[getCurrentLanguage()].checkErrorTitle, content);
    });

    autoUpdater.on("update-available", async () => {
      try {
        // if (isMac) {
        //   // Just Install
        //   autoUpdater.downloadUpdate();
        //   return;
        // }
        const resp = await dialog.showMessageBox({
          type: "info",
          title: updateText[getCurrentLanguage()].title,
          message: updateText[getCurrentLanguage()].message,
          buttons: [updateText[getCurrentLanguage()].notNow, updateText[getCurrentLanguage()].yes],
          cancelId: 1,
        });
        if (resp.response === 1) {
          // Redirect to the download page
          const platform = isWindows ? "windows" : isMacX64 ? "mac_x64" : isMacArm ? "mac" : "linux";
          shell.openExternal(`https://tryreplay.io/download?platform=${platform}`);
        }
      } catch (e) {
        logger.error(e);
      }
    });
  } catch (e) {
    logger.error(e);
  }
}
