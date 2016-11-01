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
    let latest = new Date()
    let oldest = new Date()
    oldest.setMinutes(latest.getMinutes() - 5)
    let latestTs = Date.parse(latest)/1000
    let oldestTs = Date.parse(oldest)/1000
    Promise.all([
        this.findChannels(),
        this.findGroups(),
        this.findIMs(),
        this.web.channels.history('C2JP8RZ9D', {latest: latest, oldest: oldest, unreads: 1})
      ]).then((values) => {
        this.channelIds = values[0]
        this.groupIds = values[1]
        this.IMIds = values[2]
        console.log('SHIT', values[3])
        // console.log('ALL IDs: ', this.channelIds, this.groupIds, this.IMIds)
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
      const opts = {
        latest: latest,
        oldest: oldest,
        unreads: 1
      }
      for (let channelId in this.channelIds) {
        console.log('Current channel id', channelId)
        requsts.push(this.web.channels.history(channelId, opts))
      }

      Promise.all(requests).then((values) => {
        // aggregate total unread count and per channel unread_notifications
        console.log('EXAMPLE RES: ', values[0])
        let totalUnreadCount = 0
        let notifications = {}
        for (let index = 0; index < values.length; index++) {
          totalUnreadCount += values[index].unread_count
          const unread = values[index].unread_count_display
          if (unread > 0) {
            const channelName = this.rtm.dataStore.getGroupById(this.channelIds[0])
            notifications[channelName].unread = unread
            for (let i = 0; i < unread; i++) { // search messages for important tags
              const numMessages = history.messages.length
              if (values[index].messages[i].indexOf(this.userId) || 
                  values[index].messages[i].indexOf('<!channel>') ||
                  values[index].messages[i].indexOf('<!everyone>')) {
                notifications[channelName].imporant = true
                break
              }
            }
          }
        }

        return resolve({
          totalUnreadCount: totalUnreadCount,
          notifications: notifications,
          dms: this.dms,
          groups: this.privateMsgs
        })
      }).catch(reject)
    })
  }
}

module.exports = SlackService
