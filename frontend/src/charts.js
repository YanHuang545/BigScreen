import * as echarts from 'echarts'

const FONT = 'Microsoft YaHei, PingFang SC, sans-serif'

export function axisMax(values, step, floor) {
  const peak = Math.max(0, ...values)
  return Math.max(floor, Math.ceil(peak / step) * step)
}

function axisScale(values, step, floor) {
  const max = axisMax(values, step, floor)
  if (max <= floor * 1.25) return { max, interval: step }
  const interval = Math.max(step, Math.ceil(max / 4 / step) * step)
  return { max: interval * 4, interval }
}

export function tooltipOption() {
  return {
    trigger: 'axis',
    confine: true,
    backgroundColor: 'rgba(14, 12, 28, 0.94)',
    borderColor: '#d4a45a',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: '#f4efe6', fontSize: 12, fontFamily: FONT },
    extraCssText: 'box-shadow: 0 0 16px rgba(160,110,40,.32); border-radius: 2px;',
    axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(196,154,92,0.08)' } },
    formatter(params) {
      const rows = params
        .map((item) => {
          const value = String(item.seriesName).includes('率') ? `${item.value}%` : item.value
          return `<div style="display:flex;justify-content:space-between;gap:18px;line-height:1.75"><span>${item.marker}${item.seriesName}</span><b>${value}</b></div>`
        })
        .join('')
      return `<div style="min-width:132px"><div style="margin-bottom:2px">${params[0].axisValue}</div>${rows}</div>`
    },
  }
}

function categoryAxis(data, extra = {}) {
  return {
    type: 'category',
    data,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: 'rgba(196,168,120,0.35)' } },
    axisLabel: { color: '#c5d0e2', fontSize: 11, interval: 0, fontFamily: FONT, ...extra },
  }
}

function motion() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    animation: !reduced,
    animationDuration: 900,
    animationDurationUpdate: 650,
    animationEasing: 'cubicOut',
  }
}

function valueAxis(partial) {
  return {
    type: 'value',
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#a9c0dc', fontSize: 11, fontFamily: FONT },
    splitLine: { lineStyle: { color: 'rgba(168,150,120,0.16)' } },
    nameTextStyle: { color: '#a9c0dc', fontSize: 11, fontFamily: FONT },
    ...partial,
  }
}

export function filingOption(pack) {
  const values = [...pack.已备案, ...pack.测评中, ...pack.已通过, ...pack.未通过]
  return {
    __tipIndex: pack.tipIndex,
    ...motion(),
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT },
    tooltip: tooltipOption(),
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 8,
      textStyle: { color: '#e7e0d4', fontSize: 12 },
      data: ['已备案', '测评中', '已通过', '未通过'],
    },
    grid: { left: 42, right: 10, top: 34, bottom: 26 },
    xAxis: categoryAxis(pack.categories),
    yAxis: valueAxis(axisScale(values, 50, 200)),
    series: [
      ['已备案', '#6e5cc8', pack.已备案],
      ['测评中', '#8ec9e6', pack.测评中],
      ['已通过', '#3dce9a', pack.已通过],
      ['未通过', '#e8a23a', pack.未通过],
    ].map(([name, color, data]) => ({
      name,
      type: 'bar',
      data,
      barWidth: 8,
      barGap: '30%',
      itemStyle: { color, borderRadius: [2, 2, 0, 0] },
    })),
  }
}

export function systemOption(pack) {
  return {
    ...motion(),
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT },
    tooltip: tooltipOption(),
    legend: {
      top: 0,
      right: 4,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#e7e0d4', fontSize: 12 },
      data: ['在线', '离线', '在线率'],
    },
    grid: { left: 62, right: 54, top: 36, bottom: 26 },
    xAxis: categoryAxis(pack.categories),
    yAxis: [
      valueAxis({
        name: '在线/离线数',
        nameLocation: 'middle',
        nameGap: 40,
        nameRotate: 90,
        ...axisScale(pack.在线.concat(pack.离线), 50, 200),
      }),
      valueAxis({
        name: '在线率',
        nameLocation: 'middle',
        nameGap: 42,
        nameRotate: -90,
        position: 'right',
        max: 100,
        interval: 25,
        axisLabel: { color: '#a9c0dc', fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false },
      }),
    ],
    series: [
      {
        name: '在线',
        type: 'bar',
        data: pack.在线,
        barWidth: 9,
        itemStyle: { color: '#6e5cc8', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '离线',
        type: 'bar',
        data: pack.离线,
        barWidth: 9,
        itemStyle: { color: '#e0b15a', borderRadius: [2, 2, 0, 0] },
      },
      {
        name: '在线率',
        type: 'line',
        yAxisIndex: 1,
        data: pack.在线率,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        z: 3,
        lineStyle: { width: 2, color: '#e8b86a', shadowBlur: 8, shadowColor: 'rgba(232,184,106,0.5)' },
        itemStyle: { color: '#fff6e4', borderColor: '#e8b86a', borderWidth: 2 },
      },
    ],
  }
}

export function resourceOption(pack) {
  return {
    ...motion(),
    backgroundColor: 'transparent',
    textStyle: { fontFamily: FONT },
    tooltip: tooltipOption(),
    legend: {
      top: 0,
      right: 4,
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: '#e7e0d4', fontSize: 12 },
      data: ['接入数量', '在线率'],
    },
    grid: { left: 58, right: 48, top: 34, bottom: 46 },
    xAxis: categoryAxis(pack.categories, {
      fontSize: 10,
      rotate: 24,
      margin: 14,
    }),
    yAxis: [
      valueAxis({
        name: '接入数量',
        nameLocation: 'middle',
        nameGap: 40,
        nameRotate: 90,
        ...axisScale(pack.接入数量, 50, 200),
      }),
      valueAxis({
        name: '在线率',
        nameLocation: 'middle',
        nameGap: 42,
        nameRotate: -90,
        position: 'right',
        max: 100,
        interval: 25,
        axisLabel: { color: '#a9c0dc', fontSize: 11, formatter: '{value}%' },
        splitLine: { show: false },
      }),
    ],
    series: [
      {
        name: '接入数量',
        type: 'bar',
        data: pack.接入数量,
        barWidth: 16,
        itemStyle: {
          borderRadius: [3, 3, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#cbb8f0' },
            { offset: 0.4, color: '#6a56b8' },
            { offset: 1, color: '#241848' },
          ]),
        },
      },
      {
        name: '在线率',
        type: 'line',
        yAxisIndex: 1,
        data: pack.在线率,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        z: 3,
        lineStyle: { width: 2, color: '#e8b86a', shadowBlur: 8, shadowColor: 'rgba(232,184,106,0.5)' },
        itemStyle: { color: '#fff6e4', borderColor: '#e8b86a', borderWidth: 2 },
      },
    ],
  }
}
