<script setup>
import { computed, ref } from 'vue'
import PanelFrame from './PanelFrame.vue'
import MonthPager from './MonthPager.vue'
import { useEchart } from '../composables/useEchart'
import { systemOption } from '../charts'
import CountNum from './CountNum.vue'
import { metrics, store, systemPack } from '../store'

const emit = defineEmits(['detail'])
const month = ref('2026-03')
const chartEl = ref(null)
const summary = computed(() => metrics(store.city))
const option = computed(() => {
  const pack = systemPack(store.city, month.value)
  return pack ? systemOption(pack) : {}
})
useEchart(chartEl, option)
</script>

<template>
  <PanelFrame title="信息系统" @detail="emit('detail')">
    <div class="pair">
      <div class="metric">
        <div class="num"><CountNum :value="summary.onlineSys" /><span>个</span></div>
        <div class="lab">在线系统数量</div>
      </div>
      <div class="metric">
        <div class="num"><CountNum :value="summary.offlineSys" /><span>个</span></div>
        <div class="lab">离线系统数量</div>
      </div>
    </div>
    <div class="chart-head">
      <span class="chart-title">信息系统在线趋势</span>
      <MonthPager v-model="month" />
    </div>
    <div class="chart-wrap">
      <div ref="chartEl" class="chart"></div>
    </div>
  </PanelFrame>
</template>
