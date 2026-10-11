<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { actEvent, store } from '../store'

const titles = {
  filing: '密评备案详情',
  system: '信息系统详情',
  event: '安全事件详情',
  resource: '密码资源详情',
}

const columns = {
  filing: ['单位名称', '级别', '状态', '最近更新'],
  system: ['系统名称', '状态', '在线率', '最近心跳'],
  resource: ['设备', '类型', '状态', '所属单位'],
}

const rows = computed(() => (store.detail && store.detail !== 'event' ? store.details[store.detail] || [] : []))

function tone(text) {
  if (['已通过', '在线', '已处置'].includes(text)) return 'ok'
  if (['测评中', '处置中', '已备案'].includes(text)) return 'warn'
  if (['未通过', '离线', '未处置'].includes(text)) return 'bad'
  return ''
}

function close() {
  store.detail = null
}

function onKey(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="store.detail" class="mask" @click.self="close">
    <section class="dialog" role="dialog" aria-modal="true" :aria-label="titles[store.detail]">
      <header>
        <h3>{{ titles[store.detail] }}</h3>
        <button type="button" aria-label="关闭" @click="close">×</button>
      </header>
      <div class="body">
        <table v-if="store.detail === 'event'">
          <thead>
            <tr>
              <th>事件</th>
              <th>状态</th>
              <th>上报时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in store.events" :key="event.id">
              <td>{{ event.title }}</td>
              <td><span class="tag" :class="tone(event.status)">{{ event.status }}</span></td>
              <td>{{ event.time }}</td>
              <td>
                <button
                  v-if="event.action"
                  type="button"
                  class="act"
                  :class="{ orange: event.action !== '立即处置' }"
                  @click="actEvent(event)"
                >
                  {{ event.action }}
                </button>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else>
          <thead>
            <tr>
              <th v-for="column in columns[store.detail]" :key="column">{{ column }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td v-for="(cell, cellIndex) in row.cells" :key="cellIndex">
                <span v-if="tone(cell)" class="tag" :class="tone(cell)">{{ cell }}</span>
                <template v-else>{{ cell }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
