#!/usr/bin/env node
// Looks for memory leaks: goes back and forth between two pages of the built app
// and checks that memory, page elements and listeners do not keep growing.
//
//   node check-leaks.mjs [--project <folder>] [--url https://...] [--rounds 10] /first /second
//
// Pages behind a login cannot be checked this way.

import path from 'node:path';
import { parseArgs } from 'node:util';
import { load, openChrome, serve, toPath } from './lab.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { project: { type: 'string', default: '.' }, url: { type: 'string' }, rounds: { type: 'string', default: '10' } },
});
const [first, second] = positionals.map(toPath);
if (!first || !second) {
  console.error('Usage: node check-leaks.mjs [--project <folder>] [--url ...] /first /second');
  process.exit(2);
}
const project = path.resolve(values.project);
const rounds = Math.max(4, Number(values.rounds) || 10);
const puppeteer = (await load(project, 'puppeteer-core', 'lighthouse')).default;
const server = values.url ? null : await serve(project);
const base = (values.url ?? server.url).replace(/\/$/, '');
const chrome = await openChrome(project);
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });

let failed = false;
try {
  const page = await browser.newPage();
  await page.goto(base + first, { waitUntil: 'networkidle0' });
  const devtools = await page.createCDPSession();
  await devtools.send('HeapProfiler.enable');
  await devtools.send('Performance.enable');

  // Like a link in the app: no full page load.
  const go = async (to) => {
    await page.evaluate((path) => {
      history.pushState({}, '', path);
      dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    }, to);
    await page.waitForNetworkIdle({ idleTime: 300, timeout: 10_000 }).catch(() => undefined);
    await new Promise((done) => setTimeout(done, 200));
  };
  const measure = async () => {
    // Twice, so released pages are really gone.
    await devtools.send('HeapProfiler.collectGarbage');
    await devtools.send('HeapProfiler.collectGarbage');
    const { metrics } = await devtools.send('Performance.getMetrics');
    const get = (name) => metrics.find((m) => m.name === name).value;
    return { memory: get('JSHeapUsedSize') / 1e6, elements: get('Nodes'), listeners: get('JSEventListeners') };
  };
  const visit = async (times) => {
    for (let i = 0; i < times; i++) {
      await go(second);
      await go(first);
    }
  };

  await visit(3); // Fills caches, which is not a leak.
  const before = await measure();
  await visit(rounds);
  const after = await measure();
  if (new URL(page.url()).pathname !== new URL(base + first).pathname) {
    console.log(`note: ended on ${page.url()}, so the wrong page may have been checked`);
  }

  const limits = { memory: 0.2, elements: 10, listeners: 0.5 };
  const words = { memory: 'Memory (MB)', elements: 'Page elements', listeners: 'Listeners' };
  for (const [key, limit] of Object.entries(limits)) {
    const growth = (after[key] - before[key]) / rounds;
    const bad = growth > limit;
    failed ||= bad;
    console.log(`${bad ? 'LEAK' : 'ok  '} ${words[key].padEnd(14)} ${before[key].toFixed(1)} -> ${after[key].toFixed(1)}  (${growth.toFixed(2)} per visit)`);
  }
  console.log(failed ? '\nSomething grows with every visit. Look for a missing cleanup in an effect.' : '\nNo growth found.');
} finally {
  await browser.disconnect();
  chrome.close();
  server?.close();
}
process.exit(failed ? 1 : 0);
