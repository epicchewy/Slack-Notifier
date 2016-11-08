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
 * @param: {messages} -- Object of aggregated message data
 * @return: {Promise} -- Promise of text messages of the current iteration
 */

function notify (messages) {
  return new Promise((resolve, reject) => {
    // messages come aggregated
    console.log("MESSAGE OBJECT: ", messages)
    const unreadCount = messages.totalUnreadCount
    const channelInfo = messages.channels
    const groupInfo = messages.groups
    const imInfo = messages.ims

    // send total count of unread messages in public channels first
    twil.sendMessage({
      to: config.PERSONAL_NUMBER,
      from: config.TWILIO_NUMBER,
      body: `In your public channels, you have ${unreadCount} unread messages.\n`
    }, (err1, resp1) => {
      if (err1) {
        return reject(err1)
      }
      // construct text for each public channel
      let channelMessage = ''
      for (let channelName in channelInfo) {
        let important = '(IMPORTANT)'
        let channelString = `In #${channel}, you have ${channelInfo[channelInfo]['unread']} unread messages.\n`
        if (channelInfo[channelInfo]['important']) {
          channelString += important
        }
        channelMessage += channelString
      }
      twil.sendMessage({
        to: config.PERSONAL_NUMBER,
        from: config.TWILIO_NUMBER,
        body: channelMessage
      }, (err2, resp2) => {
        if (err2) {
          return reject(err2)
        }
        // construct text for groupInfo
        let groupMessage = ''
        if (groupInfo == {}) {
          groupMessage = 'No Private Channel Notifications.\n'
        } else {
          for (let group in groupInfo) {
            let groupString = `#${group} has ${groupInfo[group]} unread messages.\n`
          }
        }
        twil.sendMessage({
          to: config.PERSONAL_NUMBER,
          from: config.TWILIO_NUMBER,
          body: groupMessage
        }, (err3, resp3) => {
          if (err3) {
            return rejct(err3)
          }
          // construct text for imInfo
          let imMessage = 'Your DMs Notifications:\n'
          if (imInfo == {}) {
            imMessage = 'No DM Notifications.'
          } else {
            for (let im in imInfo) {
              let imString = `${im} sent you ${imInfo[im]} messages.\n`
              imMessage += imString
            }
          }
          twil.sendMessage({
            to: config.PERSONAL_NUMBER,
            from: config.TWILIO_NUMBER,
            body: imMessage
          }, (err4, resp4) => {
            if (err4) {
              return reject(err4)
            }
            return resolve({notification: 'Success!'})
          })
        })
      })
    })
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
      to: config.PERSONAL_NUMBER,
      from: config.TWILIO_NUMBER,
      body: 'Sorry, something messed up! Please restart your Slack Notifier at the earliest convenience.'
    }, (err, resp) => {
      if (err) {
        return reject(err)
      }
      return resolve(resp)
    })
  })
}
