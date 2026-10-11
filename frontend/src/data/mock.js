export const MONTHS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04']

export const CITY_ORDER = [
  '东城区',
  '西城区',
  '朝阳区',
  '丰台区',
  '石景山区',
  '海淀区',
  '门头沟区',
  '房山区',
  '通州区',
  '顺义区',
  '昌平区',
  '大兴区',
  '怀柔区',
  '平谷区',
  '密云区',
  '延庆区',
  '国贸',
  'CBD',
  '金融街',
  '中关村',
  '望京',
  '丽泽商务区',
  '亦庄',
  '三里屯',
  '王府井',
  '西单',
]

const CONTACTS = {
  全市: '市值班室',
  东城区: '何广智',
  西城区: '周宁',
  朝阳区: '陈凯',
  丰台区: '刘洋',
  石景山区: '赵敏',
  海淀区: '孙浩',
  门头沟区: '吴婷',
  房山区: '郑磊',
  通州区: '冯静',
  顺义区: '马超',
  昌平区: '胡悦',
  大兴区: '高峰',
  怀柔区: '谭林',
  平谷区: '彭薇',
  密云区: '蒋成',
  延庆区: '曹颖',
  国贸: '林晓',
  CBD: '苏晴',
  金融街: '沈博',
  中关村: '韩雪',
  望京: '许航',
  丽泽商务区: '罗佳',
  亦庄: '邓凯',
  三里屯: '叶琳',
  王府井: '宋哲',
  西单: '顾宁',
}

const BIZ_SCALE = {
  国贸: 0.26,
  CBD: 0.24,
  金融街: 0.22,
  中关村: 0.3,
  望京: 0.16,
  丽泽商务区: 0.14,
  亦庄: 0.2,
  三里屯: 0.11,
  王府井: 0.13,
  西单: 0.15,
}

const WUHAN = {
  filed: 100,
  testing: 65,
  passed: 91,
  failed: 22,
  onlineSys: 302,
  offlineSys: 109,
  onlineRes: 1302,
  offlineRes: 161,
  orgs: 144,
  systems: 204,
  devices: 298,
  filingRate: 45.5,
  sysOnline: 83.2,
  devOnline: 61.5,
}

const FILING_BASE = {
  已备案: [78, 52, 15, 98, 70, 86, 74],
  测评中: [132, 176, 10, 118, 48, 92, 80],
  已通过: [36, 58, 23, 72, 66, 108, 164],
  未通过: [24, 34, 8, 40, 26, 38, 56],
}

const SYSTEM_BASE = {
  在线: [118, 146, 102, 138, 162, 156, 148, 132, 112, 96, 78],
  离线: [42, 68, 86, 58, 52, 48, 64, 88, 46, 36, 28],
  在线率: [74, 81, 66, 82, 88, 93, 86, 73, 84, 71, 64],
}

const RESOURCE_BASE = {
  categories: ['密码机', '签名验签', 'VPN', '服务器密码机', '时间戳', '安全网关', '云密码机'],
  接入数量: [96, 148, 112, 176, 104, 158, 128],
  在线率: [72, 86, 63, 91, 74, 88, 68],
}

function hash(text) {
  let h = 2166136261
  for (const ch of text) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function scaleOf(city) {
  if (city === '东城区') return 1
  if (city === '全市') return 4.6
  if (BIZ_SCALE[city] != null) return BIZ_SCALE[city]
  return 0.22 + (hash(city) % 48) / 100
}

function varyCount(list, city, month, salt) {
  if (city === '东城区' && month === '2026-03') return list.slice()
  const scale = scaleOf(city)
  const seed = hash(`${city}|${month}|${salt}`)
  return list.map((n, i) => Math.max(1, Math.round(n * scale * (0.78 + ((seed + i * 13) % 36) / 100))))
}

function varyRate(list, city, month, salt) {
  if (city === '东城区' && month === '2026-03') return list.slice()
  const seed = hash(`${city}|${month}|${salt}`)
  return list.map((n, i) => Math.max(12, Math.min(98, Math.round(n + ((seed + i * 7) % 15) - 7))))
}

function filingLabels(month) {
  const m = Number(month.slice(5))
  const names = []
  for (let i = 5; i >= 1; i -= 1) {
    const mm = ((m - i - 1 + 12) % 12) + 1
    names.push(`${mm}月`)
  }
  names.push('当月', `${((m + 1 - 1) % 12) + 1}月预测`)
  if (month === '2026-03') return ['8月', '9月', '10月', '11月', '12月', '当月', '4月预测']
  return names
}

export function filingPack(city, month) {
  return {
    categories: filingLabels(month),
    已备案: varyCount(FILING_BASE.已备案, city, month, 'filed'),
    测评中: varyCount(FILING_BASE.测评中, city, month, 'testing'),
    已通过: varyCount(FILING_BASE.已通过, city, month, 'passed'),
    未通过: varyCount(FILING_BASE.未通过, city, month, 'failed'),
    tipIndex: month === '2026-03' ? 2 : null,
  }
}

export function systemPack(city, month) {
  const m = Number(month.slice(5))
  const categories = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `${m}.${d}`)
  categories.push(month === '2026-03' ? '今天' : '月末', '预测')
  return {
    categories,
    在线: varyCount(SYSTEM_BASE.在线, city, month, 'online'),
    离线: varyCount(SYSTEM_BASE.离线, city, month, 'offline'),
    在线率: varyRate(SYSTEM_BASE.在线率, city, month, 'sys-rate'),
  }
}

