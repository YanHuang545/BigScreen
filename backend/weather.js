import { attachBusinessWeather } from '../shared/weatherDistricts.js'

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

async function onePlace(name, lng, lat) {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('current', 'wind_speed_10m,wind_direction_10m,weather_code')
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code')
  url.searchParams.set('forecast_days', '1')
  url.searchParams.set('wind_speed_unit', 'ms')
  url.searchParams.set('timezone', 'Asia/Shanghai')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${name} 天气接口 ${response.status}`)
  const data = await response.json()
  const code = data.daily?.weather_code?.[0] ?? data.current?.weather_code ?? 0
  const sky = skyOf(code)
  return {
    name,
    low: Math.round(data.daily.temperature_2m_min[0]),
    high: Math.round(data.daily.temperature_2m_max[0]),
    wind: windOf(data.current.wind_direction_10m),
    speed: Math.round(data.current.wind_speed_10m),
    ...sky,
  }
}

let cache = null
let cachedAt = 0

export async function beijingWeather(force = false) {
  if (!force && cache && Date.now() - cachedAt < 10 * 60 * 1000) return cache
  const rows = await Promise.all(
    Object.entries(PLACES).map(([name, [lng, lat]]) => onePlace(name, lng, lat)),
  )
  cache = attachBusinessWeather(Object.fromEntries(rows.map((row) => [row.name, row])))
  cachedAt = Date.now()
  return cache
}
