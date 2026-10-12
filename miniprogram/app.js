var fallback = require('./data/fallback.js')
var packed = require('./data/dashboard.js')

App({
  globalData: {
    city: '东城区',
    dashboard: packed && packed.cities && packed.cities.length ? packed : fallback,
    weather: null,
    source: 'local',
    cloudError: '',
    listeners: [],
  },

  onLaunch: function () {
    var stored = ''
    try {
      stored = wx.getStorageSync('city') || ''
    } catch (error) {
      stored = ''
    }
    this.globalData.city = stored || '东城区'
    this.globalData.dashboard = packed && packed.cities && packed.cities.length ? packed : fallback
    this.globalData.source = 'local'
    this.cloudReady = false
    this.notify()
  },

  notify: function () {
    var list = this.globalData.listeners || []
    var i = 0
    for (i = 0; i < list.length; i += 1) {
      try {
        list[i]()
      } catch (error) {}
    }
  },

  reload: function () {
    var self = this
    if (!wx.cloud) {
      this.notify()
      return Promise.resolve(false)
    }
    if (!this.cloudReady) {
      try {
        wx.cloud.init({
          env: 'cloud1-d9geo9d5d2420afe8',
          traceUser: false,
        })
        this.cloudReady = true
      } catch (error) {
        this.globalData.cloudError = error.message || '云开发初始化失败'
        this.notify()
        return Promise.resolve(false)
      }
    }
    return wx.cloud.callFunction({ name: 'crypto', data: { action: 'dashboard' } })
      .then(function (res) {
        if (!res.result || !res.result.ok || !res.result.data || !res.result.data.cities || !res.result.data.cities.length) {
          self.globalData.cloudError = (res.result && res.result.message) || '云函数没有返回城市数据'
          self.notify()
          return false
        }
        self.globalData.cloudError = ''
        self.globalData.dashboard = res.result.data
        self.globalData.source = 'cloud'
        self.notify()
        return wx.cloud.callFunction({ name: 'crypto', data: { action: 'weather' } })
      })
      .then(function (res) {
        if (res && res.result && res.result.ok) {
          self.globalData.weather = res.result.data
          self.notify()
        }
        return self.globalData.source === 'cloud'
      })
      .catch(function (error) {
        if (self.globalData.source !== 'cloud') {
          var raw = error.errMsg || error.message || '云函数调用失败'
          self.globalData.cloudError = String(raw).replace(/\s+/g, ' ').slice(0, 180)
        }
        self.notify()
        return false
      })
  },
})
