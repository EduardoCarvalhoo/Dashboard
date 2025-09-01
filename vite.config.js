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
            proxyReq.setHeader('Cookie', `csrftoken=${localConfig.csrfToken}; session-id=${localConfig.sessionId}`);
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Content-Type', 'application/json');

            console.log('Proxy request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
