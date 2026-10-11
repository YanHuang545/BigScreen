<script setup>
import { computed, ref } from 'vue'
import PanelFrame from './PanelFrame.vue'
import MonthPager from './MonthPager.vue'
import { useEchart } from '../composables/useEchart'
import { filingOption } from '../charts'
import CountNum from './CountNum.vue'
import { filingPack, metrics, store } from '../store'

const emit = defineEmits(['detail'])
const month = ref('2026-03')
const chartEl = ref(null)
const summary = computed(() => metrics(store.city))
const option = computed(() => {
  const pack = filingPack(store.city, month.value)
  return pack ? filingOption(pack) : {}
})
useEchart(chartEl, option)

const cards = computed(() => [
  { label: '已备案', value: summary.value.filed, tone: '' },
  { label: '测评中', value: summary.value.testing, tone: '' },
  { label: '已通过', value: summary.value.passed, tone: 'green' },
  { label: '未通过', value: summary.value.failed, tone: 'orange' },
])
</script>

<template>
  <PanelFrame title="密评备案" @detail="emit('detail')">
    <div class="quad">
      <div v-for="card in cards" :key="card.label" class="metric" :class="card.tone">
        <div class="num"><CountNum :value="card.value" /><span>个</span></div>
        <div class="lab">{{ card.label }}</div>
      </div>
    </div>
    <div class="chart-head">
      <span class="chart-title">密评备案统计<span class="unit-inline">单位：个/月</span></span>
      <MonthPager v-model="month" />
    </div>
    <div class="chart-wrap">
      <div ref="chartEl" class="chart"></div>
    </div>
  </PanelFrame>
</template>
