const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  app.use(
    '/api', // Specify your API endpoint path here
    createProxyMiddleware({
      target: 'http://localhost:5000', // Replace with your Express server URL
      changeOrigin: true,
    })
  );
};
