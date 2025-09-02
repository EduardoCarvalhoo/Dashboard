import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { localConfig } from './vite.config.local.js'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `${localConfig.baseUrl}`,
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Manter apenas session-id para requisições da API
            proxyReq.setHeader('Cookie', `session-id=${localConfig.sessionId}`);
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');

            console.log('Proxy request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/auth': {
        target: `${localConfig.baseUrl}`,
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Para auth endpoints, deixar o browser gerenciar os cookies automaticamente
            // Não sobrescrever cookies para permitir tokens CSRF dinâmicos
            proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
            proxyReq.setHeader('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
            proxyReq.setHeader('Origin', localConfig.baseUrl);
            proxyReq.setHeader('Priority', 'u=1, i');
            proxyReq.setHeader('Referer', `${localConfig.baseUrl}/?next_path=/del-tech/projects/d425304e-af04-41e1-ad98-96f1de4f1e5b/cycles/`);
            proxyReq.setHeader('Sec-CH-UA', '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"');
            proxyReq.setHeader('Sec-CH-UA-Mobile', '?0');
            proxyReq.setHeader('Sec-CH-UA-Platform', '"Windows"');
            proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
            proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
            proxyReq.setHeader('Sec-Fetch-Site', 'same-origin');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');

            console.log('Auth proxy request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Auth proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
