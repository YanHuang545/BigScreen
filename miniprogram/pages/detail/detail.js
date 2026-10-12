const session = require('../../utils/session')

const TITLES = {
  filing: ['单位名称', '级别', '状态', '最近更新'],
  system: ['系统名称', '状态', '在线率', '最近心跳'],
  resource: ['设备', '类型', '状态', '所属单位'],
}

Page({
  data: {
    kind: 'filing',
    kinds: [
      { id: 'filing', label: '密评备案' },
      { id: 'system', label: '信息系统' },
      { id: 'resource', label: '密码资源' },
    ],
    titles: TITLES.filing,
    rows: [],
  },

  onLoad() {
    this._watch = session.watch(() => this.render())
    this.render()
  },

  onUnload() {
    session.unwatch(this._watch)
  },

  render() {
    const titles = TITLES[this.data.kind]
    const data = session.dashboard()
    const rows = (data && data.details && data.details[this.data.kind]) || []
    this.setData(session.plain({
      titles,
      rows: rows.map((row) => ({
        id: row.id,
        cells: titles.map((title, index) => ({ title, value: row.cells && row.cells[index] })),
      })),
    }))
  },

  pickKind(event) {
    this.data.kind = event.currentTarget.dataset.id
    this.render()
  },
})
