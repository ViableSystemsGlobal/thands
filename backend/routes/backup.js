const express = require('express');
const { spawn } = require('child_process');
const { createGunzip } = require('zlib');
const { PassThrough } = require('stream');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Only accept .sql and .sql.gz files (in memory, max 100 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.match(/\.(sql|sql\.gz|gz)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .sql or .sql.gz files are allowed'));
    }
  },
});

// Guard: super_admin only
const superAdminOnly = (req, res, next) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
};

// ─── DB config from env ───────────────────────────────────────────────────────

function dbEnv() {
  return {
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || '5432',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'tailoredhands_local',
  };
}

// ─── GET /api/admin/backup/download ──────────────────────────────────────────
// Streams a gzip-compressed pg_dump to the client.

router.get('/download', authenticateToken, superAdminOnly, (req, res) => {
  const db = dbEnv();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename  = `tailoredhands-backup-${timestamp}.sql.gz`;

  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const env = {
    ...process.env,
    PGPASSWORD: db.password,
  };

  const dump = spawn('pg_dump', [
    '-h', db.host,
    '-p', db.port,
    '-U', db.user,
    '-d', db.database,
    '--no-password',
    '--verbose',
    '--clean',           // DROP before CREATE for clean restores
    '--if-exists',
    '--format=plain',
  ], { env });

  const gzip = spawn('gzip', ['-c'], { env: process.env });

  dump.stdout.pipe(gzip.stdin);
  gzip.stdout.pipe(res);

  let dumpErr = '';
  dump.stderr.on('data', (d) => { dumpErr += d.toString(); });

  dump.on('error', (err) => {
    console.error('❌ pg_dump spawn error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'pg_dump not found. Is PostgreSQL installed on the server?' });
    }
  });

  gzip.on('error', (err) => {
    console.error('❌ gzip error:', err.message);
  });

  dump.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ pg_dump exited ${code}: ${dumpErr}`);
    } else {
      console.log(`✅ Backup downloaded: ${filename}`);
    }
  });
});

// ─── POST /api/admin/backup/restore ──────────────────────────────────────────
// Accepts a .sql or .sql.gz file and pipes it through psql.
// WARNING: This replaces data — only super_admin can call this.

router.post('/restore', authenticateToken, superAdminOnly, upload.single('backup'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No backup file uploaded' });
  }

  const db  = dbEnv();
  const env = { ...process.env, PGPASSWORD: db.password };
  const isGzip = req.file.originalname.endsWith('.gz');

  console.log(`📦 Restore: received ${req.file.originalname} (${req.file.size} bytes, gzip=${isGzip})`);

  const psql = spawn('psql', [
    '-h', db.host,
    '-p', db.port,
    '-U', db.user,
    '-d', db.database,
    '--no-password',
    '-v', 'ON_ERROR_STOP=1',
  ], { env });

  let stderr = '';
  psql.stderr.on('data', (d) => { stderr += d.toString(); });

  psql.on('error', (err) => {
    console.error('❌ psql spawn error:', err.message);
    return res.status(500).json({ error: 'psql not found. Is PostgreSQL installed on the server?' });
  });

  psql.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ psql restore failed (exit ${code}):`, stderr);
      return res.status(500).json({
        error: 'Restore failed',
        details: stderr.slice(-500), // last 500 chars of stderr
      });
    }
    console.log('✅ Database restore completed successfully');
    res.json({ success: true, message: 'Database restored successfully' });
  });

  // Stream the uploaded buffer into psql (decompress if needed)
  const bufStream = new PassThrough();
  bufStream.end(req.file.buffer);

  if (isGzip) {
    bufStream.pipe(createGunzip()).pipe(psql.stdin);
  } else {
    bufStream.pipe(psql.stdin);
  }
});

// ─── GET /api/admin/backup/status ────────────────────────────────────────────
// Returns whether pg_dump / psql are available on the server.

router.get('/status', authenticateToken, superAdminOnly, (req, res) => {
  let pgDumpAvailable = false;
  let psqlAvailable   = false;
  let done = 0;

  const check = () => {
    done++;
    if (done === 2) {
      res.json({ pgDumpAvailable, psqlAvailable });
    }
  };

  const d = spawn('pg_dump', ['--version']);
  d.on('close', (code) => { pgDumpAvailable = code === 0; check(); });
  d.on('error', () => { pgDumpAvailable = false; check(); });

  const p = spawn('psql', ['--version']);
  p.on('close', (code) => { psqlAvailable = code === 0; check(); });
  p.on('error', () => { psqlAvailable = false; check(); });
});

module.exports = router;
