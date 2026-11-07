import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore
import crawlHandler from './api/crawl.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-crawl-middleware',
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
