import { reactive } from 'vue'

let toastTimer = 0

export const store = reactive({
  city: '东城区',
  toast: '',
  detail: null,
  ready: false,
  error: '',
  months: [],
  cities: [],
  filing: {},
  system: {},
  resource: {},
  events: [],
  details: { filing: [], system: [], resource: [] },
  weatherByCity: {},
})

export function showToast(message) {
  store.toast = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    store.toast = ''
  }, 2400)
}

export function cityRecord(name) {
  return store.cities.find((city) => city.name === name)
}

export function metrics(name) {
  return cityRecord(name)?.metrics
}

export function filingPack(name, month) {
  return store.filing[name]?.[month]
}

export function systemPack(name, month) {
  return store.system[name]?.[month]
}

export function resourcePack(name, month) {
  return store.resource[name]?.[month]
}

export async function loadDashboard() {
  const response = await fetch('/api/dashboard')
  if (!response.ok) throw new Error(`数据接口不可用（${response.status}）`)
  const data = await response.json()
  store.months = data.months
  store.cities = data.cities
  store.filing = data.filing
  store.system = data.system
  store.resource = data.resource
  store.events = data.events
  store.details = data.details
  if (!cityRecord(store.city)) store.city = data.cities[1]?.name || data.cities[0]?.name || '东城区'
  store.ready = true
  store.error = ''
  loadWeather().catch(() => {})
}

export async function loadWeather() {
  const response = await fetch('/api/weather')
  if (!response.ok) return
  store.weatherByCity = await response.json()
}

export async function actEvent(event) {
  let status = event.status
  let action = event.action
  if (event.status === '未处置') {
    status = '处置中'
    action = '再次证明'
  } else if (event.status === '处置中') {
    status = '已处置'
    action = ''
  } else {
    return
  }
  const response = await fetch(`/api/events/${event.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: event.title, status, time: event.time, action }),
  })
  if (!response.ok) {
    showToast('事件状态保存失败')
    return
  }
  event.status = status
  event.action = action
  showToast(status === '处置中' ? `已受理「${event.title}」` : `「${event.title}」已完成处置`)
}
