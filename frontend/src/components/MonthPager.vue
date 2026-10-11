<script setup>
import { store } from '../store'

const month = defineModel({ type: String, default: '2026-03' })

function step(delta) {
  const months = store.months.length ? store.months : ['2026-03']
  const index = Math.max(0, months.indexOf(month.value))
  const next = (index + delta + months.length) % months.length
  month.value = months[next]
}
</script>

<template>
  <div class="pager">
    <button type="button" aria-label="上一月" @click="step(-1)">‹</button>
    <span>{{ month }}</span>
    <button type="button" aria-label="下一月" @click="step(1)">›</button>
  </div>
</template>
