<script setup>
import { computed } from 'vue'
import { store } from '../store'
import { adminDistrictOf } from '../../../shared/weatherDistricts.js'

const weather = computed(() => {
  const selected = store.city === '全市' ? '全市' : store.city
  const admin = adminDistrictOf(selected)
  const row = store.weatherByCity[selected] || store.weatherByCity[admin]
  const city =
    selected === '全市' ? '北京市' : admin !== selected ? `${selected}（${admin}）` : selected
  if (!row) return { city, low: '--', high: '--', sky: '获取中', wind: '', speed: '--', sunny: true }
  return { city, low: row.low, high: row.high, sky: row.sky, wind: row.wind, speed: row.speed, sunny: row.sunny }
})
</script>

<template>
  <header class="header">
    <svg class="header-bg" viewBox="0 0 1920 84" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="titleFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#3a2c72" />
          <stop offset="0.48" stop-color="#241848" />
          <stop offset="1" stop-color="#120e28" />
        </linearGradient>
        <linearGradient id="titleEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#e8c98a" stop-opacity="0.15" />
          <stop offset="0.5" stop-color="#fff6e4" />
          <stop offset="1" stop-color="#e8c98a" stop-opacity="0.15" />
        </linearGradient>
        <filter id="titleGlow" x="-8%" y="-50%" width="116%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#c8923a" flood-opacity="0.72" />
        </filter>
      </defs>
      <polyline points="46,40 168,40 206,58 470,58" fill="none" stroke="#c9a15a" stroke-width="1.6" />
      <polyline points="70,28 150,28 178,40" fill="none" stroke="#e8c98a" stroke-width="1.2" opacity="0.7" />
      <polyline points="1874,40 1752,40 1714,58 1450,58" fill="none" stroke="#c9a15a" stroke-width="1.6" />
      <polyline points="1850,28 1770,28 1742,40" fill="none" stroke="#e8c98a" stroke-width="1.2" opacity="0.7" />
      <polygon points="590,8 1330,8 1404,76 516,76" fill="url(#titleFill)" stroke="url(#titleEdge)" stroke-width="1.4" filter="url(#titleGlow)" />
      <polyline points="560,76 1360,76" fill="none" stroke="#f0d7a0" stroke-width="1.4" opacity="0.85" />
    </svg>
    <h1>商用密码运行安全指挥中心</h1>
    <div class="weather">
      <span class="city">{{ weather.city }}</span>
      <svg v-if="weather.sunny" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" fill="#ffc14d" />
        <g stroke="#ffc14d" stroke-width="1.6" stroke-linecap="round">
          <path d="M12 2.2v2.2M12 19.6v2.2M2.2 12h2.2M19.6 12h2.2" />
          <path d="M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
        </g>
      </svg>
      <svg v-else viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          d="M8.5 17h8.2a3.8 3.8 0 0 0 .2-7.6 5 5 0 0 0-9.6 1.4A3.2 3.2 0 0 0 8.5 17z"
          fill="#c5d4ea"
          stroke="#e4eef8"
          stroke-width="1.2"
        />
      </svg>
      <span>{{ weather.low }}~{{ weather.high }}℃</span>
      <span>{{ weather.sky }}</span>
      <span>{{ weather.wind }}</span>
      <span>风速{{ weather.speed }}m/s</span>
    </div>
  </header>
</template>
