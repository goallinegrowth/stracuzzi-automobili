import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = decodeURIComponent(url.pathname);

  // API routes
  if (pathname.startsWith('/api/')) {
    const handlerPath = path.join(__dirname, pathname.replace(/\//g, path.sep) + '.js');
    if (fs.existsSync(handlerPath)) {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', async () => {
        if (body) {
          try { req.body = JSON.parse(body); } catch { req.body = {}; }
        } else { req.body = {}; }
        res.setHeader('Content-Type', 'application/json');
        const handler = require(handlerPath);
        try { await handler(req, res); } catch (e) {
          res.writeHead(500); res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Static files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) && !path.extname(filePath)) filePath += '.html';
  if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => console.log(`Stracuzzi Automobili — http://localhost:${PORT}`));
