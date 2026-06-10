// Minimal Express boot used ONLY by the integration test suite.
// It mounts the real API router against a temp SQLite DB (DB_PATH env) with no
// Vite, rate-limiting or backups — so tests exercise the genuine endpoints.
// Run via tsx so the router's ".js" imports resolve to their ".ts" sources.
import express from 'express';
import { initDb } from './db.js';
import apiRouter from './api.js';

async function main() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api', apiRouter);
  await initDb();
  const PORT = parseInt(process.env.PORT || '3019', 10);
  app.listen(PORT, '127.0.0.1', () => {
    // The test harness waits for this marker on stdout.
    console.log(`TEST_SERVER_READY ${PORT}`);
  });
}

main().catch((e) => {
  console.error('TEST_SERVER_ERROR', e);
  process.exit(1);
});
