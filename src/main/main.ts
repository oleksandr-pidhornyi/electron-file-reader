/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// this one will do the heavy lifting
let workerWindow: BrowserWindow | null = null;

// ******* Setting up IPC listeners and interaction chain */

ipcMain.on('get-directory', async (event, arg) => {
  // eslint-disable-next-line promise/catch-or-return
  dialog.showOpenDialog({ properties: ['openDirectory'] }).then((data) => {
    if (!data.canceled) {
      event.reply('get-directory', data);
    }
  });
});

ipcMain.on('deep-scan-directory', async (event, arg) => {
  workerWindow?.webContents.send('worker-deep-scan-directory', arg[0]);
});

ipcMain.on('shallow-scan-directory', async (event, arg) => {
  workerWindow?.webContents.send('worker-shallow-scan-directory', arg[0]);
});

function showErrorMessage(message: string, errorPath: string) {
  dialog.showErrorBox(
    "Sorry, there's been an error :( ",
    `Can't open file ${errorPath}: ${message}`
  );
}

ipcMain.on('worker-deep-scan-directory', (event, arg) => {
  const { payload } = arg;
  if (payload.err) {
    showErrorMessage(payload.err.toString(), payload.path);
  }
  mainWindow?.webContents.send('deep-scan-directory', payload);
});

ipcMain.on('worker-shallow-scan-directory', (event, arg) => {
  const { payload } = arg;
  if (payload.err) {
    showErrorMessage(payload.err.toString(), payload.path);
  }
  mainWindow?.webContents.send('shallow-scan-directory', payload);
});

// ******* Done setting up, below mostly boilerplate */

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html', 'renderer'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // ********** one addition to boilerplate - a web worker to scan the file system
  workerWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegrationInWorker: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  workerWindow.loadURL(resolveHtmlPath('indexWorker.html', 'worker', false));

  workerWindow.on('closed', () => {
    workerWindow = null;
  });
  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
