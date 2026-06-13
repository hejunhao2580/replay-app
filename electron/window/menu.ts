import type { MenuItemConstructorOptions } from "electron";
import { app, dialog, ipcMain, Menu, shell, systemPreferences } from "electron";
import { windows } from "../index";
import { showApp, showSettings } from "../utils/util";
import logger, { logPath } from "../../shared/logger";
import { requiredFilesController } from "../clients/required-files-downloader.ts";
import { WeightDownloader } from "../clients/modelWeights.ts";
import jetpack from "fs-jetpack";
import { localAudioDir, localModelPath, localOutputsPath } from "../utils/constants";
import pythonService from "../clients/pythonService.ts";
import { DESKTOP_VERSION, localAppDir } from "../utils/import-before-all-import.ts";
import {
  getCurrentLanguage,
  getProductName,
  getWindowTitleFromUrl,
  languageChangedEvent,
  type AppLanguage,
  writeCurrentLanguage,
} from "../i18n/language.ts";

const labels = {
  en: {
    about: "About Replay",
    app: "Application",
    bringAllToFront: "Bring All to Front",
    cancel: "Cancel",
    clearCache: "Clear Interface Cache",
    closeWindow: "Close Window",
    confirm: "Confirm",
    confirmMessage: "Are you sure you want to continue? This action cannot be undone.",
    confirmTitle: "Please Confirm",
    copy: "Copy",
    cut: "Cut",
    delete: "Delete",
    deleteAllAppData: "Delete All App Data",
    deleteAllGeneratedSongs: "Delete All Generated Songs",
    deleteAllVoiceModels: "Delete All Voice Models",
    deleteBaseModel: "Delete Base Model",
    deleteLocalBackend: "Delete Local Backend Service",
    developerTools: "Developer Tools",
    edit: "Edit",
    english: "English",
    feedback: "Send Feedback",
    forceReload: "Force Reload",
    help: "Help",
    hide: "Hide Replay",
    hideOthers: "Hide Other Windows",
    language: "Language",
    localData: "Local Data",
    minimize: "Minimize",
    openMain: "Open Main Window",
    openOutputFolder: "Open Output Folder",
    openRvcFolder: "Open RVC Models Folder",
    openSettings: "Open Settings",
    paste: "Paste",
    pasteAndMatchStyle: "Paste and Match Style",
    quit: "Quit",
    redo: "Redo",
    reload: "Reload",
    reportIssue: "Report an Issue",
    requestMicrophone: "Request Microphone Access",
    resetZoom: "Reset Zoom",
    restartBackend: "Restart Backend Service",
    selectAll: "Select All",
    services: "Services",
    showAll: "Show All",
    stopBackend: "Stop Backend Service",
    toggleFullscreen: "Toggle Full Screen",
    undo: "Undo",
    versionDevelopment: "Development",
    view: "View",
    viewLogs: "View Logs",
    window: "Window",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    zoomWindow: "Zoom Window",
    zh: "Chinese",
  },
  zh: {
    about: "关于本软件",
    app: "应用",
    bringAllToFront: "全部置于前面",
    cancel: "取消",
    clearCache: "清理界面缓存",
    closeWindow: "关闭窗口",
    confirm: "确认",
    confirmMessage: "确定要继续吗？这个操作无法撤销。",
    confirmTitle: "请确认",
    copy: "复制",
    cut: "剪切",
    delete: "删除",
    deleteAllAppData: "删除全部应用数据",
    deleteAllGeneratedSongs: "删除所有生成作品",
    deleteAllVoiceModels: "删除所有音色模型",
    deleteBaseModel: "删除基础模型",
    deleteLocalBackend: "删除本地后台服务",
    developerTools: "开发者工具",
    edit: "编辑",
    english: "英语",
    feedback: "反馈建议",
    forceReload: "强制重新加载",
    help: "帮助",
    hide: "隐藏本软件",
    hideOthers: "隐藏其他窗口",
    language: "语言",
    localData: "本地数据",
    minimize: "最小化",
    openMain: "打开主界面",
    openOutputFolder: "打开作品输出文件夹",
    openRvcFolder: "打开音色模型文件夹",
    openSettings: "打开设置",
    paste: "粘贴",
    pasteAndMatchStyle: "粘贴并匹配样式",
    quit: "退出",
    redo: "重做",
    reload: "重新加载",
    reportIssue: "反馈问题",
    requestMicrophone: "申请麦克风权限",
    resetZoom: "重置缩放",
    restartBackend: "重启后台服务",
    selectAll: "全选",
    services: "服务",
    showAll: "显示全部",
    stopBackend: "停止后台服务",
    toggleFullscreen: "切换全屏",
    undo: "撤销",
    versionDevelopment: "开发版",
    view: "显示",
    viewLogs: "查看日志",
    window: "窗口",
    zoomIn: "放大",
    zoomOut: "缩小",
    zoomWindow: "缩放窗口",
    zh: "中文",
  },
} satisfies Record<AppLanguage, Record<string, string>>;

