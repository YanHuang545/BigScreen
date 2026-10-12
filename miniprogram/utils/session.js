var BUSINESS_ADMIN = {
  国贸: '朝阳区',
  CBD: '朝阳区',
  金融街: '西城区',
  中关村: '海淀区',
  望京: '朝阳区',
  丽泽商务区: '丰台区',
  亦庄: '大兴区',
  三里屯: '朝阳区',
  王府井: '东城区',
  西单: '西城区',
}

function app() {
  return getApp()
}

function dashboard() {
  var current = app()
  if (!current || !current.globalData) return null
  return current.globalData.dashboard
}

function city() {
  var current = app()
  if (!current || !current.globalData || !current.globalData.city) return '东城区'
  return current.globalData.city
}

function setCity(name) {
  var current = app()
  if (!current || !current.globalData) return
  current.globalData.city = name
  try {
    wx.setStorageSync('city', name)
  } catch (error) {}
  current.notify()
}

function current() {
  var data = dashboard()
  if (!data || !data.cities || !data.cities.length) return null
  var name = city()
  var index = 0
  for (index = 0; index < data.cities.length; index += 1) {
    if (data.cities[index].name === name) return data.cities[index]
  }
  return data.cities[0]
}

function adminOf(name) {
  if (name === '全市') return '全市'
  return BUSINESS_ADMIN[name] || name
}

function sampleWeather(name) {
  var hash = 0
  var i = 0
  var text = name || '东城区'
  for (i = 0; i < text.length; i += 1) {
    hash = (hash * 33 + text.charCodeAt(i)) >>> 0
  }
  var low = 2 + (hash % 12)
  var skies = ['晴', '多云', '阴', '小雨']
  var winds = ['北风', '东北风', '东风', '南风', '西南风', '西北风']
  var sky = skies[hash % skies.length]
  return {
    name: text,
    low: low,
    high: low + 6 + (hash % 7),
    sky: sky,
    wind: winds[hash % winds.length],
    speed: 1 + (hash % 6),
    sunny: sky === '晴' || sky === '多云',
    sample: true,
  }
}

function weatherOf(name) {
  var selected = name || city()
  var admin = adminOf(selected)
  var currentApp = app()
  var map = currentApp && currentApp.globalData && currentApp.globalData.weather ? currentApp.globalData.weather : {}
  var row = map[selected] || map[admin] || sampleWeather(admin)
  var label = selected
  if (selected === '全市') label = '北京市'
  else if (admin !== selected) label = selected + '（' + admin + '）'
  return {
    name: row.name || selected,
    low: row.low || 0,
    high: row.high || 0,
    sky: row.sky || '',
    wind: row.wind || '',
    speed: row.speed || 0,
    sunny: !!row.sunny,
    sample: !!row.sample,
    label: label,
  }
}

function sourceText() {
  var current = app()
  if (current && current.globalData && current.globalData.source === 'cloud') return '微信云数据库'
  return '本地样例'
}

function plain(value) {
  if (typeof value === 'number') return isFinite(value) ? value : 0
  if (value === undefined || value === null) return ''
  if (Object.prototype.toString.call(value) === '[object Array]') {
    var list = []
    var i = 0
    for (i = 0; i < value.length; i += 1) list.push(plain(value[i]))
    return list
  }
  if (typeof value === 'object') {
    var next = {}
    var key = ''
    for (key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) next[key] = plain(value[key])
    }
    return next
  }
  return value
}

function watch(listener) {
  var current = app()
  if (!current || !current.globalData) return listener
  if (!current.globalData.listeners) current.globalData.listeners = []
  current.globalData.listeners.push(listener)
  return listener
}

function unwatch(listener) {
  var current = app()
  if (!current || !current.globalData || !current.globalData.listeners) return
  var list = current.globalData.listeners
  var index = list.indexOf(listener)
  if (index >= 0) list.splice(index, 1)
}

function num(value, fallback) {
  var n = Number(value)
  if (isFinite(n)) return n
  return fallback
}

