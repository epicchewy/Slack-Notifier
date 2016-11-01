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
    this.dms = {}
    this.privateMsgs = {}
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
      this.getMessageIds()
    })
  }

  getMessageIds() {
    Promise.all([
        this.findChannels(),
        this.findGroups(),
        this.findIMs()
      ]).then((values) => {
        this.channelIds = values[0]
        this.groupIds = values[1]
        this.IMIds = values[2]
        console.log('ALL IDs: ', this.channelIds, this.groupIds, this.IMIds)
        this.listenToMessages()
      }).catch((err) => {
        console.log('Channel errors: ', err)
      })
  }

  listenToMessages () {
    let that = this
    this.rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage (msg) { // track amounts of messages coming into groups / IMs
      if (that.groupIds.indexOf(msg.channel) != -1 && msg.user != that.userId) {
        const channel = that.rtm.dataStore.getGroupById(msg.channel)
        if (that.privateMsgs[channel.name]) {
          that.privateMsgs[channel.name] = that.privateMsgs[channel.name] + 1 
        } else {
          that.privateMsgs[channel.name] = 1
        }
        console.log(that.privateMsgs)
      } else if (that.IMIds.indexOf(msg.channel) != -1 && msg.user != that.userId) {
        const user = that.rtm.dataStore.getUserById(msg.user)
        if (that.dms[user.name]) {
          that.dms[user.name] = that.dms[user.name] + 1 
        } else {
          that.dms[user.name] = 1
        }
      }
    })
  } 

  clearMessages () {
    this.dms = {}
    this.privateMsgs = {}
  }

  findChannels () {
    return new Promise((resolve, reject) => {
      this.web.channels.list().then((channels) => {
        let involvedChannels = []
        if (channels.ok == true) {
          for (let channel of channels.channels) {
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
        if (groups.ok == true) {
          let ids = []
          for (let group of groups.groups) {
            ids.push(group.id)
          }
          return resolve(ids)  
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
          for (let im of ims.ims) {
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
      let requests = []
      for (let channelId in this.channelIds) {
        requsts.push(this.web.channels.info(channelId))
      }

      Promise.all(requests).then((values) => {
        // aggregate total unread count and per channel unread_notifications
        console.log('EXAMPLE RES: ', values[0])
        let totalUnreadCount = 0
        let notifications = {}
        for (let channelInfo in values) {
          totalUnreadCount += channelInfo.unread_count
          if (channelInfo.unread_count_display > 0) {
            notifications[channelInfo.name] = channelInfo.unread_count_display
          }
        }

        return resolve({
          totalUnreadCount: totalUnreadCount,
          notifications: notifications
        })
      })
    })
  }
}

module.exports = SlackService
