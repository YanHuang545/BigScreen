<script setup>
import { computed, ref } from 'vue'
import { cities, mapPath, mapView } from '../data/beijingMap'
import { metrics } from '../store'

const props = defineProps({
  active: { type: String, default: '东城区' },
})
const emit = defineEmits(['select'])

const root = ref(null)
const hover = ref(null)

const tune = {
  延庆区: { dx: 0, dy: -16, anchor: 'middle' },
  怀柔区: { dx: 0, dy: -16, anchor: 'middle' },
  密云区: { dx: 8, dy: -14, anchor: 'start' },
  昌平区: { dx: -6, dy: -16, anchor: 'middle' },
  顺义区: { dx: 10, dy: -14, anchor: 'start' },
  平谷区: { dx: 8, dy: 4, anchor: 'start' },
  门头沟区: { dx: -8, dy: -8, anchor: 'end' },
  海淀区: { dx: -4, dy: -20, anchor: 'middle' },
  朝阳区: { dx: 18, dy: -10, anchor: 'start' },
  石景山区: { dx: -22, dy: 12, anchor: 'end' },
  东城区: { dx: 16, dy: -18, anchor: 'start' },
  西城区: { dx: -18, dy: 6, anchor: 'end' },
  通州区: { dx: 14, dy: 8, anchor: 'start' },
  丰台区: { dx: -10, dy: 20, anchor: 'middle' },
  大兴区: { dx: 8, dy: 16, anchor: 'start' },
  房山区: { dx: -8, dy: 16, anchor: 'middle' },
  国贸: { dx: 0, dy: 18, anchor: 'middle' },
  CBD: { dx: 59, dy: -11, anchor: 'start' },
  金融街: { dx: -42, dy: -42, anchor: 'end' },
  中关村: { dx: 11, dy: -34, anchor: 'start' },
  望京: { dx: 12, dy: -14, anchor: 'start' },
  丽泽商务区: { dx: 76, dy: 43, anchor: 'start' },
  亦庄: { dx: 28, dy: -3, anchor: 'start' },
  三里屯: { dx: 25, dy: 8, anchor: 'start' },
  王府井: { dx: -32, dy: 39, anchor: 'start' },
  西单: { dx: -33, dy: -24, anchor: 'middle' },
}

const hub = computed(() => {
  const name = props.active && props.active !== '全市' ? props.active : '东城区'
  return cities.find((city) => city.name === name) || cities.find((city) => city.name === '东城区')
})

const placed = computed(() => cities.map((city) => ({ ...city, ...(tune[city.name] || {}) })))
const labels = computed(() => placed.value.filter((city) => !city.hide || city.name === props.active))

const arcs = computed(() => {
  const target = hub.value
  return placed.value
    .filter((city) => city.name !== target.name && !city.hide)
    .map((city, index) => {
      const mx = (city.x + target.x) / 2
      const my = (city.y + target.y) / 2
      const dist = Math.hypot(target.x - city.x, target.y - city.y)
      const lift = Math.min(130, 24 + dist * 0.32)
      return {
        name: city.name,
        delay: `${(index % 7) * 0.22}s`,
        d: `M ${city.x} ${city.y} Q ${mx} ${my - lift} ${target.x} ${target.y}`,
      }
    })
})

const rays = Array.from({ length: 14 }, (_, index) => {
  const angle = (index / 14) * Math.PI * 2
  const length = index % 2 === 0 ? 20 : 12
  return { x: Math.cos(angle) * length, y: Math.sin(angle) * length }
})

function sideColor(layer) {
  const depth = (15 - layer) / 14
  const r = Math.round(22 + (1 - depth) * 28)
  const g = Math.round(16 + (1 - depth) * 14)
  const b = Math.round(52 + (1 - depth) * 42)
  return `rgb(${r},${g},${b})`
}

function showTip(city, event) {
  const box = root.value.getBoundingClientRect()
  const x = ((event.clientX - box.left) * root.value.clientWidth) / box.width
  const y = ((event.clientY - box.top) * root.value.clientHeight) / box.height
  const stat = metrics(city.name)
  hover.value = {
    name: city.name,
    x: Math.min(x + 14, root.value.clientWidth - 160),
    y: Math.max(8, y - 8),
    orgs: stat.orgs,
    systems: stat.systems,
    rate: stat.sysOnline,
  }
}
</script>

