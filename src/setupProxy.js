const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('🔧 [PROXY] Configurando proxy: /api -> http://localhost:5001');
  
  const proxyMiddleware = createProxyMiddleware({
    target: 'http://localhost:5001',
    changeOrigin: true,
    secure: false,
    logLevel: 'info',
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error('❌ [PROXY] Erro:', err.message);
      console.error('   Certifique-se de que o backend está rodando na porta 5001');
      if (!res.headersSent) {
        res.status(504).json({ 
          error: 'Backend não está respondendo',
          message: 'Verifique se o backend está rodando (start-backend.bat)',
          details: err.message
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log('📡 [PROXY]', req.method, req.url, '→ http://localhost:5001' + req.url);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('✅ [PROXY] Backend respondeu:', proxyRes.statusCode, req.url);
    }
  });
  
  app.use('/api', proxyMiddleware);
  
  console.log('✅ [PROXY] Proxy configurado com sucesso!');
};
