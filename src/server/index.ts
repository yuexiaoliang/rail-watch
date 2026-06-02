import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import api from './api.js';
import { startScheduler } from './scheduler.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const staticDir = join(__dirname, '../../dist/client');

const app = new Hono();

// API routes
app.route('/api', api);

// Serve static files
app.use('/assets/*', serveStatic({ root: staticDir }));
app.use('/*', serveStatic({ root: staticDir, index: 'index.html' }));

// SPA fallback: for non-API, non-asset routes, serve index.html
app.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api') || c.req.path.startsWith('/assets')) return await next();
  const indexPath = join(staticDir, 'index.html');
  try {
    const content = readFileSync(indexPath, 'utf-8');
    return c.html(content);
  } catch {
    return c.text('Frontend not built yet', 503);
  }
});

const port = parseInt(process.env.PORT || '9120', 10);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running on http://localhost:${port}`);

// Auto-start scheduler
startScheduler().catch(console.error);