function applyCity(name, values) {
  var data = dashboard()
  if (!data || !data.cities) return null
  var i = 0
  for (i = 0; i < data.cities.length; i += 1) {
    if (data.cities[i].name !== name) continue
    if (values.contact !== undefined) data.cities[i].contact = values.contact
    var metrics = data.cities[i].metrics || {}
    var keys = ['orgs', 'systems', 'devices', 'filingRate', 'sysOnline', 'devOnline', 'filed', 'testing', 'passed', 'failed', 'onlineSys', 'offlineSys', 'onlineRes', 'offlineRes']
    var k = 0
    for (k = 0; k < keys.length; k += 1) {
      if (values[keys[k]] !== undefined && values[keys[k]] !== '') {
        metrics[keys[k]] = num(values[keys[k]], metrics[keys[k]])
      }
    }
    data.cities[i].metrics = metrics
    app().notify()
    return data.cities[i]
  }
  return null
}

function addEvent(row) {
  var data = dashboard()
  if (!data) return null
  if (!data.events) data.events = []
  var next = 1
  var i = 0
  for (i = 0; i < data.events.length; i += 1) {
    var idNum = Number(data.events[i].id) || 0
    if (idNum >= next) next = idNum + 1
  }
  var created = {
    id: String(next),
    title: row.title || '新事件',
    status: row.status || '未处置',
    time: row.time || '2026/03/20 09:00:00',
    action: row.action || '立即处置',
  }
  data.events.push(created)
  app().notify()
  return created
}

function removeEvent(id) {
  var data = dashboard()
  if (!data || !data.events) return
  var next = []
  var i = 0
  for (i = 0; i < data.events.length; i += 1) {
    if (data.events[i].id !== id) next.push(data.events[i])
  }
  data.events = next
  app().notify()
}

function applySeries(kind, cityName, month, points) {
  var data = dashboard()
  if (!data || !data[kind] || !data[kind][cityName]) return null
  var keys = kind === 'filing'
    ? ['filed', 'testing', 'passed', 'failed']
    : kind === 'system' ? ['online', 'offline', 'rate'] : ['access', 'rate']
  var pack = { categories: [] }
  var k = 0
  for (k = 0; k < keys.length; k += 1) pack[keys[k]] = []
  var p = 0
  for (p = 0; p < points.length; p += 1) {
    pack.categories.push(points[p].label)
    for (k = 0; k < keys.length; k += 1) {
      pack[keys[k]].push(num(points[p][keys[k]], 0))
    }
  }
  data[kind][cityName][month] = pack
  app().notify()
  return pack
}

function applyDetail(id, cells) {
  var data = dashboard()
  if (!data || !data.details) return
  var kinds = ['filing', 'system', 'resource']
  var k = 0
  var i = 0
  for (k = 0; k < kinds.length; k += 1) {
    var rows = data.details[kinds[k]] || []
    for (i = 0; i < rows.length; i += 1) {
      if (rows[i].id === id) {
        rows[i].cells = cells
        app().notify()
        return rows[i]
      }
    }
  }
  return null
}

function replaceEvent(next) {
  var data = dashboard()
  if (!data || !data.events) return
  var index = 0
  for (index = 0; index < data.events.length; index += 1) {
    if (data.events[index].id === next.id) {
      data.events[index].status = next.status
      data.events[index].action = next.action
      if (next.title) data.events[index].title = next.title
      if (next.time) data.events[index].time = next.time
      break
    }
  }
  var current = app()
  if (current) current.notify()
}

module.exports = {
  dashboard: dashboard,
  city: city,
  setCity: setCity,
  current: current,
  weatherOf: weatherOf,
  sourceText: sourceText,
  plain: plain,
  watch: watch,
  unwatch: unwatch,
  replaceEvent: replaceEvent,
  applyCity: applyCity,
  addEvent: addEvent,
  removeEvent: removeEvent,
  applySeries: applySeries,
  applyDetail: applyDetail,
}
