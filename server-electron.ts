/**
 * Electron server entry point.
 * Identical to server.ts but without Vite/dev-server dependency.
 * Used only when building server-bundle.cjs for Electron packaging.
 */
import path from 'path';
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

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
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
  const distPath = process.env.DIST_PATH || path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GMP Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
