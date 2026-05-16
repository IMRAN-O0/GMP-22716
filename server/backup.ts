import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = 'QForm_Data.db';

export function setupAutomatedBackup() {
  const dbPath = path.join(__dirname, '..', DB_FILE);
  const backupsDir = path.join(__dirname, '..', 'backups');

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // Backup every 6 hours
  setInterval(() => {
    try {
      if (fs.existsSync(dbPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupsDir, `backup_${timestamp}.sqlite`);
        fs.copyFileSync(dbPath, backupPath);
        console.log(`[Backup] Successfully backed up DB to ${backupPath}`);
        
        // Optional: Keep only the 10 most recent backups to save space
        const files = fs.readdirSync(backupsDir)
          .filter(f => f.startsWith('backup_') && f.endsWith('.sqlite'))
          .sort()
          .reverse();
          
        if (files.length > 10) {
          const toDelete = files.slice(10);
          toDelete.forEach(file => {
             const delPath = path.join(backupsDir, file);
             fs.unlinkSync(delPath);
          });
        }
      }
    } catch (err) {
      console.error('[Backup] Failed to backup DB:', err);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours

  console.log('[Backup] Automated backups scheduled every 6 hours.');
}
