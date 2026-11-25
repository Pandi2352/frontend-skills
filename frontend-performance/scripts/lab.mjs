// Shared by measure.mjs and check-leaks.mjs.

import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain',
};

/**
 * Serves dist like good hosting does: compressed, cached, unknown paths get the
 * app. `vite preview` does not compress, so it looks slower than production.
 */
export async function serve(project) {
  const dist = path.join(project, 'dist');
  if (!existsSync(path.join(dist, 'index.html'))) {
    console.error('No dist/index.html. Run the build first.');
    process.exit(2);
  }
  const server = createServer((request, response) => {
    let name = '/';
    try {
      name = decodeURIComponent(new URL(request.url ?? '/', 'http://x').pathname);
    } catch {
      // A broken address gets the app.
    }
    let file = path.join(dist, name);
    const inside = file.startsWith(dist + path.sep);
    if (!inside || !path.extname(file) || !existsSync(file)) {
      if (name.startsWith('/assets/')) {
        response.writeHead(404).end();
        return;
      }
      file = path.join(dist, 'index.html');
    }
    const type = TYPES[path.extname(file)] ?? 'application/octet-stream';
    const isText = /text|json|javascript|svg/.test(type);
    const headers = {
      'content-type': type,
      'cache-control': name.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    };
    let body = readFileSync(file);
    if (isText && /\bbr\b/.test(request.headers['accept-encoding'] ?? '')) {
      body = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 5 } });
      headers['content-encoding'] = 'br';
    }
    response.writeHead(200, headers).end(body);
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

/** Loads a package of the project, or explains how to install it. */
export async function load(project, name, via) {
  try {
    let from = createRequire(path.join(project, 'package.json'));
    if (via) from = createRequire(from.resolve(via));
    return await import(pathToFileURL(from.resolve(name)).href);
  } catch {
    console.error(`Could not load ${name}. In the project run:\n  node scripts/resolve-versions.mjs --project -D lighthouse\nand the install command it prints.`);
    process.exit(2);
  }
}

export async function openChrome(project) {
  const { launch } = await load(project, 'chrome-launcher', 'lighthouse');
  const chrome = await launch({ chromeFlags: ['--headless=new', '--no-first-run'] }).catch(() => null);
  if (!chrome) {
    console.error('Could not start Chrome. Install Chrome, or set CHROME_PATH.');
    process.exit(2);
  }
  return {
    port: chrome.port,
    close() {
      try {
        chrome.kill();
      } catch {
        // Windows may still hold the temporary profile; it is removed later.
      }
    },
  };
}

/** "list" or "/list". Git Bash on Windows turns "/list" into "C:/Program Files/Git/list". */
export const toPath = (text) => '/' + text.replace(/^[a-z]:[\/](?:.*[\/])?git(?=[\/]|$)/i, '').replace(/^[\/]+/, '');

export const middle = (list) => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
