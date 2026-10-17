const session = require('../../utils/session')

const KINDS = {
  filing: {
    label: '密评备案',
    unit: '个',
    summary: [
      { key: 'filed', label: '已备案' },
      { key: 'testing', label: '测评中' },
      { key: 'passed', label: '已通过' },
      { key: 'failed', label: '未通过' },
    ],
    series: [
      { key: 'filed', label: '已备案' },
      { key: 'testing', label: '测评中' },
      { key: 'passed', label: '已通过' },
      { key: 'failed', label: '未通过' },
    ],
  },
  system: {
    label: '信息系统',
    unit: '个',
    summary: [
      { key: 'onlineSys', label: '在线系统' },
      { key: 'offlineSys', label: '离线系统' },
    ],
    series: [
      { key: 'online', label: '在线' },
      { key: 'offline', label: '离线' },
      { key: 'rate', label: '在线率', unit: '%' },
    ],
  },
  resource: {
    label: '密码资源',
    unit: '个',
    summary: [
      { key: 'onlineRes', label: '在线资源' },
      { key: 'offlineRes', label: '离线资源' },
    ],
    series: [
      { key: 'access', label: '接入数量' },
      { key: 'rate', label: '在线率', unit: '%' },
    ],
  },
}

Page({
  data: {
    city: '',
    kind: 'filing',
    kinds: [
      { id: 'filing', label: '密评备案' },
      { id: 'system', label: '信息系统' },
      { id: 'resource', label: '密码资源' },
    ],
    months: [],
    month: '2026-03',
    seriesList: [],
    seriesKey: 'filed',
    summary: [],
    bars: [],
    unit: '个',
  },

  onLoad() {
    this._watch = session.watch(() => this.render())
    this.render()
  },

  onUnload() {
    session.unwatch(this._watch)
  },

  render() {
    const data = session.dashboard()
    const spec = KINDS[this.data.kind]
    const months = data && data.months && data.months.length ? data.months : ['2026-03']
    const month = months.indexOf(this.data.month) >= 0 ? this.data.month : months[0]
    const seriesKey = spec.series.some((item) => item.key === this.data.seriesKey)
      ? this.data.seriesKey
      : spec.series[0].key
    const kindPack = data && data[this.data.kind]
    const cityPack = kindPack && kindPack[session.city()]
    const pack = cityPack && cityPack[month]
    const values = pack ? pack[seriesKey] : []
    let max = 1
    if (values && values.length) {
      for (let i = 0; i < values.length; i += 1) {
        if (values[i] > max) max = values[i]
      }
    }
    const chosen = spec.series.find((item) => item.key === seriesKey)
    const current = data && data.cities && data.cities.length ? session.current() : null
    const metrics = (current && current.metrics) || {}
    this.setData(session.plain({
      city: session.city(),
      kind: this.data.kind,
      months,
      month,
      seriesList: spec.series,
      seriesKey,
      unit: chosen.unit || spec.unit,
      summary: spec.summary.map((item) => ({ label: item.label, value: metrics[item.key] })),
      bars: (pack ? pack.categories : []).map((label, index) => ({
        label,
        value: values[index],
        pct: Math.max(4, Math.round((values[index] / max) * 100)),
      })),
    }))
  },

  pickKind(event) {
    const kind = event.currentTarget.dataset.id
    if (!KINDS[kind] || kind === this.data.kind) return
    this.setData({
      kind,
      seriesKey: KINDS[kind].series[0].key,
    })
    this.render()
  },

  pickMonth(event) {
    this.data.month = event.currentTarget.dataset.month
    this.render()
  },

  pickSeries(event) {
    this.data.seriesKey = event.currentTarget.dataset.key
    this.render()
  },
})
