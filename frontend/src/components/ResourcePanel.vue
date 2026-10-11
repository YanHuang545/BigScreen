<script setup>
import { computed, ref } from 'vue'
import PanelFrame from './PanelFrame.vue'
import MonthPager from './MonthPager.vue'
import { useEchart } from '../composables/useEchart'
import { resourceOption } from '../charts'
import CountNum from './CountNum.vue'
import { metrics, resourcePack, store } from '../store'

defineEmits(['detail'])
const month = ref('2026-03')
const chartEl = ref(null)
const summary = computed(() => metrics(store.city))
const option = computed(() => {
  const pack = resourcePack(store.city, month.value)
  return pack ? resourceOption(pack) : {}
})
useEchart(chartEl, option)
</script>

<template>
  <PanelFrame title="密码资源" @detail="$emit('detail')">
    <div class="pair">
      <div class="metric">
        <div class="num"><CountNum :value="summary.onlineRes" /><span>个</span></div>
        <div class="lab">密码资源在线数量</div>
      </div>
      <div class="metric">
        <div class="num"><CountNum :value="summary.offlineRes" /><span>个</span></div>
        <div class="lab">密码资源离线数量</div>
      </div>
    </div>
    <div class="chart-head">
      <span class="chart-title">密码资源在线趋势</span>
      <MonthPager v-model="month" />
    </div>
    <div class="chart-wrap">
      <div ref="chartEl" class="chart"></div>
    </div>
  </PanelFrame>
</template>
