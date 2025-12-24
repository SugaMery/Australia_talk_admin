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

    // Validate request payload
    if (!body.q || !body.source || !body.target) {
      return res.status(400).json({ 
        error: 'invalid_request', 
        details: 'Missing required fields: q, source, target' 
      });
    }

    // Candidate endpoints to try (public instances). Order matters: prefer faster/reliable first.
    const endpoints = [
      'https://libretranslate.de/translate',
      'https://libre-translate.de/translate',
      'https://translate.argosopentech.com/translate'
    ];

    const errors: string[] = [];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(body),
          redirect: 'follow',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const contentType = resp.headers.get('content-type') || '';

        if (!resp.ok) {
          const text = await resp.text();
          const msg = `Endpoint ${endpoint} returned status ${resp.status}`;
          console.warn(msg);
          errors.push(`${endpoint}: ${resp.status}`);
          continue; // try next endpoint
        }

        if (!contentType.includes('application/json')) {
          const text = await resp.text();
          const msg = `Endpoint ${endpoint} returned non-JSON response`;
          console.warn(msg);
          errors.push(`${endpoint}: non-JSON`);
          continue; // try next endpoint
        }

        const data = await resp.json();
        // Basic validation: expect translatedText or translated_text or 'translated'
        if (data && (data.translatedText || data.translated_text || data.translated)) {
          return res.status(200).json(data);
        }

        // If payload is not what we expect, log and continue
        const msg = `Endpoint ${endpoint} returned JSON but missing expected keys`;
        console.warn(msg, Object.keys(data || {}).slice(0,10));
        errors.push(`${endpoint}: missing translation keys`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Error calling ${endpoint}:`, errMsg.slice(0, 200));
        errors.push(`${endpoint}: ${errMsg.slice(0, 50)}`);
      }
    }

    // If we reached here, no endpoint provided a usable JSON translation
    console.error('All translation endpoints failed. Errors:', errors);
    return res.status(503).json({ 
      error: 'translation_service_unavailable', 
      details: 'All translation services failed or are unavailable',
      tried_endpoints: errors
    });
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
