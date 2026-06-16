import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const files = sourceFiles(SRC).map((path) => ({ path, code: readFileSync(path, 'utf8') }));

describe('security: no dangerous DOM/JS sinks in app source', () => {
  const FORBIDDEN: Array<[string, RegExp]> = [
    ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
    ['innerHTML assignment', /\.innerHTML\s*=/],
    ['eval()', /\beval\s*\(/],
    ['new Function()', /new\s+Function\s*\(/],
    ['document.write', /document\.write/],
  ];

  it('contains no XSS-prone sinks', () => {
    const hits: string[] = [];
    for (const { path, code } of files) {
      for (const [name, re] of FORBIDDEN) {
        if (re.test(code)) hits.push(`${name} in ${path}`);
      }
    }
    expect(hits).toEqual([]);
  });
});

describe('security: no hardcoded secrets', () => {
  it('has no secret-like assignments', () => {
    const SECRET =
      /(api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|private[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i;
    const hits = files.filter(({ code }) => SECRET.test(code)).map(({ path }) => path);
    expect(hits).toEqual([]);
  });
});

describe('security: external links are safe', () => {
  it('every target="_blank" link sets rel="noreferrer"', () => {
    const offenders: string[] = [];
    for (const { path, code } of files) {
      let i = code.indexOf('target="_blank"');
      while (i !== -1) {
        // Look across the whole anchor tag (may span several lines).
        const windowText = code.slice(Math.max(0, i - 240), i + 240);
        if (!windowText.includes('noreferrer')) offenders.push(path);
        i = code.indexOf('target="_blank"', i + 1);
      }
    }
    expect(offenders).toEqual([]);
  });
});
