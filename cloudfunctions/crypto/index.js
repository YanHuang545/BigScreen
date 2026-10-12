const https = require('https')
const cloud = require('wx-server-sdk')
const seed = require('./seed.json')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const PLACES = {
  全市: [116.407, 39.904],
  东城区: [116.416, 39.928],
  西城区: [116.366, 39.912],
  朝阳区: [116.486, 39.948],
  海淀区: [116.298, 39.959],
  丰台区: [116.287, 39.858],
  石景山区: [116.223, 39.906],
  通州区: [116.656, 39.902],
  顺义区: [116.654, 40.13],
  昌平区: [116.231, 40.221],
  大兴区: [116.341, 39.727],
  房山区: [116.143, 39.749],
  门头沟区: [116.102, 39.94],
  怀柔区: [116.632, 40.316],
  密云区: [116.843, 40.377],
  平谷区: [117.121, 40.141],
  延庆区: [115.975, 40.457],
}

const BUSINESS_ADMIN = {
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

const WINDS = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']

function skyOf(code) {
  if (code === 0 || code === 1) return { sky: '晴', sunny: true }
  if (code <= 3) return { sky: '多云', sunny: true }
  if (code <= 48) return { sky: '阴', sunny: false }
  if (code <= 67) return { sky: '小雨', sunny: false }
  if (code <= 77) return { sky: '雪', sunny: false }
  if (code <= 82) return { sky: '阵雨', sunny: false }
  return { sky: '雷阵雨', sunny: false }
}

function windOf(degree) {
  const index = Math.round((((degree % 360) + 360) % 360) / 45) % 8
  return WINDS[index]
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = ''
      res.on('data', (chunk) => { raw += chunk })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`天气接口 ${res.statusCode}`))
          return
        }
        resolve(JSON.parse(raw))
      })
    }).on('error', reject)
  })
}

