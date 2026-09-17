import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const configPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'nginx.conf');

describe('production nginx configuration', () => {
  it('proxies same-origin API requests to the backend service before SPA fallback', () => {
    const config = fs.readFileSync(configPath, 'utf8');

    expect(config).toMatch(/location\s+\/api\/\s*\{[\s\S]*proxy_pass\s+http:\/\/backend:3000;/);
    expect(config.indexOf('location /api/')).toBeLessThan(config.indexOf('location / {'));
    expect(config).toContain('try_files $uri $uri/ /index.html;');
  });
});
