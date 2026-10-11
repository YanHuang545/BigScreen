<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import HeaderBar from './components/HeaderBar.vue'
import FilingPanel from './components/FilingPanel.vue'
import SystemPanel from './components/SystemPanel.vue'
import EventPanel from './components/EventPanel.vue'
import ResourcePanel from './components/ResourcePanel.vue'
import CenterStage from './components/CenterStage.vue'
import DetailModal from './components/DetailModal.vue'
import { loadDashboard, store } from './store'

const scale = ref(1)
const stageStyle = computed(() => ({ transform: `scale(${scale.value})` }))

function fit() {
  scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080)
}

onMounted(() => {
  fit()
  window.addEventListener('resize', fit)
  loadDashboard().catch((error) => {
    store.error = error.message
  })
})
onBeforeUnmount(() => window.removeEventListener('resize', fit))
</script>

<template>
  <div class="viewport">
    <div class="stage" :style="stageStyle">
      <HeaderBar />
      <div v-if="store.error" class="load-state">{{ store.error }}。请先启动 backend。</div>
      <div v-else-if="!store.ready" class="load-state">正在从数据库加载数据…</div>
      <main v-else class="board">
        <div class="col">
          <FilingPanel @detail="store.detail = 'filing'" />
          <SystemPanel @detail="store.detail = 'system'" />
        </div>
        <CenterStage />
        <div class="col">
          <EventPanel @detail="store.detail = 'event'" />
          <ResourcePanel @detail="store.detail = 'resource'" />
        </div>
      </main>
      <DetailModal />
      <div v-if="store.toast" class="toast">{{ store.toast }}</div>
    </div>
  </div>
</template>
