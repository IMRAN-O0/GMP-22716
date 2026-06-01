'use strict';

const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const childProcess = require('child_process');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const crypto = require('crypto');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT    = parseInt(process.env.PORT || '3009', 10);
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
      const out = childProcess.execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe','pipe','ignore'] });
      const pids = [...new Set(
        out.split('\n')
          .filter(l => l.includes(`0.0.0.0:${port}`) || l.includes(`127.0.0.1:${port}`))
          .map(l => l.trim().split(/\s+/).pop())
          .filter(p => /^\d+$/.test(p) && p !== '0')
      )];
      pids.forEach(pid => { try { childProcess.execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch (_) {} });
    } else {
      childProcess.execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (_) {}
}

// ─── Start server in-process (avoids native-module issues in child process) ──
function startServer() {
  // app.getAppPath() returns the correct asar path in both dev and packaged mode
  const bundlePath = path.join(app.getAppPath(), 'server-bundle.cjs');

  if (!fs.existsSync(bundlePath)) {
    dialog.showErrorBox(
      'خطأ في التشغيل',
      `ملف السيرفر غير موجود:\n${bundlePath}\n\nقم بتشغيل: npm run electron:build أولاً`
    );
    app.quit();
    return false;
  }

  // Set env vars before requiring the bundle (it reads them at module load time)
  process.env.NODE_ENV        = 'production';
  process.env.PORT            = String(PORT);
  process.env.JWT_SECRET      = getOrCreateSecret();
  process.env.DB_PATH         = getDbPath();
  process.env.ALLOWED_ORIGINS = `http://localhost:${PORT}`;
  process.env.ELECTRON_APP    = '1';
  // dist is in extraResources → resources/dist (real filesystem, not inside asar)
  // express.static cannot read from inside the asar, so we pass the real path explicitly
  process.env.DIST_PATH       = IS_DEV
    ? path.join(app.getAppPath(), 'dist')
    : path.join(process.resourcesPath, 'dist');

  // Ensure native modules (sqlite3) are found in app.asar.unpacked
  const asarPath = app.getAppPath();
  if (!IS_DEV && asarPath.includes('app.asar')) {
    const unpackedMods = path.join(asarPath.replace('app.asar', 'app.asar.unpacked'), 'node_modules');
    if (fs.existsSync(unpackedMods)) {
      require('module').Module.globalPaths.unshift(unpackedMods);
    }
  }

  try {
    require(bundlePath);
  } catch (err) {
    dialog.showErrorBox('خطأ في تحميل السيرفر', err.message + '\n\n' + (err.stack || ''));
    app.quit();
    return false;
  }
  return true;
}

// ─── Wait for server to be ready ─────────────────────────────────────────────
function waitForServer(retries = 60) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      const req = http.get(`http://localhost:${PORT}/api/company`, () => resolve());
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

  if (!IS_DEV) Menu.setApplicationMenu(null);

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  freePort(PORT);
  if (!startServer()) return;

  try {
    await waitForServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox(
      'تعذّر تشغيل البرنامج',
      'لم يستجب السيرفر خلال المهلة المحددة.\nتأكد من أن المنفذ 3009 غير مستخدم ثم أعد المحاولة.'
    );
    app.quit();
  }
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('app-version', () => app.getVersion());
