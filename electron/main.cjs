'use strict';

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const childProcess = require('child_process');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const crypto = require('crypto');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT    = parseInt(process.env.PORT || '3000', 10);
const IS_DEV  = !app.isPackaged;
const APP_DIR = IS_DEV
  ? path.join(__dirname, '..')
  : path.dirname(app.getPath('exe'));

// ─── JWT Secret — generate once and persist in userData ──────────────────────
function getOrCreateSecret() {
  const secretFile = path.join(app.getPath('userData'), '.jwt_secret');
  if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, 'utf8').trim();
  const secret = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(secretFile), { recursive: true });
  fs.writeFileSync(secretFile, secret, { encoding: 'utf8', mode: 0o600 });
  return secret;
}

// ─── DB path — always in userData (persists across updates) ──────────────────
function getDbPath() {
  const userData = app.getPath('userData');
  fs.mkdirSync(userData, { recursive: true });
  return path.join(userData, 'QForm_Data.db');
}

// ─── Free port if already in use ─────────────────────────────────────────────
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = childProcess.execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] });
      const lines = output.split('\n').filter(l => l.includes(`0.0.0.0:${port}`) || l.includes(`127.0.0.1:${port}`));
      const pids = [...new Set(lines.map(l => l.trim().split(/\s+/).pop()).filter(p => /^\d+$/.test(p) && p !== '0'))];
      pids.forEach(pid => {
        try { childProcess.execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (_) {}
      });
    } else {
      const output = childProcess.execSync(`lsof -ti:${port}`, { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] });
      output.trim().split('\n').filter(Boolean).forEach(pid => {
        try { childProcess.execSync(`kill -9 ${pid}`, { stdio: 'ignore' }); } catch (_) {}
      });
    }
  } catch (_) {
    // port is free — nothing to kill
  }
}

// ─── Server process ───────────────────────────────────────────────────────────
let serverProcess = null;

function startServer() {
  const bundlePath = IS_DEV
    ? path.join(APP_DIR, 'server-bundle.cjs')
    : path.join(process.resourcesPath, 'server-bundle.cjs');

  if (!fs.existsSync(bundlePath)) {
    dialog.showErrorBox(
      'خطأ في التشغيل',
      `ملف السيرفر غير موجود:\n${bundlePath}\n\nقم بتشغيل: npm run electron:build أولاً`
    );
    app.quit();
    return;
  }

  const jwtSecret = getOrCreateSecret();
  const dbPath    = getDbPath();

  serverProcess = childProcess.spawn(process.execPath, [bundlePath], {
    env: {
      ...process.env,
      NODE_ENV:         'production',
      PORT:             String(PORT),
      JWT_SECRET:       jwtSecret,
      DB_PATH:          dbPath,
      ALLOWED_ORIGINS:  `http://localhost:${PORT}`,
      ELECTRON_APP:     '1',
    },
    stdio: IS_DEV ? 'inherit' : 'ignore',
  });

  serverProcess.on('error', (err) => {
    dialog.showErrorBox('خطأ في السيرفر', err.message);
    app.quit();
  });
}

// ─── Wait for server to be ready ─────────────────────────────────────────────
function waitForServer(retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get(`http://localhost:${PORT}/api/company`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (n <= 0) return reject(new Error('Server did not start in time'));
        setTimeout(() => attempt(n - 1), 500);
      });
      req.setTimeout(500, () => { req.destroy(); });
    };
    attempt(retries);
  });
}

// ─── BrowserWindow ────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:        1440,
    height:       900,
    minWidth:     1024,
    minHeight:    700,
    title:        'نظام GMP — إدارة الجودة',
    icon:         path.join(APP_DIR, 'electron', 'icon.png'),
    show:         false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.cjs'),
    },
  });

  // Remove default menu in production
  if (!IS_DEV) Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Open external links in browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  freePort(PORT);
  startServer();

  try {
    await waitForServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'تعذّر تشغيل البرنامج',
      'لم يستجب السيرفر خلال المهلة المحددة.\nتأكد من أن المنفذ 3000 غير مستخدم ثم أعد المحاولة.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC: allow renderer to get app version
ipcMain.handle('app-version', () => app.getVersion());