<template>
  <div ref="root" class="map-root">
    <svg :viewBox="`0 0 ${mapView.w} ${mapView.h + 36}`" role="img" aria-label="北京市密码安全态势">
      <defs>
        <linearGradient id="topFace" x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stop-color="#4a3d86" />
          <stop offset="48%" stop-color="#2a215c" />
          <stop offset="100%" stop-color="#14102e" />
        </linearGradient>
        <radialGradient id="sheen" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.2" />
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.04" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2a2160" stop-opacity="0.55" />
          <stop offset="62%" stop-color="#161230" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#080612" stop-opacity="0" />
        </radialGradient>
        <filter id="edgeGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.4" flood-color="#e8d2a4" flood-opacity="0.75" />
        </filter>
        <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.8" flood-color="#ffb15a" flood-opacity="0.95" />
        </filter>
        <clipPath id="provinceClip">
          <path :d="mapPath" />
        </clipPath>
      </defs>

      <ellipse :cx="mapView.w / 2" :cy="mapView.h - 18" rx="292" ry="64" fill="url(#disc)" />
      <ellipse :cx="mapView.w / 2" :cy="mapView.h - 18" rx="250" ry="48" fill="none" stroke="rgba(168,148,210,0.28)" />
      <ellipse :cx="mapView.w / 2" :cy="mapView.h - 18" rx="180" ry="30" fill="none" stroke="rgba(212,176,110,0.22)" />

      <path
        v-for="layer in 14"
        :key="layer"
        :d="mapPath"
        fill-rule="evenodd"
        :fill="sideColor(layer)"
        :transform="`translate(${(15 - layer) * 0.28} ${(15 - layer) * 1.05})`"
      />
      <path :d="mapPath" fill="url(#topFace)" fill-rule="evenodd" />
      <rect
        :width="mapView.w"
        :height="mapView.h"
        fill="url(#sheen)"
        clip-path="url(#provinceClip)"
      />
      <path :d="mapPath" fill="none" stroke="#efe6d4" stroke-width="1.5" stroke-linejoin="round" filter="url(#edgeGlow)" />

      <g v-for="arc in arcs" :key="arc.name" filter="url(#arcGlow)">
        <path
          :d="arc.d"
          fill="none"
          stroke="#ffb03a"
          stroke-width="1.4"
          stroke-linecap="round"
          opacity="0.38"
        />
        <path
          class="arc-flow"
          :d="arc.d"
          fill="none"
          stroke="#ffd089"
          stroke-width="2"
          stroke-linecap="round"
          :style="{ animationDelay: arc.delay }"
        />
      </g>

      <g
        v-for="city in placed"
        :key="`${city.name}-dot`"
        class="city"
        @click="emit('select', city.name)"
        @mouseenter="showTip(city, $event)"
        @mousemove="showTip(city, $event)"
        @mouseleave="hover = null"
      >
        <circle
          v-if="city.name !== hub.name"
          class="city-pulse"
          :cx="city.x"
          :cy="city.y"
          r="7"
          fill="none"
          stroke="#9ec4e4"
          stroke-width="1"
        />
        <circle
          v-if="city.name !== hub.name"
          :cx="city.x"
          :cy="city.y"
          r="3.2"
          fill="#f7f3ea"
          stroke="#9ec4e4"
          stroke-width="1"
        />
        <circle v-else :cx="city.x" :cy="city.y" r="18" fill="transparent" />
      </g>

      <g :transform="`translate(${hub.x} ${hub.y})`" filter="url(#arcGlow)" style="pointer-events: none">
        <circle class="hub-ring" r="16" fill="none" stroke="#ffc56a" stroke-width="1.4" />
        <circle class="hub-ring delay" r="16" fill="none" stroke="#ffe1a8" stroke-width="1.2" />
        <circle r="11" fill="rgba(255,150,40,0.35)" />
        <line
          v-for="(ray, index) in rays"
          :key="index"
          x1="0"
          y1="0"
          :x2="ray.x"
          :y2="ray.y"
          stroke="#ffd59a"
          stroke-width="1.2"
          stroke-linecap="round"
        />
        <circle r="4.5" fill="#fff6df" />
        <circle r="2.2" fill="#fff" />
      </g>

      <text
        v-for="city in labels"
        :key="`${city.name}-label`"
        class="city-label"
        :class="{ active: city.name === active || (active === '全市' && city.name === '东城区') }"
        :x="city.x + city.dx"
        :y="city.y + city.dy"
        :text-anchor="city.anchor"
        @click="emit('select', city.name)"
      >
        {{ city.name }}
      </text>
    </svg>

    <div v-if="hover" class="map-tip" :style="{ left: `${hover.x}px`, top: `${hover.y}px` }">
      <b>{{ hover.name }}</b>
      <span>接入单位 {{ hover.orgs }} 家</span>
      <span>受监测系统 {{ hover.systems }} 家</span>
      <span>系统在线率 {{ hover.rate.toFixed(1) }}%</span>
    </div>
  </div>
</template>
