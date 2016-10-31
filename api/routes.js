'use strict'

const fs = require('file-system')
const shortid = require('short-id')
const read = require('read')
const Twilio = require('./services/twilio_service')
const Slack = require('./services/slack_service')
const config = require('../config')

let slackTeams = {}
let listeners = []

module.exports = {
  init: init,
  listeners: listeners
}

/**
 * init() -- function that starts the program, checks local instance of mongo or your personal MongoURI
 * Instantiates webhooks to API services with your own keys
 *
 * @param: None
 * @return: Configured state or starts scheduler
 */


function init() {
  read({prompt: 'First time?', default: 'yes'}, (err, yes_no) => {
    if (yes_no == 'yes') {
      console.log('Dope! Lets get you started')
      configureChannels()
    } else if (yes_no == 'no') {
      // send the key to authenticate through twilio
      console.log('Starting up....')
      const slackTeam = new Slack(config.SLACK_TEST_TOKEN)
      // slackSetupListeners()
      // const key = shortid.generate()
      // Twilio.authenticate(key).then((resp) => {
      //   console.log('Your key has been sent.')
      //   read({prompt: 'Please enter your authentication key.'}, (err, entry) => {
      //     if (entry == key) {
      //       console.log('Success! Starting your notifier!')

      //       require('./services/agenda_jobs') 
      //     }
      //   })
      // }).catch((err) => {
      //   console.log('error sending message', err)
      //   process.exit(0)
      // })
    } else {
      console.log('Input must be yes/no. Please restart your Slack Notifier')
      process.exit(0)
    }
  })
}

/**
 * configureChannels() -- For first time users, it writes a private file with users Slack information
 *
 */

function configureChannels () {
  console.log('For every team you want to listen to, go to api.slack.com and register an app for each team')
  console.log('Please enter your phone number, Twilio information, and team name, the CLIENT_ID, CLIENT_SECRET for each Slack team')
  enterInformation()
}

/**
 * enterInformation() -- Get user input for phone number, twilio number, and twilio app authentication
 *
 * @param: None
 * @return: void
 */

function enterInformation () {
  read({prompt: 'Phone Number: ', default: '+16503050591'}, (err, phoneNumber) => {
    read({prompt: 'Twilio Number: ', default: '+16503050591'}, (err, twilioNumber) => {
      read({prompt: 'Twilio SID: '}, (err, twilioSID) => {
        read({prompt: 'Twilio Auth Token: '}, (err, twilioToken) => {
          slackTeams[PHONE_NUMBER] = phoneNumber
          slackTeams[TWILIO_NUMBER] = twilioNumber
          slackTeams[TWILIO_SID] = twilioSID
          slackTeams[TWILIO_TOKEN] = twilioToken
          slackTeams[teams] = {}
          enterTeamInformation()
        })
      })  
    })
  })
}

/**
 * enterTeamInformation() -- Get user input for all Slack team name and corresponding tokens
 *
 * @param: None
 * @return: void
 */

function enterTeamInformation () {
  read({prompt: 'Team Name: ', default: 'test-team'}, (err, teamName) => {
    read({prompt: 'Slack Token: '}, (err, token) => {
      slackTeams[teams][teamName] = token
      read({prompt: 'Do you have any more teams?', default: 'no'}, (err, moreTeams) => {
        if (!err && moreTeams == 'no') {
          console.log('Awesome! Lets write a local file for you that has all the slack app information')
          console.log('You can manually edit the file too if you fucked up your copy/paste')
          fs.writeFile('./team.js', 'module.exports = ' + JSON.stringify(slackTeams), (err) => {
            if (err) {
              console.error('fucked up the write')
            } else {
              console.log('Your Slack Notifier is now starting...')
              slackSetupListeners()
              require('./services/agenda_jobs')
            }
          })
        } else {
          enterTeamInformation()
        }
      })
    })
  })
}

/**
 * slackSetupListeners() -- Instantiate listeners for all Slack teams
 *
 * @param: None
 * @return: [ Array ] of listening Slack RTM Clients
 */

function slackSetupListeners () {
  const config = require('../teams')
  for (let tm in config[teams]) {
    const token = config[teams][tm]
    console.log('TEAM', tm, 'TOKEN -- ', token)
    const team = new Slack(token)
    listeners.push(team)
  }
}
