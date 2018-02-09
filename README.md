# currency-backend

Application that yada yada yada.

Parts of the code were copied from [easy node authentication](https://github.com/scotch-io/easy-node-authentication)
([License](https://github.com/scotch-io/easy-node-authentication/blob/master/LICENSE))

## Installing

* This package is meant to be used as a docker container, passing the environment variables as defined below.

```sh
docker run -d applitools/currency-backend
```

* Alternatively, it can be run using `./scripts/run-currency-backend.js`,
  passing the environment variables as defined below.

```sh
npm install -g @applitools/currency-backend
run-currency-backend.js
```

* Alternatively, you can import it and create the app (see below), passing it the configuration as defined below.

```sh
npm install @applitools/currency-backend
```

## Services it depends on

* Yada: yada yada

### Queue Job Schema

A JSON with the following fields:

* `yada`: yada yada

## Environment variables needed by docker container and application

* `YADA_YADA`: yada

## Using the package to run the application

```js
const createApp = require('@applitools/currency-backend')

// configuration options aee the same as the above corresponding environment variables
const app = createApp({})

// app is an express app. Use listen to start it in the usual way
app.listen(/*...*/)
```
