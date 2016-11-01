'use strict'

/**
 * Set-up
 * Use express to make necessary API calls to Slack + Twillio
 * Listen locally
 * 
 * Everythnig is covered in the the routes.js file and the services directory
 */

const express = require('express')
let app = new express()

let routes = require('./api/routes')
app.set('port', (process.env.PORT || 8080))

app.listen(app.get('port'), () => {
  console.log('Welcome to your personal Slack Notifier')
  routes.init()
})
