'use strict'
const {promisify: p} = require('util')
const express = require('express')
const fetch = require('node-fetch')
const passport = require('passport')
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const redis = require('redis')
const session = require('express-session')
const connectRedis = require('connect-redis')
const authenticationRoutes = require('./auth-routes')
const frontendRoutes = require('./frontend-routes')
const proxy = require('express-http-proxy')

function createApp({
  redisAddress,
  sessionSecret,
  userServiceAddress,
  frontendAddress,
  calculatorAddress,
  disableAuthentication,
}) {
  let cachedSymbols

  const app = express()

  app.set('etag', false)
  app.use(cookieParser())
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))

  app.set('view engine', 'ejs')

  const redisClient = new redis.createClient({url: `//${redisAddress}`})
  const RedisStore = connectRedis(session)
  app.use(
    session({
      secret: sessionSecret,
      store: new RedisStore({client: redisClient}),
    }),
  )
  app.use(passport.initialize())
  app.use(passport.session())
  app.use(flash())

  app.get('/', (req, res) => res.redirect('/currency'))

  if (!disableAuthentication) {
    authenticationRoutes(app, passport, userServiceAddress, onlyIfLoggedIn)
  }
  frontendRoutes(app, frontendAddress, onlyIfLoggedIn)

  app.get('/currencies', onlyIfLoggedInAjax, async (req, res) => {
    if (cachedSymbols) return res.json(cachedSymbols)

    try {
      const response = await fetch('https://api.fixer.io/latest')

      if (!response.ok) return res.status(500).send('')

      const ratesResponse = await response.json()

      cachedSymbols = Object.keys(ratesResponse.rates)

      return res.json(cachedSymbols)
    } catch (err) {
      return res.status(500).send(err.stack || err)
    }
  })

  app.get('/rates', onlyIfLoggedInAjax, async (req, res) => {
    const {base = 'USD', date = 'latest', symbols} = req.query || {}

    try {
      const response = await fetch(`https://api.fixer.io/${date}?symbols=${symbols}&base=${base}`)

      if (!response.ok) return res.status(500).send('')

      const ratesResponse = await response.json()

      return res.json(ratesResponse.rates)
    } catch (err) {
      return res.status(500).send(err.stack || err)
    }
  })

  app.all('/calculate', onlyIfLoggedInAjax, proxy(calculatorAddress))

  function onlyIfLoggedIn(req, res, next) {
    if (req.isAuthenticated() || disableAuthentication) return next()

    res.redirect('/login')
  }

  function onlyIfLoggedInAjax(req, res, next) {
    if (req.isAuthenticated() || disableAuthentication) return next()

    res.status(401).send('')
  }

  app.dispose = async () => {
    await redisClient.quit()
  }

  return app
}

module.exports = createApp
