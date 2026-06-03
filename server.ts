import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { initDb } from './server/db.js';
import apiRouter from './server/api.js';
import { setupAutomatedBackup } from './server/backup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  const PORT = parseInt(process.env.PORT || '3009');

  // Security Headers (Helmet)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        connectSrc: ["'self'"],
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

  // CORS — allow localhost plus any private-LAN address on the same port
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3009', 'http://127.0.0.1:3009'];

  const isPrivateLanOrigin = (origin: string) => {
    try {
      const u = new URL(origin);
      // Private LAN ranges plus the Tailscale/CGNAT range 100.64.0.0/10 (2nd octet 64-127),
      // so devices joined over a Tailscale/WireGuard VPN are treated like LAN clients.
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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // General API rate limit
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { error: 'طلبات كثيرة جداً، حاول مرة أخرى بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false, default: true },
  });

  // Strict rate limit on login — max 10 attempts per 15 min
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'محاولات تسجيل دخول كثيرة، حاول مرة أخرى بعد 15 دقيقة' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, forwardedHeader: false, default: true },
  });

  app.use('/api/login', loginLimiter);
  app.use('/api/', generalLimiter);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "1mb", extended: true }));

  await initDb();
  setupAutomatedBackup();

  app.use('/api', apiRouter);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// When bundled for Electron, startServer is imported directly by the bundle entry.
// When run normally (npm run dev / npm start), call it here.
if (process.env.ELECTRON_APP !== '1') {
  startServer();
}

export { startServer };
