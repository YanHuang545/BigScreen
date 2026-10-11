<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  decimals: { type: Number, default: 0 },
  duration: { type: Number, default: 720 },
})

const shown = ref(0)
let frame = 0

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

watch(
  () => Number(props.value) || 0,
  (next) => {
    cancelAnimationFrame(frame)
    if (reduced()) {
      shown.value = next
      return
    }
    const from = shown.value
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / props.duration)
      const ease = 1 - (1 - t) ** 3
      shown.value = from + (next - from) * ease
      if (t < 1) frame = requestAnimationFrame(tick)
      else shown.value = next
    }
    frame = requestAnimationFrame(tick)
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(frame))

const text = computed(() => shown.value.toFixed(props.decimals))
</script>

<template>{{ text }}</template>
