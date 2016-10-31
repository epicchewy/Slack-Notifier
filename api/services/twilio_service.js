'use strict'

const config = require('../../config')
const twil = require('twilio')(config.TWILIO_ACCOUNT_SID_TEST, config.TWILIO_AUTH_TOKEN_TEST);

module.exports = {
  authenticate: authenticate,
  notify: notify,
  sendErrorMessage: sendErrorMessage
}

/**
 * authenticate() -- Authenticate returning user
 *
 * @param: None
 * @return: {Promise} -- Promise of Twilio message with desired key
 */

function authenticate (key) {
  return new Promise((resolve, reject) => {
    twil.sendMessage({
      to: config.PERSONAL_NUMBER, // Any number Twilio can deliver to
      from: config.TWILIO_NUMBER, // A number you bought from Twilio and can use for outbound communication
      body: 'Here is your authentication key -- ' + key // body of the SMS message
    }, (err, resp) => {
      if (err) {
        return reject(err)
      }
      return resolve(resp)
    })
  })
}

/**
 * notify() -- Send user a batch of text messages describing the latest Slack updates
 *
 * @param: None
 * @return: {Promise} -- Promise of text messages of the current iteration
 */

function notify (body) {
  return new Promise((resolve, reject) => {
    // messages come aggregated
    
  })
}

/**
 * sendErrorMessage() -- In the situation where an agenda job fails, the Slack Notifier will send the user a text message
 *
 * @param: None
 * @return: {Promise} -- Promise of Twilio message sending
 */

function sendErrorMessage () {
  return new Promise((resolve, reject) => {
    twil.sendMessage({
      to: config.PERSONAL_NUMBER, // Any number Twilio can deliver to
      from: config.TWILIO_NUMBER, // A number you bought from Twilio and can use for outbound communication
      body: 'Sorry, something messed up! Please restart your Slack Notifier at the earliest convenience.' // body of the SMS message
    }, (err, resp) => {
      if (err) {
        return reject(err)
      }
      return resolve(resp)
    })
  })
}
