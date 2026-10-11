<script setup>
import PanelFrame from './PanelFrame.vue'
import { actEvent, store } from '../store'

defineEmits(['detail'])

function tone(status) {
  return status === '已处置' ? '' : 'warn'
}
</script>

<template>
  <PanelFrame title="安全事件" scroll @detail="$emit('detail')">
    <article
      v-for="event in store.events"
      :key="event.id"
      class="event"
      :class="{ urgent: event.status === '未处置' }"
    >
      <i class="bullet" :class="tone(event.status)"></i>
      <div class="title">事件：{{ event.title }}</div>
      <button
        v-if="event.action"
        type="button"
        class="act"
        :class="{ orange: event.action !== '立即处置' }"
        @click="actEvent(event)"
      >
        {{ event.action }}
      </button>
      <div class="meta">
        <span>状态：{{ event.status }}</span>
        <span>上报时间：{{ event.time }}</span>
      </div>
    </article>
  </PanelFrame>
</template>
