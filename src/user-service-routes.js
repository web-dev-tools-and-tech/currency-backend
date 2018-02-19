'use strict'
const proxy = require('express-http-proxy')

function userServiceRoutes(app, userServiceAddress, onlyIfLoggedInAjax) {
	app.all('/user/data/*', onlyIfLoggedInAjax , proxy(userServiceAddress))
}

module.exports = userServiceRoutes
