'use strict'
const path = require('path')
const {describe, it, before, after} = require('mocha')
const {expect} = require('chai')
const fetch = require('node-fetch')
const {dockerComposeTool, getAddressForService} = require('docker-compose-mocha')

const app = require('../..')

describe('currency-backend it', function() {
  this.retries(global.v8debug || /--inspect/.test(process.execArgv.join(' ')) ? 0 : 3)
  const composePath = path.join(__dirname, 'docker-compose.yml')

  const envName = dockerComposeTool(before, after, composePath, {
    shouldPullImages: !!process.env.NODE_ENV && process.env.NODE_ENV !== 'development',
    brutallyKill: true,
  })

  const {baseUrl} = setupApp(envName, composePath)

  it.only('should wait and let me play with stuff', async () => {
    console.log(`Start testing at ${baseUrl()}/signup`)
    await require('util').promisify(setTimeout)(20000000)
  })

  it('should return OK on /', async () => {
    const response = await fetch(`${baseUrl()}/`)

    expect(response.status).to.equal(200)
    expect(await response.text()).to.equal('OK')
  })

  it('should return a correct list of currencies', async () => {
    const response = await fetch(`${baseUrl()}/currencies`)

    expect(response.status).to.equal(200)
    expect(await response.json()).to.eql([
      'AUD',
      'BGN',
      'BRL',
      'CAD',
      'CHF',
      'CNY',
      'CZK',
      'DKK',
      'GBP',
      'HKD',
      'HRK',
      'HUF',
      'IDR',
      'ILS',
      'INR',
      'JPY',
      'KRW',
      'MXN',
      'MYR',
      'NOK',
      'NZD',
      'PHP',
      'PLN',
      'RON',
      'RUB',
      'SEK',
      'SGD',
      'THB',
      'TRY',
      'USD',
      'ZAR',
    ])
  })

  it('should return a correct list of rates', async () => {
    const response = await fetch(`${baseUrl()}/rates?base=GBP&date=2010-10-10&symbols=EUR,USD`)

    expect(response.status).to.equal(200)
    expect(await response.json()).to.eql({
      EUR: 1.1427,
      USD: 1.5854,
    })
  })

  it.only('should do a calculation correctly', async () => {
    let nextState
    nextState = await fetchNextCalcState(null, '2', {EUR: 3})
    expect(nextState.display).to.equal('2')
    nextState = await fetchNextCalcState(nextState, 'EUR')
    expect(nextState.display).to.equal('6')
  })

  async function fetchNextCalcState(calculatorState, input, rates) {
    const response = await fetch(`${baseUrl()}/calculate`, {
      method: 'POST',
      body: JSON.stringify({rates, calculatorState, input}),
      headers: {'Content-Type': 'application/json'},
    })
    expect(response.status).to.equal(200)

    return await response.json()
  }
})

function setupApp(envName, composePath) {
  let server
  let appInstance

  before(async () => {
    const configuration = {
      redisAddress: await getAddressForService(envName, composePath, 'redis', 6379),
      sessionSecret: 'hush-hush',
      userServiceAddress: await getAddressForService(envName, composePath, 'user-service', 80),
      frontendAddress: await getAddressForService(envName, composePath, 'currency-frontend', 80),
      calculatorAddress: await getAddressForService(
        envName,
        composePath,
        'currency-calculator',
        80,
      ),
      disableAuthentication: false,
    }

    await new Promise((resolve, reject) => {
      appInstance = app(configuration)
      server = appInstance.listen(err => (err ? reject(err) : resolve()))
    })
  })

  after(async done => {
    await appInstance.dispose
    server.close(done)
  })

  return {
    baseUrl: () => `http://localhost:${server.address().port}`,
    address: () => `localhost:${server.address().port}`,
  }
}
