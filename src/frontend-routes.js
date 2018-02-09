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
    }),
  )
  app.get(/\./, onlyIfLoggedIn, proxy(frontendAdress))
}

module.exports = frontendRoutes
