#!/usr/bin/env node
'use strict'

const webApp = require('../')

const configuration = {
  redisAddress: process.env.REDIS_ADDRESS,
  sessionSecret: process.env.SESSION_SECRET,
  userServiceAddress: process.env.USER_SERVICE_ADDRESS,
  frontendAddress: process.env.FRONTEND_ADDRESS,
  calculatorAddress: process.env.CALCULATOR_ADDRESS,
}

const server = webApp(configuration).listen(process.env.PORT || 3000, err => {
  if (err) {
    return console.error(err)
  }
  console.log(`Listening on port ${server.address().port}`)
})
