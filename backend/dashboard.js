const MONTHS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04']

function num(value) {
  return Number(value)
}

export async function loadDashboard(pool) {
  const [cities] = await pool.query('SELECT name, contact, node_name AS nodeName FROM cities ORDER BY sort_order')
  const [metrics] = await pool.query('SELECT * FROM city_metrics')
  const [filing] = await pool.query('SELECT * FROM filing_points ORDER BY city, month, point_index')
  const [systems] = await pool.query('SELECT * FROM system_points ORDER BY city, month, point_index')
  const [resources] = await pool.query('SELECT * FROM resource_points ORDER BY city, month, point_index')
  const [events] = await pool.query('SELECT id, title, status, reported_at AS time, action FROM security_events ORDER BY sort_order, id')
  const [details] = await pool.query('SELECT id, kind, c1, c2, c3, c4 FROM detail_rows ORDER BY kind, sort_order, id')

  const metricMap = new Map(metrics.map((row) => [row.city, row]))
  const filingMap = {}
  for (const row of filing) {
    filingMap[row.city] ??= {}
    const pack = filingMap[row.city][row.month] ??= { categories: [], 已备案: [], 测评中: [], 已通过: [], 未通过: [], tipIndex: row.month === '2026-03' ? 2 : null }
    pack.categories.push(row.label)
    pack.已备案.push(row.filed)
    pack.测评中.push(row.testing)
    pack.已通过.push(row.passed)
    pack.未通过.push(row.failed)
  }

  const systemMap = {}
  for (const row of systems) {
    systemMap[row.city] ??= {}
    const pack = systemMap[row.city][row.month] ??= { categories: [], 在线: [], 离线: [], 在线率: [] }
    pack.categories.push(row.label)
    pack.在线.push(row.online_count)
    pack.离线.push(row.offline_count)
    pack.在线率.push(row.online_rate)
  }

  const resourceMap = {}
  for (const row of resources) {
    resourceMap[row.city] ??= {}
    const pack = resourceMap[row.city][row.month] ??= { categories: [], 接入数量: [], 在线率: [] }
    pack.categories.push(row.label)
    pack.接入数量.push(row.access_count)
    pack.在线率.push(row.online_rate)
  }

  const detailMap = { filing: [], system: [], resource: [] }
  for (const row of details) {
    detailMap[row.kind]?.push({ id: row.id, cells: [row.c1, row.c2, row.c3, row.c4] })
  }

  return {
    months: MONTHS,
    cities: cities.map((city) => {
      const row = metricMap.get(city.name)
      return {
        name: city.name,
        contact: city.contact,
        node: city.nodeName,
        metrics: {
          filed: row.filed,
          testing: row.testing,
          passed: row.passed,
          failed: row.failed,
          onlineSys: row.online_sys,
          offlineSys: row.offline_sys,
          onlineRes: row.online_res,
          offlineRes: row.offline_res,
          orgs: row.orgs,
          systems: row.systems,
          devices: row.devices,
          filingRate: num(row.filing_rate),
          sysOnline: num(row.sys_online),
          devOnline: num(row.dev_online),
        },
      }
    }),
    filing: filingMap,
    system: systemMap,
    resource: resourceMap,
    events,
    details: detailMap,
  }
}