export function resourcePack(city, month) {
  return {
    categories: RESOURCE_BASE.categories,
    接入数量: varyCount(RESOURCE_BASE.接入数量, city, month, 'access'),
    在线率: varyRate(RESOURCE_BASE.在线率, city, month, 'res-rate'),
  }
}

function clampRate(n) {
  return Math.max(18, Math.min(96, Math.round(n * 10) / 10))
}

export function metrics(city) {
  if (city === '东城区') return { ...WUHAN, contact: CONTACTS.东城区, node: '东城区' }
  const s = scaleOf(city)
  const seed = hash(city)
  const rateShift = (seed % 21) - 8
  return {
    filed: Math.max(1, Math.round(WUHAN.filed * s)),
    testing: Math.max(1, Math.round(WUHAN.testing * s)),
    passed: Math.max(1, Math.round(WUHAN.passed * s)),
    failed: Math.max(1, Math.round(WUHAN.failed * s)),
    onlineSys: Math.max(1, Math.round(WUHAN.onlineSys * s)),
    offlineSys: Math.max(1, Math.round(WUHAN.offlineSys * s)),
    onlineRes: Math.max(1, Math.round(WUHAN.onlineRes * s)),
    offlineRes: Math.max(1, Math.round(WUHAN.offlineRes * s)),
    orgs: Math.max(1, Math.round(WUHAN.orgs * s)),
    systems: Math.max(1, Math.round(WUHAN.systems * s)),
    devices: Math.max(1, Math.round(WUHAN.devices * s)),
    filingRate: clampRate(WUHAN.filingRate + rateShift),
    sysOnline: clampRate(WUHAN.sysOnline + ((seed >> 3) % 11) - 5),
    devOnline: clampRate(WUHAN.devOnline + ((seed >> 6) % 13) - 6),
    contact: CONTACTS[city] || '值班员',
    node: city === '全市' ? '北京市' : city,
  }
}

export const BASE_EVENTS = [
  { title: '服务中断', status: '未处置', time: '2025/01/23 12:15:53', action: '立即处置' },
  { title: '证书过期', status: '处置中', time: '2025/01/23 12:15:53', action: '再次证明' },
  { title: '使用弱算法', status: '已处置', time: '2025/01/23 12:15:53', action: '' },
  { title: '未使用国密算法', status: '已处置', time: '2025/01/23 12:15:53', action: '' },
  { title: '未使用强身份认证登录', status: '已处置', time: '2025/01/23 12:15:53', action: '' },
  { title: '密钥未按期更新', status: '已处置', time: '2025/01/23 12:16:08', action: '' },
]

export function detailRows(kind, city) {
  const m = metrics(city)
  if (kind === 'filing') {
    return [
      ['省政务服务平台', '三级', '已通过', '2026-03-02'],
      ['市医保结算系统', '三级', '测评中', '2026-03-06'],
      ['交通运行监测平台', '二级', '已备案', '2026-02-18'],
      ['公积金业务系统', '二级', '已通过', '2026-01-29'],
      ['水务调度系统', '二级', '未通过', '2026-03-11'],
      ['公共资源交易平台', '三级', '测评中', '2026-03-15'],
    ]
  }
  if (kind === 'system') {
    return [
      ['密码服务管理平台', '在线', '98%', '2026-03-20 09:12'],
      ['电子签章系统', '在线', '96%', '2026-03-20 09:11'],
      ['统一身份认证', '在线', '91%', '2026-03-20 09:08'],
      ['容灾备份系统', '离线', '0%', '2026-03-19 22:41'],
      ['日志审计系统', '在线', '88%', '2026-03-20 09:06'],
      ['密钥管理系统', '在线', `${m.sysOnline.toFixed(1)}%`, '2026-03-20 09:02'],
    ]
  }
  if (kind === 'resource') {
    return [
      ['密码机-01', '密码机', '在线', '东城区政务云'],
      ['签名验签-03', '签名验签', '在线', '市医保中心'],
      ['VPN-12', 'VPN', '离线', '交通指挥中心'],
      ['时间戳-02', '时间戳', '在线', '公共资源交易中心'],
      ['安全网关-07', '安全网关', '在线', '公积金中心'],
      ['云密码机-04', '云密码机', '在线', '省密码服务平台'],
    ]
  }
  return []
}
