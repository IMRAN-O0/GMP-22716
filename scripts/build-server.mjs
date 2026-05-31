/**
 * Bundles the Express server into a single CommonJS file for Electron.
 * Output: server-bundle.cjs
 *
 * sqlite3 is marked external because it's a native addon (.node file)
 * and must be present alongside the bundle at runtime.
 */

/**
 * Bundles server-electron.ts (Express only, no Vite) into server-bundle.cjs
 * for use inside Electron's main process child spawn.
 */
import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(ROOT, 'server-electron.ts')],
  bundle:      true,
  platform:    'node',
  target:      ['node18'],
  format:      'cjs',
  outfile:     path.join(ROOT, 'server-bundle.cjs'),
  // Fix import.meta.url for CJS context (used by db.ts and other modules)
  banner: {
    js: `const __importMetaUrl = require('url').pathToFileURL(__filename).href;`,
  },
  define: {
    'import.meta.url': '__importMetaUrl',
  },
  // Native addons must stay external — electron-rebuild handles them separately
  external: [
    'sqlite3',
    'bcryptjs',
    'fsevents',
    '@google/genai',
    'nodemailer',
    'xlsx',
    'jspdf',
  ],
  logLevel: 'info',
});

console.log('\n✅  server-bundle.cjs built successfully\n');
