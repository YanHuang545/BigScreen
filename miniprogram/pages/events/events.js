const session = require('../../utils/session')

function nextState(event) {
  if (event.status === '未处置') return { status: '处置中', action: '再次证明' }
  if (event.status === '处置中') return { status: '已处置', action: '' }
  return null
}

Page({
  data: { events: [], sourceHint: '' },

  onLoad() {
    this._watch = session.watch(() => this.render())
    this.render()
  },

  onUnload() {
    session.unwatch(this._watch)
  },

  render() {
    const cloud = getApp().globalData.source === 'cloud'
    this.setData(session.plain({
      sourceHint: cloud
        ? '数据：微信云数据库，处置结果会保存。'
        : '数据：本地样例，处置结果只保留到退出小程序。',
      events: (session.dashboard() && session.dashboard().events) || [],
    }))
  },

  act(event) {
    const id = event.currentTarget.dataset.id
    const current = session.dashboard().events.find((item) => item.id === id)
    const next = nextState(current)
    if (!next) return
    const apply = () => {
      session.replaceEvent({ id, ...next })
      wx.showToast({
        title: next.status === '处置中' ? `已受理「${current.title}」` : `「${current.title}」已完成处置`,
        icon: 'none',
      })
    }
    if (getApp().globalData.source !== 'cloud') {
      apply()
      return
    }
    wx.cloud.callFunction({ name: 'crypto', data: { action: 'actEvent', id } })
      .then((res) => {
        if (!res.result || !res.result.ok) throw new Error(res.result && res.result.message)
        session.replaceEvent(res.result.event)
        wx.showToast({ title: '已写入云数据库', icon: 'none' })
      })
      .catch((error) => {
        wx.showToast({ title: error.message || '云端保存失败', icon: 'none' })
      })
  },
})
