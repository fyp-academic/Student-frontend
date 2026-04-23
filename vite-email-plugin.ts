import type { Plugin } from 'vite';
import type { IncomingMessage } from 'http';
import { renderEmail } from './src/emails/render';
import type { EmailRenderRequest } from './src/emails/types';

/**
 * Vite plugin that provides an endpoint for the Laravel backend
 * to render React email templates to HTML.
 *
 * Endpoint: POST /__email/render
 * Body: { type: EmailType, data: object }
 * Response: { html: string }
 */
export function emailRenderPlugin(): Plugin {
  return {
    name: 'email-render-plugin',
    configureServer(server) {
      server.middlewares.use('/__email/render', async (req, res, next) => {
        if ((req as any).method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const { type, data }: EmailRenderRequest = JSON.parse(body);
            const html = renderEmail(type, data);

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ html }));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        });
      });

      // CORS preflight
      server.middlewares.use('/__email/render', (req, res, next) => {
        if ((req as any).method === 'OPTIONS') {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.statusCode = 204;
          res.end();
          return;
        }
        next();
      });
    },
  };
}
