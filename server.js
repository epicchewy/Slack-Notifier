'use strict'

/**
 * Set-up
 * Use express to make necessary API calls to Slack + Twillio
 * Listen locally
 * 
 */

const express = require('express')
let app = new express()
const morgan = require('morgan')


let routes = require('./api/routes')
app.set('port', (process.env.PORT || 8080))

app.listen(app.get('port'), () => {
  console.log('Welcome to your personal Slack Notifier')
  routes.init()
})
