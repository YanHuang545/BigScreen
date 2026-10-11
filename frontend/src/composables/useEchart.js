import { onBeforeUnmount, onMounted, unref, watch } from 'vue'
import * as echarts from 'echarts'

export function useEchart(elRef, optionSource) {
  let chart
  let observer
  let tipped = false

  function apply() {
    if (!chart) return
    const raw = unref(optionSource)
    const tipIndex = raw.__tipIndex
    const option = { ...raw }
    delete option.__tipIndex
    chart.setOption(option, true)
    if (tipIndex != null && !tipped) {
      tipped = true
      requestAnimationFrame(() => {
        chart?.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex: tipIndex })
      })
    }
  }

  onMounted(() => {
    chart = echarts.init(elRef.value, null, { renderer: 'canvas' })
    apply()
    observer = new ResizeObserver(() => chart?.resize())
    observer.observe(elRef.value)
  })

  watch(optionSource, apply)

  onBeforeUnmount(() => {
    observer?.disconnect()
    chart?.dispose()
    chart = null
  })
}
