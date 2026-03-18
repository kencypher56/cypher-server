#!/usr/bin/env node
'use strict';

const express = require('express');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const readline = require('readline');
const archiver = require('archiver');
const mime = require('mime-types');
const os = require('os');
const http = require('http');

const app = express();
app.use(express.json({ limit: '50mb' }));

let ROOT_DIR = '';
const STATIC_DIR = __dirname;

// ─────────────────────────────────────────────
//  TERMINAL HELPERS
// ─────────────────────────────────────────────
const c = {
  cyan: s => `\x1b[36m${s}\x1b[0m`,
  green: s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
  magenta: s => `\x1b[35m${s}\x1b[0m`,
};

function banner() {
  console.log(c.cyan(''));
  console.log(c.cyan('  ██████╗██╗   ██╗██████╗ ██╗  ██╗███████╗██████╗ '));
  console.log(c.cyan(' ██╔════╝╚██╗ ██╔╝██╔══██╗██║  ██║██╔════╝██╔══██╗'));
  console.log(c.cyan(' ██║      ╚████╔╝ ██████╔╝███████║█████╗  ██████╔╝'));
  console.log(c.cyan(' ██║       ╚██╔╝  ██╔═══╝ ██╔══██║██╔══╝  ██╔══██╗'));
  console.log(c.cyan(' ╚██████╗   ██║   ██║     ██║  ██║███████╗██║  ██║'));
  console.log(c.cyan('  ╚═════╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝'));
  console.log(c.magenta('           S E R V E R   v 1 . 0 . 0              '));
  console.log(c.cyan('─────────────────────────────────────────────────'));
}

// ─────────────────────────────────────────────
//  TAB COMPLETION
// ─────────────────────────────────────────────
function tabCompleter(line, callback) {
  try {
    const expanded = line.startsWith('~')
      ? line.replace('~', os.homedir())
      : line;

    let dirPart, basePart;
    if (expanded.endsWith(path.sep) || expanded === '') {
      dirPart = expanded || process.cwd();
      basePart = '';
    } else {
      dirPart = path.dirname(expanded) || '.';
      basePart = path.basename(expanded);
    }

    const resolvedDir = path.resolve(dirPart);
    const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });
    const matches = entries
      .filter(e => e.isDirectory() && e.name.toLowerCase().startsWith(basePart.toLowerCase()))
      .map(e => {
        const full = path.join(resolvedDir, e.name) + path.sep;
        return full;
      });

    callback(null, [matches, line]);
  } catch {
    callback(null, [[], line]);
  }
}

// ─────────────────────────────────────────────
//  STARTUP: ASK DIRECTORY + PORT
// ─────────────────────────────────────────────
async function askSetup() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: tabCompleter,
      terminal: true,
    });

    banner();
    console.log(c.yellow('\n  Tab key autocompletes directory paths\n'));

    const askDir = () => {
      rl.question(c.cyan('  📁 Directory to serve: '), answer => {
        const raw = answer.trim() || process.cwd();
        const resolved = path.resolve(raw.startsWith('~') ? raw.replace('~', os.homedir()) : raw);

        if (!fs.existsSync(resolved)) {
          console.log(c.red(`  ✗ Path not found: ${resolved}`));
          return askDir();
        }
        const stat = fs.statSync(resolved);
        if (!stat.isDirectory()) {
          console.log(c.red('  ✗ That is a file, not a directory'));
          return askDir();
        }
        ROOT_DIR = resolved;
        console.log(c.green(`  ✓ Serving: ${ROOT_DIR}`));
        askPort();
      });
    };

    const askPort = () => {
      rl.question(c.cyan('  🌐 Port (default 3000): '), answer => {
        const port = parseInt(answer.trim()) || 3000;
        rl.close();
        resolve({ port });
      });
    };

    askDir();
  });
}

// ─────────────────────────────────────────────
//  SECURITY: SAFE PATH
// ─────────────────────────────────────────────
function safePath(reqPath) {
  if (!reqPath) return ROOT_DIR;
  // Decode and normalize
  const decoded = decodeURIComponent(reqPath).replace(/\\/g, '/');
  const full = path.resolve(ROOT_DIR, decoded.replace(/^\/+/, ''));
  if (!full.startsWith(ROOT_DIR)) throw new Error('Access denied: path traversal detected');
  return full;
}

