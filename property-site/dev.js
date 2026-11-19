/* Local preview: STAFF_PASSWORD=test node dev.js  ->  http://localhost:3000 (mimics Vercel: public/ + api/) */
const http = require('http'), fs = require('fs'), path = require('path');
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const m = u.pathname.match(/^\/api\/(\w+)$/);
  if (m && fs.existsSync(path.join(__dirname, 'api', m[1] + '.js')) && m[1][0] !== '_') {
    delete require.cache[require.resolve('./api/' + m[1] + '.js')];
    return Promise.resolve(require('./api/' + m[1] + '.js')(req, res)).catch((e) => { res.statusCode = 500; res.end(String(e)); });
  }
  let f = path.join(PUB, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!f.startsWith(PUB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end('Not found'); }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
