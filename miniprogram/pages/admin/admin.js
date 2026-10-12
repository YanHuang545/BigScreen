var session = require('../../utils/session')

var TABS = [
  { id: 'metrics', label: '区域指标' },
  { id: 'events', label: '安全事件' },
  { id: 'series', label: '趋势' },
  { id: 'details', label: '明细' },
]

var METRIC_FIELDS = [
  { key: 'contact', label: '联系人' },
  { key: 'orgs', label: '接入单位' },
  { key: 'systems', label: '受监测系统' },
  { key: 'devices', label: '密码设备' },
  { key: 'filingRate', label: '密评完成率' },
  { key: 'sysOnline', label: '系统在线率' },
  { key: 'devOnline', label: '设备在线率' },
  { key: 'filed', label: '已备案' },
  { key: 'testing', label: '测评中' },
  { key: 'passed', label: '已通过' },
  { key: 'failed', label: '未通过' },
  { key: 'onlineSys', label: '在线系统' },
  { key: 'offlineSys', label: '离线系统' },
  { key: 'onlineRes', label: '在线资源' },
  { key: 'offlineRes', label: '离线资源' },
]

var SERIES_KEYS = {
  filing: [
    { key: 'filed', label: '已备案' },
    { key: 'testing', label: '测评中' },
    { key: 'passed', label: '已通过' },
    { key: 'failed', label: '未通过' },
  ],
  system: [
    { key: 'online', label: '在线' },
    { key: 'offline', label: '离线' },
    { key: 'rate', label: '在线率' },
  ],
  resource: [
    { key: 'access', label: '接入数量' },
    { key: 'rate', label: '在线率' },
  ],
}

var DETAIL_TITLES = {
  filing: ['单位名称', '级别', '状态', '最近更新'],
  system: ['系统名称', '状态', '在线率', '最近心跳'],
  resource: ['设备', '类型', '状态', '所属单位'],
}

function cloudCall(payload) {
  var app = getApp()
  if (!app || app.globalData.source !== 'cloud' || !wx.cloud) {
    return Promise.resolve({ ok: true, local: true })
  }
  return wx.cloud.callFunction({ name: 'crypto', data: payload }).then(function (res) {
    if (!res.result || !res.result.ok) throw new Error((res.result && res.result.message) || '云端保存失败')
    return res.result
  })
}

