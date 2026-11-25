#!/usr/bin/env node
// Measures pages with Lighthouse (phone, slow network), three runs each, and
// compares the middle run with performance.budget.json. Run after the build.
//
//   node measure.mjs [--project <folder>] [--url https://staging.example.com] [--runs 3] [/path ...]
//
// Without --url it serves dist itself. Needs Chrome and the lighthouse package.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { load, middle, openChrome, serve, toPath } from './lab.mjs';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { project: { type: 'string', default: '.' }, url: { type: 'string' }, runs: { type: 'string', default: '3' } },
});
const project = path.resolve(values.project);
const budgetFile = path.join(project, 'performance.budget.json');
const budget = existsSync(budgetFile) ? JSON.parse(readFileSync(budgetFile, 'utf8')) : {};
const limits = { score: 0.9, lcp: 3000, cls: 0.1, tbt: 200, ...budget.lab };
const pages = (positionals.length ? positionals : (budget.pages ?? ['/'])).map(toPath);
const runs = Math.max(1, Number(values.runs) || 3);

const { default: lighthouse } = await load(project, 'lighthouse');
const server = values.url ? null : await serve(project);
const base = (values.url ?? server.url).replace(/\/$/, '');
const chrome = await openChrome(project);

let failed = 0;
try {
  for (const page of pages) {
    const results = [];
    let landed = '';
    for (let i = 0; i < runs; i++) {
      const result = await lighthouse(base + page, { port: chrome.port, onlyCategories: ['performance'], logLevel: 'silent' });
      const { lhr } = result;
      if (lhr.runtimeError) {
        console.log(`\n${page}\n  could not be measured: ${lhr.runtimeError.message}`);
        failed++;
        break;
      }
      landed = new URL(lhr.finalDisplayedUrl).pathname;
      const value = (id) => lhr.audits[id].numericValue;
      results.push({
        score: lhr.categories.performance.score,
        lcp: value('largest-contentful-paint'),
        cls: value('cumulative-layout-shift'),
        tbt: value('total-blocking-time'),
        lhr,
      });
    }
    if (results.length < runs) continue;

    console.log(`\n${page}`);
    if (landed !== new URL(base + page).pathname) console.log(`  note: redirected to ${landed}, so that page was measured (is it behind a login?)`);
    const now = Object.fromEntries(Object.keys(limits).map((k) => [k, middle(results.map((r) => r[k]))]));
    const line = (label, value, ok, limit) => {
      if (!ok) failed++;
      console.log(`  ${ok ? 'ok  ' : 'OVER'} ${label.padEnd(26)} ${value.padStart(8)}   limit ${limit}`);
    };
    line('Score', String(Math.round(now.score * 100)), now.score >= limits.score, limits.score * 100);
    line('LCP, main content shown', `${Math.round(now.lcp)} ms`, now.lcp <= limits.lcp, `${limits.lcp} ms`);
    line('CLS, jumping', now.cls.toFixed(3), now.cls <= limits.cls, limits.cls);
    line('TBT, blocked by scripts', `${Math.round(now.tbt)} ms`, now.tbt <= limits.tbt, `${limits.tbt} ms`);

    const { lhr } = results.find((r) => r.score === now.score) ?? results[0];
    const ideas = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && (a.metricSavings?.LCP > 50 || a.metricSavings?.TBT > 30 || a.metricSavings?.CLS > 0.01))
      .slice(0, 5);
    for (const a of ideas) console.log(`       ${a.title}${a.displayValue ? `: ${a.displayValue}` : ''}`);
  }
} finally {
  chrome.close();
  server?.close();
}
console.log(failed ? `\n${failed} problem(s).` : '\nAll pages within budget.');
console.log('INP (reaction to clicks) needs real visits: see lib/web-vitals.ts.');
process.exit(failed ? 1 : 0);
