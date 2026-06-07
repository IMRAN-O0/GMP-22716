'use strict';

const { app, BrowserWindow, Menu, shell, dialog, ipcMain, globalShortcut } = require('electron');
const childProcess = require('child_process');
const path   = require('path');
const http   = require('http');
const fs     = require('fs');
const crypto = require('crypto');

// Fix "paint stall" on some Windows GPUs/drivers where the renderer stops
// repainting until forced (typing not showing until a screenshot/resize/focus
// change). Falling back to software compositing makes painting reliable.
app.disableHardwareAcceleration();
app.setName('Awal Helm GMP');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT    = parseInt(process.env.PORT || '3009', 10);
const IS_DEV  = !app.isPackaged;
const APP_DIR = IS_DEV
  ? path.join(__dirname, '..')
  : path.dirname(app.getPath('exe'));

// ─── App config (server vs client mode) — persisted in userData ──────────────
// { mode: 'server' }                              → this machine hosts the DB
// { mode: 'client', serverUrl: '192.168.1.10' }   → connect to a remote server
function configPath() {
  return path.join(app.getPath('userData'), 'gmp-config.json');
}

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf8'));
  } catch (_) {
    return null;
  }
}

function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2), 'utf8');
}

// Accepts "192.168.1.10", "192.168.1.10:3009" or a full URL, and returns a full
// origin "http://host:port" (defaulting to port 3009 when none is supplied).
function normalizeServerUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;
  try {
    const u = new URL(s);
    if (!u.port) u.port = String(PORT);
    return `${u.protocol}//${u.hostname}:${u.port}`;
  } catch (_) {
    return null;
  }
}

// Probes a server origin. Any HTTP response (even 401) means the server is up.
function testConnection(rawUrl) {
  return new Promise((resolve) => {
    const origin = normalizeServerUrl(rawUrl);
    if (!origin) return resolve({ ok: false, error: 'عنوان غير صالح' });
    const req = http.get(`${origin}/api/company`, (res) => {
      res.destroy();
      resolve({ ok: true, address: origin, status: res.statusCode });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.code || e.message }));
    req.setTimeout(4000, () => { req.destroy(); resolve({ ok: false, error: 'انتهت المهلة' }); });
  });
}

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

// ─── Setup window (first run / reconfigure) ──────────────────────────────────
let setupWindow = null;

function createSetupWindow() {
  if (setupWindow) { setupWindow.focus(); return; }
  setupWindow = new BrowserWindow({
    width:  640,
    height: 720,
    title:  'إعداد نظام GMP',
    icon:   path.join(APP_DIR, 'electron', 'icon.png'),
    resizable: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false, // keep painting even when focus briefly leaves
    },
  });
  Menu.setApplicationMenu(null);
  setupWindow.loadFile(path.join(__dirname, 'setup.html'));
  setupWindow.on('closed', () => { setupWindow = null; });
}

// ─── BrowserWindow ────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow(targetUrl) {
  mainWindow = new BrowserWindow({
    width:        1440,
    height:       900,
    minWidth:     1024,
    minHeight:    700,
    title:        'Awal Helm GMP',
    icon:         path.join(APP_DIR, 'electron', 'icon.png'),
    show:         false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload:          path.join(__dirname, 'preload.cjs'),
      backgroundThrottling: false, // keep painting even when focus briefly leaves
    },
  });

  if (!IS_DEV) Menu.setApplicationMenu(null);

  mainWindow.loadURL(targetUrl);

  // Keep the window title fixed regardless of the page's <title>.
  mainWindow.on('page-title-updated', (e) => e.preventDefault());

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // In client mode, a wrong address / offline server fails to load. Offer to reconfigure.
  mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDesc, validatedUrl) => {
    if (errorCode === -3) return; // ABORTED (e.g. redirect) — ignore
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'error',
      title: 'تعذّر الاتصال بالسيرفر',
      message: 'لم يتمكّن البرنامج من الاتصال بالسيرفر.',
      detail: `العنوان: ${validatedUrl}\n${errorDesc}\n\nتأكد من أن الجهاز الرئيسي يعمل، أو غيّر عنوان السيرفر.`,
      buttons: ['تغيير الإعدادات', 'إعادة المحاولة', 'خروج'],
      defaultId: 0,
      cancelId: 2,
    });
    if (choice === 0) { mainWindow.close(); createSetupWindow(); }
    else if (choice === 1) { mainWindow.reload(); }
    else { app.quit(); }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(targetUrl)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Decide what to launch based on saved config ─────────────────────────────
async function launchFromConfig() {
  const cfg = readConfig();

  // No config yet → show the first-run setup screen.
  if (!cfg || !cfg.mode) {
    createSetupWindow();
    return;
  }

  // Client mode → just load the remote server; do NOT start a local server/DB.
  if (cfg.mode === 'client') {
    const origin = normalizeServerUrl(cfg.serverUrl);
    if (!origin) { createSetupWindow(); return; }
    createWindow(origin);
    return;
  }

  // Server mode (default) → host the app locally.
  freePort(PORT);
  if (!startServer()) return;
  try {
    await waitForServer();
    createWindow(`http://localhost:${PORT}`);
  } catch (err) {
    dialog.showErrorBox(
      'تعذّر تشغيل البرنامج',
      'لم يستجب السيرفر خلال المهلة المحددة.\nتأكد من أن المنفذ 3009 غير مستخدم ثم أعد المحاولة.'
    );
    app.quit();
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  launchFromConfig();

  // Reopen the connection-settings screen any time with Ctrl+Alt+S.
  globalShortcut.register('CommandOrControl+Alt+S', () => createSetupWindow());
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) launchFromConfig();
});

ipcMain.handle('app-version', () => app.getVersion());

ipcMain.handle('print-preview', async () => {
  if (!mainWindow) return { ok: false };
  // Electron's webContents.print() has no real preview (the system dialog shows
  // "this application doesn't support print preview"). Instead we render the
  // page to a PDF using print CSS and open it in the OS viewer, which gives a
  // genuine preview the user can review and print from.
  try {
    const data = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' },
    });
    const dir = path.join(app.getPath('temp'), 'awal-helm-gmp');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `print-${Date.now()}.pdf`);
    fs.writeFileSync(file, data);
    await shell.openPath(file);
    return { ok: true, file };
  } catch (err) {
    // Fall back to the native print dialog if PDF generation fails.
    try {
      mainWindow.webContents.print({ silent: false, printBackground: true });
    } catch (_) { /* ignore */ }
    return { ok: false, error: String(err) };
  }
});

// ─── Setup IPC ───────────────────────────────────────────────────────────────
ipcMain.handle('get-config', () => readConfig());

ipcMain.handle('test-connection', (_e, url) => testConnection(url));

ipcMain.handle('save-config', (_e, cfg) => {
  writeConfig(cfg);
  // Relaunch so the startup logic re-runs cleanly in the chosen mode.
  app.relaunch();
  app.exit(0);
});
