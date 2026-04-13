const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const DIST_DIR = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

  // Prevenir acceso fuera de dist
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Leer el archivo
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Si es ruta sin extensión (SPA), servir index.html
      if (path.extname(filePath) === '') {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            console.log('404:', req.url);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data2);
            console.log('200 (SPA):', req.url);
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        console.log('404:', req.url);
      }
      return;
    }

    // Determinar Content-Type
    const ext = path.extname(filePath);
    let contentType = 'application/octet-stream';
    
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
    };
    
    contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    console.log('200:', req.url);
  });
});

server.listen(PORT, 'localhost', () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║  🌐 Frontend Servidor              ║
  ║  📍 URL: http://localhost:${PORT}   ║
  ║  📁 Directorio: ${DIST_DIR}
  ╚════════════════════════════════════╝
  `);
});

process.on('SIGINT', () => {
  console.log('\n✅ Servidor detenido');
  server.close();
  process.exit(0);
});
