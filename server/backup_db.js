const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(__dirname, 'prisma', `backups`, `dev_backup_${timestamp}.db`);

const backupDir = path.join(__dirname, 'prisma', 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
} else {
    console.error('❌ Database file not found.');
}