// ─────────────────────────────────────────────
//  FILE CATEGORIZATION
// ─────────────────────────────────────────────
const CATEGORIES = {
  pictures: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.avif', '.heic', '.raw'],
  videos: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.ts', '.m2ts', '.3gp', '.ogv', '.vob'],
  music: ['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma', '.opus', '.aiff', '.ape', '.mka'],
  documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.csv', '.rtf', '.epub'],
  compressed: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.zst', '.tar.gz', '.tar.bz2', '.tar.xz', '.iso'],
  apks: ['.apk', '.xapk', '.apks', '.aab'],
};

function categorize(filename) {
  const ext = path.extname(filename).toLowerCase();
  // Handle double extensions like .tar.gz
  const lower = filename.toLowerCase();
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tar.bz2') || lower.endsWith('.tar.xz')) {
    return 'compressed';
  }
  for (const [cat, exts] of Object.entries(CATEGORIES)) {
    if (exts.includes(ext)) return cat;
  }
  return 'other';
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─────────────────────────────────────────────
//  API ROUTES
// ─────────────────────────────────────────────

// Browse directory
app.get('/api/browse', async (req, res) => {
  try {
    const reqPath = req.query.path || '';
    const fullPath = reqPath ? safePath(reqPath) : ROOT_DIR;

    const entries = await fsp.readdir(fullPath, { withFileTypes: true });
    const items = await Promise.all(
      entries.map(async entry => {
        const entryFull = path.join(fullPath, entry.name);
        const relPath = path.relative(ROOT_DIR, entryFull);
        try {
          const stat = await fsp.stat(entryFull);
          return {
            name: entry.name,
            path: relPath,
            isDirectory: entry.isDirectory(),
            size: stat.size,
            sizeFormatted: formatSize(stat.size),
            modified: stat.mtime,
            category: entry.isDirectory() ? 'folder' : categorize(entry.name),
            ext: path.extname(entry.name).toLowerCase(),
          };
        } catch {
          return null;
        }
      })
    );

    const filtered = items
      .filter(Boolean)
      .sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      });

    const parent = reqPath ? path.dirname(reqPath).replace(/\\/g, '/') : null;
    res.json({
      path: reqPath || '/',
      fullPath,
      items: filtered,
      parent: parent === '.' ? '' : parent,
      rootDir: ROOT_DIR,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get directory tree (recursive, for sidebar)
app.get('/api/tree', async (req, res) => {
  try {
    const reqPath = req.query.path || '';
    const fullPath = reqPath ? safePath(reqPath) : ROOT_DIR;
    const maxDepth = parseInt(req.query.depth) || 3;

    async function buildTree(dir, depth) {
      if (depth > maxDepth) return [];
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory());
      return Promise.all(
        dirs.map(async e => {
          const full = path.join(dir, e.name);
          const rel = path.relative(ROOT_DIR, full);
          const children = await buildTree(full, depth + 1);
          return { name: e.name, path: rel, children };
        })
      );
    }

    const tree = await buildTree(fullPath, 1);
    res.json(tree);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Stream/Download file with Range support
app.get('/api/stream', async (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const stat = await fsp.stat(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const isDownload = req.query.download === '1';

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    if (isDownload) {
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(filePath))}`);
    }

    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': chunkSize,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', stat.size);
      res.status(200);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Download file (forces download)
app.get('/api/download', async (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const stat = await fsp.stat(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    const fileName = path.basename(filePath);

    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);

    const range = req.headers.range;
    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': chunkSize,
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
      res.setHeader('Content-Length', stat.size);
      res.status(200);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Download multiple files as ZIP (POST)
app.post('/api/zip', async (req, res) => {
  try {
    const { paths, name } = req.body;
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ error: 'No paths provided' });
    }

    const zipName = (name || 'archive') + '.zip';
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    for (const p of paths) {
      const fullPath = safePath(p);
      const stat = await fsp.stat(fullPath);
      if (stat.isDirectory()) {
        archive.directory(fullPath, path.basename(fullPath));
      } else {
        archive.file(fullPath, { name: path.basename(fullPath) });
      }
    }

    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(400).json({ error: err.message });
  }
});

// Download directory as ZIP
app.get('/api/zip-dir', async (req, res) => {
  try {
    const dirPath = safePath(req.query.path);
    const stat = await fsp.stat(dirPath);
    if (!stat.isDirectory()) throw new Error('Not a directory');

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="archive.zip"`);

    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);
    archive.directory(dirPath, path.basename(dirPath));
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) res.status(400).json({ error: err.message });
  }
});

// Get file info
app.get('/api/info', async (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const stat = await fsp.stat(filePath);
    res.json({
      name: path.basename(filePath),
      size: stat.size,
      sizeFormatted: formatSize(stat.size),
      modified: stat.mtime,
      created: stat.birthtime,
      isDirectory: stat.isDirectory(),
      mimeType: mime.lookup(filePath) || 'application/octet-stream',
      category: categorize(path.basename(filePath)),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get subtitles for a video file
app.get('/api/subtitles', async (req, res) => {
  try {
    const filePath = safePath(req.query.path);
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, path.extname(filePath));

    const entries = await fsp.readdir(dir);
    const subExts = ['.srt', '.vtt', '.ass', '.ssa', '.sub', '.idx'];

    const subs = entries
      .filter(e => {
        const ext = path.extname(e).toLowerCase();
        const nameNoExt = e.substring(0, e.lastIndexOf('.'));
        return subExts.includes(ext) && (nameNoExt === base || nameNoExt.startsWith(base + '.') || nameNoExt.startsWith(base + '_'));
      })
      .map(e => ({
        name: e,
        path: path.relative(ROOT_DIR, path.join(dir, e)).replace(/\\/g, '/'),
        ext: path.extname(e).toLowerCase(),
        label: path.basename(e, path.extname(e)).replace(base, '').replace(/^[._-]/, '') || 'Default',
      }));

    res.json(subs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Search files
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase().trim();
    if (!query) return res.json([]);

    const results = [];
    async function search(dir, depth) {
      if (depth > 6) return;
      const entries = await fsp.readdir(dir, { withFileTypes: true });
      await Promise.all(entries.map(async e => {
        if (e.name.toLowerCase().includes(query)) {
          const full = path.join(dir, e.name);
          try {
            const stat = await fsp.stat(full);
            results.push({
              name: e.name,
              path: path.relative(ROOT_DIR, full).replace(/\\/g, '/'),
              isDirectory: e.isDirectory(),
              size: stat.size,
              sizeFormatted: formatSize(stat.size),
              category: e.isDirectory() ? 'folder' : categorize(e.name),
              ext: path.extname(e.name).toLowerCase(),
            });
          } catch {}
        }
        if (e.isDirectory()) {
          await search(path.join(dir, e.name), depth + 1);
        }
      }));
    }

    await search(ROOT_DIR, 0);
    res.json(results.slice(0, 200));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
//  STATIC: Serve cypher-share UI assets
// ─────────────────────────────────────────────
app.use('/_static', express.static(STATIC_DIR, {
  maxAge: '1h',
  etag: true,
}));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ─────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────
async function main() {
  const { port } = await askSetup();

  const server = http.createServer(app);
  server.listen(port, '0.0.0.0', () => {
    const ifaces = os.networkInterfaces();
    console.log('');
    console.log(c.green('  ╔══════════════════════════════════════╗'));
    console.log(c.green('  ║    CYPHER-SERVER IS NOW RUNNING      ║'));
    console.log(c.green('  ╚══════════════════════════════════════╝'));
    console.log(c.cyan(`  • Local:   http://localhost:${port}`));
    Object.values(ifaces)
      .flat()
      .filter(i => i.family === 'IPv4' && !i.internal)
      .forEach(i => console.log(c.cyan(`  • Network: http://${i.address}:${port}`)));
    console.log(c.yellow(`  • Serving: ${ROOT_DIR}`));
    console.log(c.yellow(`  • Press Ctrl+C to stop\n`));
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.log(c.red(`  ✗ Port ${port} is already in use. Try another port.`));
    } else {
      console.log(c.red(`  ✗ Server error: ${err.message}`));
    }
    process.exit(1);
  });
}

main().catch(err => {
  console.error(c.red('Fatal error:'), err.message);
  process.exit(1);
});