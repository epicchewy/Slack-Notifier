'use strict'

const config = require('../../config')
const RTM = require('@slack/client').RtmClient
const RTM_EVENTS = require('@slack/client').RTM_EVENTS
const MemoryDataStore = require('@slack/client').MemoryDataStore
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS
const WEB = require('@slack/client').WebClient

let messages = 0

class SlackService {
  constructor (token) {
    this.token = token
    this.channelIds = []
    this.groupIds = []
    this.IMIds = []
    this.teamName = ''
    this.dms = []
    this.messages = messages
    this.userId = ''

    const rtm = new RTM(this.token, {
      logLevel: 'debug',
      dataStore: new MemoryDataStore()
    })
    this.rtm = rtm
    this.web = new WEB(this.token, {
      logLevel: 'debug'
    })

    this.rtm.start()

    this.rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
      const user = this.rtm.dataStore.getUserById(rtm.activeUserId)
      this.userId = user.id

      const team = this.rtm.dataStore.getTeamById(rtm.activeTeamId)
      this.team = team.name
      Promise.all([
        this.findChannels(),
        this.findGroups(),
        this.findIMs()
      ]).then((values) => {
        this.channelIds = values[0]
        this.groupIds = values[1]
        this.IMIds = values[2]
        console.log('ALL IDs: ', this.channelIds, this.groupdIds, this.IMIds)
        this.listenToMessages()
      }).catch((err) => {
        console.log('Channel errors: ', err)
      })
    })
  }

  listenToMessages () {
    this.rtm.on(RTM_EVENTS.CHANNEL_MARKED, function handleRtmMessage (msg) { // has to be super specifc to the general message
      messages++
      this.messages = messages
    })
  } 

  getMessages () {
    return this.messages
  }

  clearMessages () {
    this.messages = 0
    this.dms = {}
  }

  findChannels () {
    return new Promise((resolve, reject) => {
      this.web.channels.list().then((channels) => {
        let channelIds = []
        if (channels.ok == true) {
          for (let channel in channels) {
            if (channel.is_member) {
              involvedChannels.push(channel.id)
            }
          }
          return resolve(involvedChannels)  
        } else {
          return reject('Could not find channels')
        }
      })
    })
  }

  findGroups () {
    return new Promise((resolve, reject) => {
      this.web.groups.list().then((groups) => {
        if (privateChannels.ok == true) {
          let groupdIds = []
          for (let group in groups) {
            groupdIds.push(group.id)
          }
          return resolve(groupIds)  
        } else {
          return reject('Could not retrieve groups')
        }
      })
    })
  }

  findIMs () {
    return new Promise((resolve, reject) => {
      this.web.im.list().then((ims) => {
        if (ims.ok == true) {
          let IMIds = []
          for (let im in ims) {
            IMIds.push(im.id)
          }
          return resolve(IMIds)
        } else {
          return reject('Could not retrieve IMs')
        }
      })
    })
  }

  checkDirectMessages (latest, oldest) {
    return new Promise((resolve, reject) => {
      Promise.all([

      ])
    })
  }
}

module.exports = SlackService
