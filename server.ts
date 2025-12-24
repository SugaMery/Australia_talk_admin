import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import AppServerModule from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  // Parse JSON bodies for API routes
  server.use(express.json());

  // Robust translation proxy: try multiple public LibreTranslate endpoints and validate JSON responses
  server.post('/api/translate', async (req, res) => {
    const body = req.body || {};
    console.log('Translation request:', { q: String(body.q || '').slice(0, 120), source: body.source, target: body.target });

    // Candidate endpoints to try (public instances). Order matters: prefer faster/reliable first.
    const endpoints = [
      'https://libretranslate.de/translate',
      'https://libre-translate.de/translate',
      'https://translate.argosopentech.com/translate'
    ];

    for (const endpoint of endpoints) {
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(body),
          redirect: 'follow'
        });

        const contentType = resp.headers.get('content-type') || '';

        if (!resp.ok) {
          const text = await resp.text();
          console.warn(`Endpoint ${endpoint} returned status ${resp.status}. Trying next. Body preview:`, text.substring(0, 200));
          continue; // try next endpoint
        }

        if (!contentType.includes('application/json')) {
          const text = await resp.text();
          console.warn(`Endpoint ${endpoint} returned non-JSON response. Trying next. Preview:`, text.substring(0, 200));
          continue; // try next endpoint
        }

        const data = await resp.json();
        // Basic validation: expect translatedText or translated_text or 'translated'
        if (data && (data.translatedText || data.translated_text || data.translated)) {
          return res.status(200).json(data);
        }

        // If payload is not what we expect, log and continue
        console.warn(`Endpoint ${endpoint} returned JSON but missing expected keys. Trying next.`, Object.keys(data || {}).slice(0,10));
      } catch (err) {
        console.warn(`Error calling ${endpoint}:`, String(err).slice(0,200));
        // try next endpoint
      }
    }

    // If we reached here, no endpoint provided a usable JSON translation
    console.error('All translation endpoints failed or returned invalid data.');
    return res.status(502).json({ error: 'translation_unavailable', details: 'All translation endpoints failed or returned invalid data' });
  });

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
