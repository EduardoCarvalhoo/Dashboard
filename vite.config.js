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
        followRedirects: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
            proxyReq.setHeader('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
            proxyReq.setHeader('Origin', localConfig.baseUrl);
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36');
            console.log('Auth proxy request:', req.method, req.url);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Auth proxy response:', proxyRes.statusCode, req.url);
            
            // Interceptar redirecionamentos 302
            if (proxyRes.statusCode === 302 || proxyRes.statusCode === 301) {
              const location = proxyRes.headers.location;
              console.log('Redirect intercepted:', location);
              
              // APENAS bloquear se contém especificamente error_code=5065
              if (location && location.includes('error_code=5065')) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  error: 'Usuário não autorizado a acessar este sistema.',
                  redirectUrl: location 
                }));
                return;
              }
              
              // Para todos os outros redirecionamentos (incluindo sucessos), retornar sucesso
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                redirectUrl: location,
                message: 'Autenticação bem-sucedida' 
              }));
              return;
            }
          });
        },
      }
    }
  }
})
