// Servidor estático mínimo para os testes. Entrega index.html dentro do mesmo esqueleto que o Artifact adiciona.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
module.exports = () => new Promise(res => {
  const srv = http.createServer((req, rsp) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') {
      rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return rsp.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>' + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8') + '</body></html>');
    }
    const file = path.join(ROOT, path.normalize(url));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
    rsp.end(fs.readFileSync(file));
  }).listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
});
