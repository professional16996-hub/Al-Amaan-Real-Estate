import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from './server/routes.ts';
import { UPLOADS_DIR, ensureStorageDirectories, getDb } from './server/db.ts';

async function startServer() {
  ensureStorageDirectories();
  getDb();

  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production' || (fs.existsSync(path.resolve(process.cwd(), 'dist/index.html')) && process.env.npm_lifecycle_event === 'start');

  app.use(cookieParser());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve dynamic uploaded images & local generated architectural assets
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

  // Mount API routes
  app.use('/api', apiRouter);

  // Express API error handler (including Multer upload validation errors)
  app.use('/api', (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[API Error]:', err.message);
    res.status(400).json({ error: err.message || 'An unexpected server error occurred.' });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Al Amaan Real Estate & Developers server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
