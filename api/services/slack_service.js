'use strict'

const config = require('../../config')
const RTM = require('@slack/client').RtmClient
const RTM_EVENTS = require('@slack/client').RTM_EVENTS
const MemoryDataStore = require('@slack/client').MemoryDataStore
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS
const WEB = require('@slack/client').WebClient

class SlackService {

  /**
    Contructor pertaining to one Slack team that listens and aggregates messages
    @param {String} token - Authentication token of Slack app
    @return {SlackService} Instance of the SlackService class
  */
  constructor (token) {
    this.token = token
    this.channelIds = []
    this.groupIds = []
    this.IMIds = []
    this.teamName = ''
    this.dms = {}
    this.privateMsgs = {}
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

  /**
   * getMessageIds() -- Gathers all necessary IDs
   *
   * @param: None
   * @return: void -- Run member functions to initialize class with channel/group/IM ids
   */
  getMessageIds() {
    Promise.all([
      this.findChannels(),
      this.findGroups(),
      this.findIMs()
    ]).then((values) => {
      // intialize arrays of channel, group, IM ids
      this.channelIds = values[0]
      this.groupIds = values[1]
      this.IMIds = values[2]
      this.listenToMessages()
    }).catch((err) => {
      console.log('Channel errors: ', err)
    })
  }

  /**
   * listenToMessages() -- Listens and watches RTM messages
   *
   * @param: None
   * @return: void -- RTM socket listener
   */
  listenToMessages () {
    let that = this
    this.rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage (msg) {
      // track amounts of messages coming into groups / IMs
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

  /**
   * clearMessages() -- Resets message dictionaries
   *
   * @param: None
   * @return: void
   */
  clearMessages () {
    this.dms = {}
    this.privateMsgs = {}
  }

  /**
   * findChannels() -- Runs API call to get all information on user's public channels
   *
   * @param: None
   * @return: {Promise} -- Promise that resolves to all participating channels
   */
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

  /**
   * findGroups() -- Runs API call to get all information on user's private channels
   *
   * @param: None
   * @return: {Promise} -- Promise that resolves to all private channels
   */
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

  /**
   * findIMs() -- Runs API call to get all information on user's IMs
   *
   * @param: None
   * @return: {Promise} -- Promise that resolves to all IMs
   */
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

  /**
   * findChannels() -- Aggregates all the tracked messagesm notifications, and unread count
   *
   * @param: {Date latest, Date oldest}
   * @return: {Promise} -- Promise that resolves to all messages and notifications
   */
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
            notifications[channelName] = {}
            notifications[channelName]['unread'] = unread
            for (let i = 0; i < unread; i++) {
              // search messages for important tags, break at first instance of an important message
              const numMessages = history.messages.length
              if (values[index].messages[i].indexOf(this.userId) || 
                  values[index].messages[i].indexOf('<!channel>') ||
                  values[index].messages[i].indexOf('<!everyone>')) {
                notifications[channelName]['imporant'] = true
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