Page({
  data: {
    hint: '',
    tab: 'metrics',
    tabs: TABS,
    cityNames: [],
    cityIndex: 0,
    months: [],
    monthIndex: 0,
    metricFields: [],
    eventRows: [],
    seriesKind: 'filing',
    seriesKinds: [
      { id: 'filing', label: '密评备案' },
      { id: 'system', label: '信息系统' },
      { id: 'resource', label: '密码资源' },
    ],
    seriesPoints: [],
    detailKind: 'filing',
    detailKinds: [
      { id: 'filing', label: '密评备案' },
      { id: 'system', label: '信息系统' },
      { id: 'resource', label: '密码资源' },
    ],
    detailRows: [],
  },

  onLoad: function () {
    var self = this
    this._watch = session.watch(function () { self.render() })
    this.render()
  },

  onShow: function () {
    this.render()
  },

  onUnload: function () {
    session.unwatch(this._watch)
  },

  render: function () {
    var data = session.dashboard()
    var names = []
    var i = 0
    if (data && data.cities) {
      for (i = 0; i < data.cities.length; i += 1) names.push(data.cities[i].name)
    }
    var cityName = session.city()
    var cityIndex = names.indexOf(cityName)
    if (cityIndex < 0) cityIndex = 0
    var months = (data && data.months) || ['2026-03']
    var month = this.data.months && this.data.months[this.data.monthIndex]
    var monthIndex = months.indexOf(month)
    if (monthIndex < 0) monthIndex = Math.max(months.indexOf('2026-03'), 0)
    var cloud = getApp().globalData.source === 'cloud'
    this.setData(session.plain({
      hint: cloud ? '数据：微信云数据库，保存后总览和趋势会一起更新。' : '数据：本地样例，保存后当前预览立即可见，退出后不会带到云端。',
      cityNames: names,
      cityIndex: cityIndex,
      months: months,
      monthIndex: monthIndex,
      metricFields: this.metricFields(names[cityIndex]),
      eventRows: (data && data.events) || [],
      seriesPoints: this.seriesPoints(names[cityIndex], months[monthIndex]),
      detailRows: this.detailRows(),
    }))
  },

  metricFields: function (cityName) {
    var data = session.dashboard()
    var city = null
    var i = 0
    if (data && data.cities) {
      for (i = 0; i < data.cities.length; i += 1) {
        if (data.cities[i].name === cityName) city = data.cities[i]
      }
    }
    var metrics = (city && city.metrics) || {}
    var fields = []
    for (i = 0; i < METRIC_FIELDS.length; i += 1) {
      var item = METRIC_FIELDS[i]
      var value = item.key === 'contact' ? (city && city.contact) : metrics[item.key]
      fields.push({ key: item.key, label: item.label, value: value === undefined || value === null ? '' : String(value) })
    }
    return fields
  },

  seriesPoints: function (cityName, month) {
    var data = session.dashboard()
    var kind = this.data.seriesKind
    var keys = SERIES_KEYS[kind]
    var pack = data && data[kind] && data[kind][cityName] && data[kind][cityName][month]
    var categories = pack && pack.categories ? pack.categories : []
    var points = []
    var i = 0
    var k = 0
    for (i = 0; i < categories.length; i += 1) {
      var values = []
      for (k = 0; k < keys.length; k += 1) {
        var list = pack[keys[k].key] || []
        values.push({ key: keys[k].key, label: keys[k].label, value: list[i] === undefined ? '' : String(list[i]) })
      }
      points.push({ index: i, label: categories[i], values: values })
    }
    return points
  },

  detailRows: function () {
    var data = session.dashboard()
    var kind = this.data.detailKind
    var titles = DETAIL_TITLES[kind]
    var rows = (data && data.details && data.details[kind]) || []
    var result = []
    var i = 0
    var c = 0
    for (i = 0; i < rows.length; i += 1) {
      var cells = []
      for (c = 0; c < titles.length; c += 1) {
        cells.push({
          index: c,
          title: titles[c],
          key: 'c' + c,
          value: rows[i].cells && rows[i].cells[c] !== undefined ? String(rows[i].cells[c]) : '',
        })
      }
      result.push({ id: rows[i].id, cells: cells })
    }
    return result
  },

  pickTab: function (event) {
    this.setData({ tab: event.currentTarget.dataset.id })
    this.render()
  },

  onCity: function (event) {
    var name = this.data.cityNames[Number(event.detail.value)]
    session.setCity(name)
  },

  onMonth: function (event) {
    this.setData({ monthIndex: Number(event.detail.value) })
    this.render()
  },

  pickSeriesKind: function (event) {
    this.setData({ seriesKind: event.currentTarget.dataset.id })
    this.render()
  },

  pickDetailKind: function (event) {
    this.setData({ detailKind: event.currentTarget.dataset.id })
    this.render()
  },

  onMetricInput: function (event) {
    var key = event.currentTarget.dataset.key
    var fields = this.data.metricFields
    var i = 0
    for (i = 0; i < fields.length; i += 1) {
      if (fields[i].key === key) fields[i].value = event.detail.value
    }
    this.setData({ metricFields: fields })
  },

  onEventInput: function (event) {
    var id = event.currentTarget.dataset.id
    var key = event.currentTarget.dataset.key
    var rows = this.data.eventRows
    var i = 0
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].id === id) rows[i][key] = event.detail.value
    }
    this.setData({ eventRows: rows })
  },

  onSeriesInput: function (event) {
    var index = Number(event.currentTarget.dataset.index)
    var key = event.currentTarget.dataset.key
    var points = this.data.seriesPoints
    if (!points[index]) return
    if (key === 'label') {
      points[index].label = event.detail.value
    } else {
      var values = points[index].values || []
      var i = 0
      for (i = 0; i < values.length; i += 1) {
        if (values[i].key === key) values[i].value = event.detail.value
      }
    }
    this.setData({ seriesPoints: points })
  },

  onDetailInput: function (event) {
    var id = event.currentTarget.dataset.id
    var cellIndex = Number(event.currentTarget.dataset.index)
    var rows = this.data.detailRows
    var i = 0
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].id === id && rows[i].cells[cellIndex]) {
        rows[i].cells[cellIndex].value = event.detail.value
      }
    }
    this.setData({ detailRows: rows })
  },

  metricPayload: function () {
    var fields = this.data.metricFields
    var payload = { city: this.data.cityNames[this.data.cityIndex] }
    var i = 0
    for (i = 0; i < fields.length; i += 1) payload[fields[i].key] = fields[i].value
    return payload
  },

  saveMetric: function () {
    var payload = this.metricPayload()
    session.applyCity(payload.city, payload)
    var self = this
    cloudCall(Object.assign({ action: 'saveMetric' }, payload)).then(function () {
      wx.showToast({ title: '已保存 ' + payload.city, icon: 'none' })
      self.render()
    }).catch(function (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  },

  addEvent: function () {
    var created = session.addEvent({ title: '新事件', status: '未处置', time: '2026/03/20 09:00:00', action: '立即处置' })
    var self = this
    cloudCall({ action: 'addEvent', title: created.title, status: created.status, time: created.time, action: created.action, id: created.id }).then(function () {
      wx.showToast({ title: '已新增事件', icon: 'none' })
      self.render()
    }).catch(function (error) {
      wx.showToast({ title: error.message || '新增失败', icon: 'none' })
    })
  },

  saveEvent: function (event) {
    var id = event.currentTarget.dataset.id
    var rows = this.data.eventRows
    var row = null
    var i = 0
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].id === id) row = rows[i]
    }
    if (!row) return
    session.replaceEvent(row)
    cloudCall({ action: 'saveEvent', id: row.id, title: row.title, status: row.status, time: row.time, action: row.action }).then(function () {
      wx.showToast({ title: '事件已保存', icon: 'none' })
    }).catch(function (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  },

  deleteEvent: function (event) {
    var id = event.currentTarget.dataset.id
    var self = this
    wx.showModal({
      title: '删除事件',
      content: '确定删除这条事件吗？',
      success: function (res) {
        if (!res.confirm) return
        session.removeEvent(id)
        cloudCall({ action: 'deleteEvent', id: id }).then(function () {
          wx.showToast({ title: '事件已删除', icon: 'none' })
          self.render()
        }).catch(function (error) {
          wx.showToast({ title: error.message || '删除失败', icon: 'none' })
        })
      },
    })
  },

  saveSeries: function () {
    var kind = this.data.seriesKind
    var cityName = this.data.cityNames[this.data.cityIndex]
    var month = this.data.months[this.data.monthIndex]
    var points = []
    var i = 0
    var k = 0
    for (i = 0; i < this.data.seriesPoints.length; i += 1) {
      var item = this.data.seriesPoints[i]
      var point = { label: item.label }
      for (k = 0; k < item.values.length; k += 1) point[item.values[k].key] = item.values[k].value
      points.push(point)
    }
    session.applySeries(kind, cityName, month, points)
    var self = this
    cloudCall({ action: 'saveSeries', kind: kind, city: cityName, month: month, points: points }).then(function () {
      wx.showToast({ title: '趋势已保存', icon: 'none' })
      self.render()
    }).catch(function (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  },

  saveDetail: function (event) {
    var id = event.currentTarget.dataset.id
    var rows = this.data.detailRows
    var row = null
    var i = 0
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].id === id) row = rows[i]
    }
    if (!row) return
    var cells = []
    for (i = 0; i < row.cells.length; i += 1) cells.push(row.cells[i].value)
    session.applyDetail(id, cells)
    cloudCall({ action: 'saveDetail', id: id, cells: cells }).then(function () {
      wx.showToast({ title: '明细已保存', icon: 'none' })
    }).catch(function (error) {
      wx.showToast({ title: error.message || '保存失败', icon: 'none' })
    })
  },

  openDetail: function () {
    wx.navigateTo({ url: '/pages/detail/detail' })
  },
})
