import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { root } from '../src/registry.mjs';

const index = await fs.readFile(path.join(root, 'docs/index.html'), 'utf8');
const css = await fs.readFile(path.join(root, 'docs/assets/site.css'), 'utf8');
const js = await fs.readFile(path.join(root, 'docs/assets/site.js'), 'utf8');
const workflow = await fs.readFile(path.join(root, '.github/workflows/pages.yml'), 'utf8');
assert.match(index, /<main id="main">/);
assert.match(index, /https:\/\/github\.com\/aiagent-sg-2026\/AI-Agent-Research/);
assert.match(index, /id="protocol-grid"/);
assert.match(index, /id="bar-chart"/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@media\(max-width/);
assert.equal((js.match(/\['P\d{2}'/g) ?? []).length, 20);
assert.match(js, /P20/);
assert.match(index, /5\/5/); // the visible site copy must preserve the all-arms result
assert.match(workflow, /actions\/configure-pages@v5/);
assert.match(workflow, /actions\/upload-pages-artifact@v3/);
assert.match(workflow, /actions\/deploy-pages@v4/);
assert.doesNotMatch(index + css + js, /pilot-out|dataset\/evaluator|answer key|expected patch|competitor output|CODEX_HOME/);
console.log('site checks passed: semantic shell, source link, registry/chart hooks, responsive/reduced-motion CSS, Pages actions, no private evidence markers');