async function onePlace(name, lng, lat) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=wind_speed_10m,wind_direction_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=1&wind_speed_unit=ms&timezone=Asia%2FShanghai`
  const data = await getJson(url)
  const dailyCodes = data.daily && data.daily.weather_code
  const currentCode = data.current && data.current.weather_code
  const code = (dailyCodes && dailyCodes.length ? dailyCodes[0] : currentCode) || 0
  return {
    name,
    low: Math.round(data.daily.temperature_2m_min[0]),
    high: Math.round(data.daily.temperature_2m_max[0]),
    wind: windOf(data.current.wind_direction_10m),
    speed: Math.round(data.current.wind_speed_10m),
    sample: false,
    ...skyOf(code),
  }
}

function attachBusiness(adminWeather) {
  const next = { ...adminWeather }
  for (const [biz, admin] of Object.entries(BUSINESS_ADMIN)) {
    const src = adminWeather[admin]
    if (!src) continue
    next[biz] = { ...src, name: biz, admin }
  }
  return next
}

async function hasCities() {
  try {
    const counted = await db.collection('cities').count()
    return counted.total > 0
  } catch (error) {
    return false
  }
}

async function seedAll() {
  for (let index = 0; index < seed.cities.length; index += 1) {
    const city = seed.cities[index]
    await db.collection('cities').doc(`city-${index}`).set({
      data: {
        name: city.name,
        contact: city.contact,
        node: city.node,
        sortOrder: index,
        metrics: city.metrics,
      },
    })
    await db.collection('series').doc(`series-${index}`).set({
      data: {
        name: city.name,
        filing: seed.filing[city.name],
        system: seed.system[city.name],
        resource: seed.resource[city.name],
      },
    })
  }
  for (const event of seed.events) {
    await db.collection('events').doc(`event-${event.id}`).set({
      data: {
        title: event.title,
        status: event.status,
        time: event.time,
        action: event.action,
        sortOrder: Number(event.id),
      },
    })
  }
  for (const kind of ['filing', 'system', 'resource']) {
    for (const row of seed.details[kind]) {
      await db.collection('details').doc(row.id).set({
        data: { kind, cells: row.cells, sortOrder: Number(row.id.split('-')[1]) },
      })
    }
  }
  return { ok: true, seeded: true }
}

async function loadDashboard() {
  const cities = (await db.collection('cities').limit(100).get()).data
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const series = (await db.collection('series').limit(100).get()).data
  const events = (await db.collection('events').limit(100).get()).data
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const details = (await db.collection('details').limit(100).get()).data
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const filing = {}
  const system = {}
  const resource = {}
  for (const row of series) {
    filing[row.name] = row.filing
    system[row.name] = row.system
    resource[row.name] = row.resource
  }
  const detailMap = { filing: [], system: [], resource: [] }
  for (const row of details) {
    if (detailMap[row.kind]) detailMap[row.kind].push({ id: row._id, cells: row.cells })
  }
  return {
    months: seed.months,
    cities: cities.map((city) => ({
      name: city.name,
      contact: city.contact,
      node: city.node,
      metrics: city.metrics,
    })),
    filing,
    system,
    resource,
    events: events.map((event) => ({
      id: String(event.sortOrder),
      title: event.title,
      status: event.status,
      time: event.time,
      action: event.action,
    })),
    details: detailMap,
  }
}

function toNumber(value, fallback) {
  var n = Number(value)
  if (isFinite(n)) return n
  return fallback
}

function findByName(rows, name) {
  var i = 0
  for (i = 0; i < rows.length; i += 1) {
    if (rows[i].name === name) return rows[i]
  }
  return null
}

async function saveMetric(event) {
  var name = String(event.city || '')
  var cities = (await db.collection('cities').limit(100).get()).data
  var city = findByName(cities, name)
  if (!city) return { ok: false, message: '未找到该区域' }
  var metrics = city.metrics || {}
  var keys = ['orgs', 'systems', 'devices', 'filingRate', 'sysOnline', 'devOnline', 'filed', 'testing', 'passed', 'failed', 'onlineSys', 'offlineSys', 'onlineRes', 'offlineRes']
  var i = 0
  for (i = 0; i < keys.length; i += 1) {
    if (event[keys[i]] !== undefined && event[keys[i]] !== '') {
      metrics[keys[i]] = toNumber(event[keys[i]], metrics[keys[i]])
    }
  }
  var contact = event.contact !== undefined ? String(event.contact) : city.contact
  await db.collection('cities').doc(city._id).update({
    data: { contact: contact, metrics: metrics },
  })
  return { ok: true, city: { name: city.name, contact: contact, node: city.node, metrics: metrics } }
}

async function saveEvent(event) {
  var id = String(event.id || '')
  var title = String(event.title || '')
  var status = String(event.status || '未处置')
  var time = String(event.time || '')
  var action = event.action === undefined ? '' : String(event.action)
  await db.collection('events').doc('event-' + id).update({
    data: { title: title, status: status, time: time, action: action },
  })
  return { ok: true, event: { id: id, title: title, status: status, time: time, action: action } }
}

async function addEvent(event) {
  var events = (await db.collection('events').limit(100).get()).data
  var next = 1
  var i = 0
  for (i = 0; i < events.length; i += 1) {
    var sort = Number(events[i].sortOrder) || 0
    if (sort >= next) next = sort + 1
  }
  var row = {
    title: event.title || '新事件',
    status: event.status || '未处置',
    time: event.time || '2026/03/20 09:00:00',
    action: event.action || '立即处置',
    sortOrder: next,
  }
  await db.collection('events').doc('event-' + next).set({ data: row })
  return { ok: true, event: { id: String(next), title: row.title, status: row.status, time: row.time, action: row.action } }
}

async function deleteEvent(event) {
  var id = String(event.id || '')
  await db.collection('events').doc('event-' + id).remove()
  return { ok: true, id: id }
}

async function saveSeries(event) {
  var kind = event.kind
  var cityName = event.city
  var month = event.month
  var points = event.points || []
  if (kind !== 'filing' && kind !== 'system' && kind !== 'resource') {
    return { ok: false, message: '未知趋势类型' }
  }
  var series = (await db.collection('series').limit(100).get()).data
  var row = findByName(series, cityName)
  if (!row) return { ok: false, message: '未找到该区域趋势' }
  var keys = kind === 'filing'
    ? ['filed', 'testing', 'passed', 'failed']
    : kind === 'system' ? ['online', 'offline', 'rate'] : ['access', 'rate']
  var pack = { categories: [] }
  var k = 0
  for (k = 0; k < keys.length; k += 1) pack[keys[k]] = []
  var p = 0
  for (p = 0; p < points.length; p += 1) {
    pack.categories.push(String(points[p].label || ''))
    for (k = 0; k < keys.length; k += 1) {
      pack[keys[k]].push(toNumber(points[p][keys[k]], 0))
    }
  }
  var nextKind = row[kind] || {}
  nextKind[month] = pack
  var patch = {}
  patch[kind] = nextKind
  await db.collection('series').doc(row._id).update({ data: patch })
  return { ok: true, kind: kind, city: cityName, month: month, pack: pack }
}

async function saveDetail(event) {
  var id = String(event.id || '')
  var cells = event.cells || ['', '', '', '']
  await db.collection('details').doc(id).update({ data: { cells: cells } })
  return { ok: true, id: id, cells: cells }
}

async function actEvent(event) {
  const id = String(event.id || '')
  const found = await db.collection('events').doc(`event-${id}`).get()
  const row = found.data
  let status = row.status
  let action = row.action
  if (status === '未处置') {
    status = '处置中'
    action = '再次证明'
  } else if (status === '处置中') {
    status = '已处置'
    action = ''
  } else {
    return { ok: true, event: { id, title: row.title, status, time: row.time, action } }
  }
  await db.collection('events').doc(`event-${id}`).update({ data: { status, action } })
  return { ok: true, event: { id, title: row.title, status, time: row.time, action } }
}

async function weather() {
  const cached = await db.collection('weather_cache').doc('latest').get().catch(() => null)
  if (cached && cached.data && Date.now() - cached.data.at < 10 * 60 * 1000) {
    return { ok: true, data: cached.data.rows }
  }
  const rows = await Promise.all(
    Object.entries(PLACES).map(([name, [lng, lat]]) => onePlace(name, lng, lat)),
  )
  const data = attachBusiness(Object.fromEntries(rows.map((row) => [row.name, row])))
  await db.collection('weather_cache').doc('latest').set({ data: { at: Date.now(), rows: data } })
  return { ok: true, data }
}

exports.main = async (event) => {
  const action = event.action || 'dashboard'
  try {
    if (action === 'seed') return await seedAll()
    if (action === 'weather') return await weather()
    if (action === 'actEvent') return await actEvent(event)
    if (action === 'saveMetric') return await saveMetric(event)
    if (action === 'saveEvent') return await saveEvent(event)
    if (action === 'addEvent') return await addEvent(event)
    if (action === 'deleteEvent') return await deleteEvent(event)
    if (action === 'saveSeries') return await saveSeries(event)
    if (action === 'saveDetail') return await saveDetail(event)
    if (!(await hasCities())) {
      try {
        await seedAll()
      } catch (error) {
        return { ok: true, data: seed, warning: error.message || '写入云数据库失败，先返回样例' }
      }
    }
    const data = await loadDashboard()
    if (!data.cities.length) return { ok: true, data: seed }
    return { ok: true, data }
  } catch (error) {
    return { ok: false, message: error.message || '云函数失败' }
  }
}
