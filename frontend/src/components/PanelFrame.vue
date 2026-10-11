<script setup>
defineProps({
  title: { type: String, required: true },
  scroll: { type: Boolean, default: false },
})
defineEmits(['detail'])
</script>

<template>
  <section class="panel">
    <header class="panel-hd">
      <i class="badge"></i>
      <h2>{{ title }}</h2>
      <button type="button" class="more" @click="$emit('detail')">详情</button>
    </header>
    <div class="panel-bd" :class="{ scroll }">
      <slot />
    </div>
  </section>
</template>
