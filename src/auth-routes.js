'use strict'
const fetch = require('node-fetch')
var {Strategy: LocalStrategy} = require('passport-local')

function authRoutes(app, passport, userServiceAddress, onlyIfLoggedIn) {
  passport.serializeUser(function(user, done) {
    done(null, user.id)
  })

  passport.deserializeUser(async function(id, done) {
    const response = await fetch(`http://${userServiceAddress}/user/profile/${id}`)
    if (!response.ok) return done(new Error('user not found'))

    done(null, await response.json())
  })

  passport.use(
    'local-login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async function(req, email, password, done) {
        if (email) email = email.toLowerCase() // Use lower-case e-mails to avoid case-sensitive e-mail matching

        const response = await fetch(
          `http://${userServiceAddress}/authenticate?email=${encodeURI(email)}&password=${encodeURI(
            password,
          )}`,
        )
        if (!response.ok) return done(null, false, req.flash('loginMessage', 'No user found.'))
        const {id} = await response.json()

        const responseProfile = await fetch(`http://${userServiceAddress}/user/profile/${id}`)
        if (!responseProfile.ok)
          return done(null, false, req.flash('loginMessage', 'No user found.'))

        done(null, await responseProfile.json())
      },
    ),
  )

  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
      },
      async function(req, email, password, done) {
        if (email) email = email.toLowerCase() // Use lower-case e-mails to avoid case-sensitive e-mail matching
        const {name} = req.body

        const response = await fetch(`http://${userServiceAddress}/signup`, {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({name, email, password}),
        })
        if (!response.ok)
          return done(null, false, req.flash('signupMessage', 'email already exists'))
        const {id} = await response.json()

        const responseProfile = await fetch(`http://${userServiceAddress}/user/profile/${id}`)
        if (!responseProfile.ok) return done(null, false, req.flash('signupMessage', 'problem!'))

        done(null, await responseProfile.json())
      },
    ),
  )

  app.get('/profile', onlyIfLoggedIn, function(req, res) {
    res.render('profile.ejs', {
      user: req.user,
    })
  })

  app.get('/logout', function(req, res) {
    req.logout()
    res.redirect('/')
  })

  app.get('/login', function(req, res) {
    res.render('login.ejs', {message: req.flash('loginMessage')})
  })

  app.post(
    '/login',
    passport.authenticate('local-login', {
      successRedirect: '/currency',
      failureRedirect: '/login',
      failureFlash: true,
    }),
  )

  app.get('/signup', function(req, res) {
    res.render('signup.ejs', {message: req.flash('signupMessage')})
  })

  app.post(
    '/signup',
    passport.authenticate('local-signup', {
      successRedirect: '/currency',
      failureRedirect: '/signup',
      failureFlash: true,
    }),
  )

  app.get('/connect/local', function(req, res) {
    res.render('connect-local.ejs', {message: req.flash('loginMessage')})
  })
  app.post(
    '/connect/local',
    passport.authenticate('local-signup', {
      successRedirect: '/profile',
      failureRedirect: '/connect/local',
      failureFlash: true,
    }),
  )
}

module.exports = authRoutes
