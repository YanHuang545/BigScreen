var session = require('../../utils/session')

Page({
  data: {
    source: '本地样例',
    hint: '',
    weather: { label: '东城区', low: 2, high: 17, sky: '晴', wind: '北风', speed: 1, sample: true },
    cityNames: ['东城区'],
    cityIndex: 0,
    contact: '何广智',
    node: '东城区',
    kpis: [
      { label: '接入单位', value: 144, unit: '家' },
      { label: '受监测信息系统', value: 204, unit: '家' },
      { label: '密码设备/服务', value: 298, unit: '个' },
      { label: '密评完成率', value: 45.5, unit: '%' },
      { label: '信息系统在线率', value: 83.2, unit: '%' },
      { label: '设备在线率', value: 61.5, unit: '%' },
    ],
  },

  onLoad: function () {
    var self = this
    try {
      this._watch = session.watch(function () {
        self.render()
      })
      this.render()
    } catch (error) {}
  },

  onUnload: function () {
    session.unwatch(this._watch)
  },

  refresh: function () {
    var app = getApp()
    if (!app || !app.reload) return
    app.reload().then(function () {
      wx.showToast({
        title: app.globalData.source === 'cloud' ? '已同步云数据库' : '仍在使用本地样例',
        icon: 'none',
      })
    })
  },

  render: function () {
    try {
      this.paint()
    } catch (error) {
      this.setData({
        hint: (error && error.message) || '页面渲染失败',
      })
    }
  },

  paint: function () {
    var data = session.dashboard()
    var app = getApp()
    var hint = (app && app.globalData && app.globalData.cloudError) || ''
    if (!data || !data.cities || !data.cities.length) return
    var row = session.current()
    var metrics = row && row.metrics
    if (!metrics) return
    var names = []
    var i = 0
    for (i = 0; i < data.cities.length; i += 1) names.push(data.cities[i].name)
    this.setData(session.plain({
      hint: hint,
      source: session.sourceText(),
      weather: session.weatherOf(),
      cityNames: names,
      cityIndex: Math.max(names.indexOf(session.city()), 0),
      contact: row.contact,
      node: row.node,
      kpis: [
        { label: '接入单位', value: metrics.orgs, unit: '家' },
        { label: '受监测信息系统', value: metrics.systems, unit: '家' },
        { label: '密码设备/服务', value: metrics.devices, unit: '个' },
        { label: '密评完成率', value: metrics.filingRate, unit: '%' },
        { label: '信息系统在线率', value: metrics.sysOnline, unit: '%' },
        { label: '设备在线率', value: metrics.devOnline, unit: '%' },
      ],
    }))
  },

  onCity: function (event) {
    var name = this.data.cityNames[Number(event.detail.value)]
    session.setCity(name)
  },

  onSource: function () {
    var app = getApp()
    var cloud = app && app.globalData && app.globalData.source === 'cloud'
    wx.showModal({
      title: '数据来源',
      content: cloud
        ? '当前读取的是微信云开发数据库，天气来自 Open-Meteo。'
        : '还没有连上云函数，界面使用本地样例。点右上角刷新可同步云数据库。',
      showCancel: false,
    })
  },

  dial: function (event) {
    wx.showToast({
      title: '正在向' + this.data.contact + '发起' + event.currentTarget.dataset.kind,
      icon: 'none',
    })
  },
})
