<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CountNum from './CountNum.vue'
import HubeiMap from './HubeiMap.vue'
import { cityRecord, showToast, store } from '../store'

const open = ref(false)
const touring = ref(false)
const root = ref(null)
let tourTimer = 0
const current = computed(() => cityRecord(store.city))
const stat = computed(() => ({
  ...(current.value?.metrics || {}),
  contact: current.value?.contact,
  node: current.value?.node,
}))
const cityNames = computed(() => store.cities.map((city) => city.name))
const label = computed(() => (store.city === '全市' ? '北京市 / 全市' : `北京市 / ${store.city}`))

const kpis = computed(() => [
  { key: 'org', value: stat.value.orgs || 0, decimals: 0, unit: '家', label: '接入单位' },
  { key: 'sys', value: stat.value.systems || 0, decimals: 0, unit: '家', label: '受监测信息系统' },
  { key: 'dev', value: stat.value.devices || 0, decimals: 0, unit: '个', label: '密码设备/服务' },
  { key: 'shield', value: stat.value.filingRate || 0, decimals: 1, unit: '%', label: '密评完成率' },
  { key: 'screen', value: stat.value.sysOnline || 0, decimals: 1, unit: '%', label: '信息系统在线率' },
  { key: 'grid', value: stat.value.devOnline || 0, decimals: 1, unit: '%', label: '密码设备/服务在线率' },
])

function pick(city) {
  store.city = city
  open.value = false
}

function stepCity() {
  const list = cityNames.value
  if (!list.length) return
  const index = list.indexOf(store.city)
  store.city = list[(Math.max(index, 0) + 1) % list.length]
  open.value = false
}

function toggleTour() {
  touring.value = !touring.value
  clearInterval(tourTimer)
  tourTimer = 0
  if (touring.value) tourTimer = setInterval(stepCity, 3000)
}

function onDoc(event) {
  if (!root.value?.contains(event.target)) open.value = false
}

function dial(kind) {
  showToast(`正在向${stat.value.contact}发起${kind}`)
}

onMounted(() => document.addEventListener('pointerdown', onDoc))
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDoc)
  clearInterval(tourTimer)
})
</script>

<template>
  <section class="center">
    <div ref="root" class="picker-row">
      <button type="button" class="picker" @click="open = !open">
        <span>{{ label }}</span>
        <i class="caret"></i>
      </button>
      <button
        type="button"
        class="tour-btn"
        :class="{ on: touring }"
        :aria-pressed="touring"
        @click="toggleTour"
      >
        <span class="tour-orbit" aria-hidden="true"></span>
        <span class="tour-core">
          <i class="tour-icon" :class="touring ? 'is-pause' : 'is-play'"></i>
          {{ touring ? '停止滚动' : '滚动' }}
        </span>
      </button>
      <ul v-if="open" class="picker-list">
        <li>
          <button type="button" :class="{ on: store.city === '全市' }" @click="pick('全市')">北京市 / 全市</button>
        </li>
        <li v-for="city in store.cities.filter((item) => item.name !== '全市')" :key="city.name">
          <button type="button" :class="{ on: store.city === city.name }" @click="pick(city.name)">北京市 / {{ city.name }}</button>
        </li>
      </ul>
    </div>

    <div class="kpis">
      <div v-for="item in kpis" :key="item.key" class="kpi">
        <div class="icon-ring">
          <svg v-if="item.key === 'org'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 27V13h8v14M14 27V7h12v20" />
            <path d="M9 17h2M9 21h2M18 12h2M22 12h2M18 16h2M22 16h2M18 20h2M22 20h2" />
          </svg>
          <svg v-else-if="item.key === 'sys'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="4" y="6" width="24" height="16" rx="2" />
            <path d="M8 14h4l2-4 3 8 2-4h5" />
            <path d="M12 26h8M16 22v4" />
          </svg>
          <svg v-else-if="item.key === 'dev'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="7" y="4" width="18" height="6" rx="1" />
            <rect x="7" y="13" width="18" height="6" rx="1" />
            <rect x="7" y="22" width="18" height="6" rx="1" />
            <circle cx="11" cy="7" r="1" fill="currentColor" />
            <circle cx="11" cy="16" r="1" fill="currentColor" />
            <circle cx="11" cy="25" r="1" fill="currentColor" />
          </svg>
          <svg v-else-if="item.key === 'shield'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M16 4l10 4v8c0 6.2-4.4 10.2-10 12-5.6-1.8-10-5.8-10-12V8l10-4z" />
            <path d="M12 16l3 3 6-6" />
          </svg>
          <svg v-else-if="item.key === 'screen'" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="5" y="6" width="22" height="15" rx="2" />
            <path d="M12 26h8M16 21v5" />
            <path d="M10 13h4M18 13h4M10 17h12" />
          </svg>
          <svg v-else viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="5" y="5" width="9" height="9" />
            <rect x="18" y="5" width="9" height="9" />
            <rect x="5" y="18" width="9" height="9" />
            <rect x="18" y="18" width="9" height="9" />
          </svg>
        </div>
        <div>
          <div class="kpi-num"><CountNum :value="item.value" :decimals="item.decimals" /><span>{{ item.unit }}</span></div>
          <div class="kpi-label">{{ item.label }}</div>
        </div>
      </div>
    </div>

    <div class="map-area">
      <HubeiMap :active="store.city" @select="pick" />
      <footer class="center-foot">
        <span class="meta">当前下级节点：<b>{{ stat.node }}</b></span>
        <span class="meta">紧急联系人：<b>{{ stat.contact }}</b></span>
        <div class="calls">
          <button type="button" class="call" @click="dial('语音通话')">
            <span class="bubble green">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
                <path d="M7 3.5h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5l1.5-2 4 1.5v3c0 .8-.7 1.5-1.5 1.5C10.5 18.5 5.5 13.5 5.5 5c0-.8.7-1.5 1.5-1.5z" stroke-linejoin="round" />
              </svg>
            </span>
            语音通话
          </button>
          <button type="button" class="call" @click="dial('视频通话')">
            <span class="bubble blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8">
                <rect x="3" y="6" width="12" height="12" rx="2" />
                <path d="M15 10.5l6-3v9l-6-3v-3z" stroke-linejoin="round" />
              </svg>
            </span>
            视频通话
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>
