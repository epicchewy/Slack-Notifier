'use strict'

const Twilio = require('./twilio_service')
const Agenda = require('agenda')
const mongoURI = 'mongodb://127.0.0.1/agenda'
const agenda = new Agenda({db: {address: mongoURI}})
const Main = require('../routes')


agenda.on('complete', (job) => {
  console.log('Job finished -- sending text', job.attrs)
  job.remove((err) => {
    if (err) {
      console.log('ERROR: we need some tissues for our issues')
    }
  })
})

agenda.on('fail', (error, job) => {
  console.error('Error in agenda job, sending text message')
  Twilio.sendErrorMessage().then( => {})
  throw new Error(job)
})

function graceful () {
  agenda.stop(() => {
    process.exit(0)
  })
}

process.on('SIGTERM', graceful)
process.on('SIGINT', graceful)

agenda.define('send-notifications', (job, done) => {
  const slackTeams = Main.listeners
  let latest = new Date()
  let oldest = new Date()
  oldest.setMinutes(latest.getMinutes() - 5)
  let latestTs = Date.parse(latest)/1000
  let oldestTs = Date.parse(oldest)/1000

  for (let team in slackTeams) {
    team.checkMessages(latestTs, oldestTs).then((messageObject) => {
      Twilio.notify(messageObject).then(() => {
        team.clearMessages()
        console.log('Notified at --', new Date())
      })
    })
  }
  agenda.schedule('in 30 seconds', 'send-notifications')
  done()
})


agenda.on('ready', () => {
  console.log('Scheduler is ready')
  // send notifications every half hour, but keep at 2 seconds for testing purposes
  agenda.schedule('in 2 seconds', 'send-notifications')

  agenda.start()
})
