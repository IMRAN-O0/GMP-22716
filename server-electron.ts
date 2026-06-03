/**
 * Electron server entry point.
 * Identical to server.ts but without Vite/dev-server dependency.
 * Used only when building server-bundle.cjs for Electron packaging.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { initDb } from './server/db.js';
import apiRouter from './server/api.js';
import { setupAutomatedBackup } from './server/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function startServer() {
  const app  = express();
  const PORT = parseInt(process.env.PORT || '3009');

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc:      ["'self'", "data:", "blob:"],
        fontSrc:     ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc:  ["'self'"],
        // Do NOT force HTTPS upgrades — this app runs over plain HTTP on LAN
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy:   false,
    originAgentCluster:        false,
    // Disable HSTS — it would force browsers to use HTTPS which we don't serve
    hsts: false,
  }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [`http://localhost:${PORT}`];

  // Allow localhost plus any private-LAN address on the same port (192.168.x, 10.x, 172.16-31.x),
  // as well as the Tailscale/CGNAT range 100.64.0.0/10 so VPN-joined devices work like LAN clients.
  // This is a self-hosted LAN app, so requests from other machines on the network are expected.
  const isPrivateLanOrigin = (origin: string) => {
    try {
      const u = new URL(origin);
      return /^(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|100\.(6[4-9]|[789]\d|1[01]\d|12[0-7])\.\d+\.\d+)$/.test(u.hostname);
    } catch { return false; }
  };

  app.use(cors({
    origin: (origin, callback) => {
      // Never throw — throwing makes Express return 500 for every asset/API request.
      if (!origin || allowedOrigins.includes(origin) || isPrivateLanOrigin(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 300,
    message: { error: 'طلبات كثيرة جداً' },
    standardHeaders: true, legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false, default: true },
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 10,
    message: { error: 'محاولات تسجيل دخول كثيرة' },
    standardHeaders: true, legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false, default: true },
  });

  app.use('/api/login', loginLimiter);
  app.use('/api/', generalLimiter);
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ limit: '1mb', extended: true }));

  await initDb();
  setupAutomatedBackup();

  app.use('/api', apiRouter);

  // Serve built frontend — use DIST_PATH env var when running inside Electron
  // (express.static cannot read from inside app.asar, so main.cjs passes the real path)
  const distPath   = process.env.DIST_PATH || path.join(__dirname, 'dist');
  const indexFile  = path.join(distPath, 'index.html');
  console.log(`[GMP Server] dist path: ${distPath} (exists: ${fs.existsSync(distPath)}, index: ${fs.existsSync(indexFile)})`);

  app.use(express.static(distPath));

  // SPA fallback — only for navigation requests, NOT for missing static assets.
  // Returning index.html for a missing .js/.css would break with wrong MIME type.
  app.get('*', (req, res) => {
    if (req.path.startsWith('/assets/') || path.extname(req.path)) {
      const wanted = path.join(distPath, req.path);
      return res.status(404).send(
        `Asset not found.\npath: ${req.path}\nlooked in: ${wanted}\nexists: ${fs.existsSync(wanted)}\ndist exists: ${fs.existsSync(distPath)}`
      );
    }
    if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
    res.status(500).send('Frontend not built. dist path: ' + distPath);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GMP Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
