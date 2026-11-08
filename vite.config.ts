import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import crawlHandler from './api/crawl.js'
// @ts-ignore
import syncHandler from './api/sync.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/crawl')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost:3000');
              const targetUrl = urlObj.searchParams.get('url') || '';
              const mockReq = { method: req.method, query: { url: targetUrl }, body: {} };
              const mockRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end(),
              };
              await crawlHandler(mockReq, mockRes);
              return;
            } catch (err) {
              console.error('API crawl error in Vite middleware:', err);
            }
          }

          if (req.url && req.url.startsWith('/api/sync')) {
            try {
              const urlObj = new URL(req.url, 'http://localhost:3000');
              const query: Record<string, string> = {};
              urlObj.searchParams.forEach((val, key) => {
                query[key] = val;
              });

              const mockRes = {
                setHeader: (k: string, v: string) => res.setHeader(k, v),
                status: (code: number) => {
                  res.statusCode = code;
                  return mockRes;
                },
                json: (data: any) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: () => res.end(),
              };

              if (req.method === 'POST') {
                let rawBody = '';
                req.on('data', (chunk) => {
                  rawBody += chunk;
                });
                req.on('end', async () => {
                  let body = {};
                  try {
                    body = JSON.parse(rawBody);
                  } catch {
                    body = {};
                  }
                  const mockReq = { method: 'POST', query, body };
                  await syncHandler(mockReq, mockRes);
                });
                return;
              }

              const mockReq = { method: req.method || 'GET', query, body: {} };
              await syncHandler(mockReq, mockRes);
              return;
            } catch (err) {
              console.error('API sync error in Vite middleware:', err);
            }
          }

          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: true
  }
})

