'use strict'
const proxy = require('express-http-proxy')

function frontendRoutes(app, frontendAdress, onlyIfLoggedIn) {
  app.get(
    '/currency',
    onlyIfLoggedIn,
    proxy(frontendAdress, {
      proxyReqPathResolver(req) {
        return '/'
      },
      userResDecorator(proxyRes, proxyResData, userReq, userRes) {
        let html = proxyResData.toString('utf8')

        html = '<script>window.useCurrencyBackend = true</script>' + html

        return html
      },
    }),
  )
  app.get(/\./, onlyIfLoggedIn, proxy(frontendAdress))
}

module.exports = frontendRoutes
