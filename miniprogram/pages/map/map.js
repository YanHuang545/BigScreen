const session = require('../../utils/session')

const BUSINESS = {
  国贸: true,
  CBD: true,
  金融街: true,
  中关村: true,
  望京: true,
  丽泽商务区: true,
  亦庄: true,
  三里屯: true,
  王府井: true,
  西单: true,
}

Page({
  data: {
    active: '',
    districts: [],
    businesses: [],
    contact: '',
    node: '',
    touring: false,
  },

  onLoad() {
    this._watch = session.watch(() => this.render())
    this.render()
  },

  onUnload() {
    session.unwatch(this._watch)
    this.stopTour()
  },

  render() {
    const data = session.dashboard()
    const names = (data && data.cities ? data.cities : []).map((item) => item.name)
    const row = names.length ? session.current() : { contact: '', node: '' }
    this.setData(session.plain({
      active: session.city(),
      districts: names.filter((name) => !BUSINESS[name]),
      businesses: names.filter((name) => BUSINESS[name]),
      contact: row.contact,
      node: row.node,
    }))
  },

  pick(event) {
    session.setCity(event.currentTarget.dataset.name)
  },

  toggleTour() {
    if (this.data.touring) {
      this.stopTour()
      return
    }
    this.setData({ touring: true })
    this._timer = setInterval(() => {
      const names = session.dashboard().cities.map((item) => item.name)
      const index = names.indexOf(session.city())
      session.setCity(names[(Math.max(index, 0) + 1) % names.length])
    }, 2000)
  },

  stopTour() {
    clearInterval(this._timer)
    this._timer = 0
    if (this.data.touring) this.setData({ touring: false })
  },
})