export const setCurrentLanguage = (language: AppLanguage) => {
  const nextLanguage = writeCurrentLanguage(language);

  if (app.isReady()) {
    Menu.setApplicationMenu(getMenu());
    windows.forEach((win) => {
      win.setTitle(getWindowTitleFromUrl(win.webContents.getURL(), nextLanguage));
      win.webContents.send(languageChangedEvent, nextLanguage);
    });
  }

  return nextLanguage;
};

let languageIpcRegistered = false;
export const registerLanguageIpc = () => {
  if (languageIpcRegistered) {
    return;
  }
  languageIpcRegistered = true;
  ipcMain.handle("language:get", () => getCurrentLanguage());
  ipcMain.handle("language:set", (_event, language: AppLanguage) => setCurrentLanguage(language));
};

export const getMenu = () => {
  const language = getCurrentLanguage();
  const text = labels[language];
  const productName = getProductName(language);
  const desktopVersionLabel =
    DESKTOP_VERSION === "0.0.0-development" ? text.versionDevelopment : `v${DESKTOP_VERSION}`;
  const desktopVersionMenuLabel =
    language === "zh" ? `版本：${desktopVersionLabel}` : `${productName} ${desktopVersionLabel}`;

  windows.forEach((win) => {
    win.setTitle(getWindowTitleFromUrl(win.webContents.getURL(), language));
  });
  app.setName(productName);

  const switchLanguage = (nextLanguage: AppLanguage) => {
    setCurrentLanguage(nextLanguage);
  };

  const viewLogs = {
    label: text.viewLogs,
    type: "normal",
    click: () => {
      shell.showItemInFolder(logPath);
    },
  } as MenuItemConstructorOptions;

  const submitIssue = {
    label: text.reportIssue,
    type: "normal",
    click: () => {
      shell.openExternal("https://github.com/tryreplay/replay-issues");
    },
  } as MenuItemConstructorOptions;

  const confirm = (cb: () => void | Promise<void>) => {
    return async () => {
      const resp = await dialog.showMessageBox({
        type: "warning",
        buttons: [text.cancel, text.confirm],
        title: text.confirmTitle,
        message: text.confirmMessage,
        defaultId: 0,
        cancelId: 0,
      });
      if (resp.response === 1) {
        cb();
      }
    };
  };

  const languageMenu: MenuItemConstructorOptions = {
    label: text.language,
    submenu: [
      {
        label: text.english,
        type: "radio",
        checked: language === "en",
        click: () => switchLanguage("en"),
      },
      {
        label: text.zh,
        type: "radio",
        checked: language === "zh",
        click: () => switchLanguage("zh"),
      },
    ],
  };

  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: text.app,
      submenu: [
        {
          label: text.openMain,
          type: "normal",
          click: showApp,
        },
        {
          label: text.openSettings,
          type: "normal",
          click: showSettings,
        },
        { type: "separator" },
        {
          label: text.restartBackend,
          type: "normal",
          click: async () => {
            await pythonService.restartServer();
          },
        },
        {
          label: text.stopBackend,
          type: "normal",
          click: async () => {
            await pythonService.stopServer();
          },
        },
        { type: "separator" },
        {
          label: text.requestMicrophone,
          type: "normal",
          click: async () => {
            if (systemPreferences.askForMediaAccess) {
              await systemPreferences.askForMediaAccess("microphone");
            }
          },
        },
        {
          label: text.clearCache,
          type: "normal",
          click: async () => {
            windows.forEach((w) => w.webContents.send("clear-cache"));
          },
        },
        { type: "separator" },
        {
          label: text.feedback,
          type: "normal",
          click: () => {
            shell.openExternal("https://discord.gg/A5rgNwDRd4");
          },
        },
        submitIssue,
        { type: "separator" },
        viewLogs,
        { type: "separator" },
        {
          label: text.quit,
          type: "normal",
          click: async () => {
            app.quit();
          },
        },
        { label: text.reload, role: "reload" },
        { label: text.forceReload, role: "forceReload" },
        { label: text.developerTools, role: "toggleDevTools" },
        { type: "separator" },
        {
          label: desktopVersionMenuLabel,
          type: "normal",
        },
      ],
    },
    languageMenu,
    {
      label: text.edit,
      submenu: [
        { label: text.undo, role: "undo" },
        { label: text.redo, role: "redo" },
        { type: "separator" },
        { label: text.cut, role: "cut", registerAccelerator: false },
        { label: text.copy, role: "copy", registerAccelerator: false },
        { label: text.paste, role: "paste", registerAccelerator: false },
        { label: text.pasteAndMatchStyle, role: "pasteAndMatchStyle", registerAccelerator: false },
        { label: text.delete, role: "delete" },
        { label: text.selectAll, role: "selectAll" },
      ],
    },
    {
      label: text.localData,
      submenu: [
        {
          label: text.openRvcFolder,
          type: "normal",
          click: () => {
            shell.showItemInFolder(localModelPath);
          },
        },
        {
          label: text.openOutputFolder,
          type: "normal",
          click: () => {
            shell.showItemInFolder(localOutputsPath);
          },
        },
        { type: "separator" },
        {
          label: text.deleteBaseModel,
          type: "normal",
          click: confirm(async () => {
            await requiredFilesController.removeModelWeights();
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: text.deleteLocalBackend,
          type: "normal",
          click: confirm(async () => {
            await pythonService.removeLocalServer();
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: text.deleteAllVoiceModels,
          type: "normal",
          click: confirm(async () => {
            await WeightDownloader.removeModels();
          }),
        },
        {
          label: text.deleteAllGeneratedSongs,
          type: "normal",
          click: confirm(async () => {
            await jetpack.removeAsync(localAudioDir);
            await jetpack.removeAsync(localOutputsPath);
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: text.deleteAllAppData,
          type: "normal",
          click: confirm(async () => {
            await WeightDownloader.removeModels();
            await requiredFilesController.removeModelWeights();
            await jetpack.removeAsync(localAppDir);
            app.relaunch();
            app.quit();
          }),
        },
      ],
    },
    {
      label: text.view,
      submenu: [
        { label: text.resetZoom, role: "resetZoom" },
        { label: text.zoomIn, role: "zoomIn" },
        { label: text.zoomOut, role: "zoomOut" },
        { type: "separator" },
        { label: text.toggleFullscreen, role: "togglefullscreen" },
        { type: "separator" },
        { label: text.reload, role: "reload" },
        { label: text.forceReload, role: "forceReload" },
        { label: text.developerTools, role: "toggleDevTools" },
      ],
    },
    {
      label: text.window,
      role: "window",
      submenu: [
        { label: text.minimize, role: "minimize" },
        { label: text.closeWindow, role: "close" },
      ],
    },
    {
      label: text.help,
      role: "help",
      submenu: [viewLogs, submitIssue],
    },
  ];

  const replayMenu: MenuItemConstructorOptions = {
    label: productName,
    submenu: [
      { label: text.about, role: "about" },
      { type: "separator" },
      { label: text.services, role: "services" },
      { type: "separator" },
      { label: text.hide, role: "hide" },
      { label: text.hideOthers, role: "hideOthers" },
      { label: text.showAll, role: "unhide" },
      { type: "separator" },
      {
        label: text.quit,
        accelerator: "CmdOrCtrl+Q",
        click: () => {
          logger.info("Cmd + Q is pressed");
          windows.forEach((win) => win.close());
          app.quit();
        },
      },
    ],
  };
  menuTemplate.unshift(replayMenu);

  const windowMenu = menuTemplate.find((l) => l.role === "window");
  if (windowMenu) {
    windowMenu.submenu = [
      { label: text.closeWindow, role: "close" },
      { label: text.minimize, role: "minimize" },
      { label: text.zoomWindow, role: "zoom" },
      { type: "separator" },
      { label: text.bringAllToFront, role: "front" },
    ];
  }

  return Menu.buildFromTemplate(menuTemplate);
};
