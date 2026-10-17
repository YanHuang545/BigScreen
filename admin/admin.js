const app = document.querySelector('#app')
const message = document.querySelector('#message')
let data = null
let tab = 'metrics'
let seriesCity = '东城区'
let seriesMonth = '2026-03'
let detailKind = 'filing'

function toast(text) {
  message.textContent = text
  message.style.display = 'block'
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { message.style.display = 'none' }, 2200)
}

async function request(url, options) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `请求失败 ${response.status}`)
  }
  return response.json()
}

async function load() {
  data = await request('/api/dashboard')
  render()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function cityOptions(selected) {
  return data.cities.map((city) => `<option value="${escapeHtml(city.name)}" ${city.name === selected ? 'selected' : ''}>${escapeHtml(city.name)}</option>`).join('')
}

function field(name, value) {
  return `<input data-field="${escapeHtml(name)}" value="${escapeHtml(value)}" />`
}

function renderMetrics() {
  const rows = data.cities.map((city) => `
    <tr data-city="${escapeHtml(city.name)}">
      <td>${escapeHtml(city.name)}</td>
      <td>${field('contact', city.contact)}</td>
      <td>${field('orgs', city.metrics.orgs)}</td>
      <td>${field('systems', city.metrics.systems)}</td>
      <td>${field('devices', city.metrics.devices)}</td>
      <td>${field('filingRate', city.metrics.filingRate)}</td>
      <td>${field('sysOnline', city.metrics.sysOnline)}</td>
      <td>${field('devOnline', city.metrics.devOnline)}</td>
      <td>${field('filed', city.metrics.filed)}</td>
      <td>${field('testing', city.metrics.testing)}</td>
      <td>${field('passed', city.metrics.passed)}</td>
      <td>${field('failed', city.metrics.failed)}</td>
      <td>${field('onlineSys', city.metrics.onlineSys)}</td>
      <td>${field('offlineSys', city.metrics.offlineSys)}</td>
      <td>${field('onlineRes', city.metrics.onlineRes)}</td>
      <td>${field('offlineRes', city.metrics.offlineRes)}</td>
      <td><button type="button" data-save-metric="${escapeHtml(city.name)}">保存</button></td>
    </tr>
  `).join('')
  app.innerHTML = `
    <section class="panel">
      <table>
        <thead>
          <tr>
            <th>地市</th><th>联系人</th><th>接入单位</th><th>受监测系统</th><th>密码设备</th>
            <th>密评完成率</th><th>系统在线率</th><th>设备在线率</th>
            <th>已备案</th><th>测评中</th><th>已通过</th><th>未通过</th>
            <th>在线系统</th><th>离线系统</th><th>在线资源</th><th>离线资源</th><th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`
}

function renderEvents() {
  const rows = data.events.map((event) => `
    <tr data-id="${escapeHtml(event.id)}">
      <td>${field('title', event.title)}</td>
      <td>${field('status', event.status)}</td>
      <td>${field('time', event.time)}</td>
      <td>${field('action', event.action)}</td>
      <td>
        <button type="button" data-save-event="${escapeHtml(event.id)}">保存</button>
        <button type="button" class="danger" data-delete-event="${escapeHtml(event.id)}">删除</button>
      </td>
    </tr>
  `).join('')
  app.innerHTML = `
    <section class="panel">
      <div class="toolbar"><button type="button" id="add-event">新增事件</button></div>
      <table>
        <thead><tr><th>事件</th><th>状态</th><th>上报时间</th><th>操作按钮</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`
}

function seriesPoints(kind) {
  if (kind === 'filing') {
    const pack = data.filing[seriesCity]?.[seriesMonth]
    return (pack?.categories || []).map((label, index) => ({
      label,
      filed: pack.已备案[index],
      testing: pack.测评中[index],
      passed: pack.已通过[index],
      failed: pack.未通过[index],
    }))
  }
  if (kind === 'system') {
    const pack = data.system[seriesCity]?.[seriesMonth]
    return (pack?.categories || []).map((label, index) => ({
      label,
      online: pack.在线[index],
      offline: pack.离线[index],
      rate: pack.在线率[index],
    }))
  }
  const pack = data.resource[seriesCity]?.[seriesMonth]
  return (pack?.categories || []).map((label, index) => ({
    label,
    access: pack.接入数量[index],
    rate: pack.在线率[index],
  }))
}

function renderSeries(kind) {
  const points = seriesPoints(kind)
  const head = {
    filing: '<th>已备案</th><th>测评中</th><th>已通过</th><th>未通过</th>',
    system: '<th>在线</th><th>离线</th><th>在线率</th>',
    resource: '<th>接入数量</th><th>在线率</th>',
  }[kind]
  const rows = points.map((point, index) => {
    const cells = Object.entries(point).filter(([key]) => key !== 'label').map(([key, value]) => `<td>${field(key, value)}</td>`).join('')
    return `<tr data-index="${index}"><td>${field('label', point.label)}</td>${cells}</tr>`
  }).join('')
  app.innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <label>地市 <select id="series-city">${cityOptions(seriesCity)}</select></label>
        <label>月份 <select id="series-month">${data.months.map((month) => `<option ${month === seriesMonth ? 'selected' : ''}>${escapeHtml(month)}</option>`).join('')}</select></label>
        <button type="button" id="save-series" data-kind="${escapeHtml(kind)}">保存这组趋势</button>
      </div>
      <table>
        <thead><tr><th>分类</th>${head}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`
}

function renderDetails() {
  const rows = (data.details[detailKind] || []).map((row) => `
    <tr data-id="${escapeHtml(row.id)}">
      ${row.cells.map((cell, index) => `<td>${field(`c${index}`, cell)}</td>`).join('')}
      <td><button type="button" data-save-detail="${escapeHtml(row.id)}">保存</button></td>
    </tr>
  `).join('')
  const titles = {
    filing: ['单位名称', '级别', '状态', '最近更新'],
    system: ['系统名称', '状态', '在线率', '最近心跳'],
    resource: ['设备', '类型', '状态', '所属单位'],
  }
  app.innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <label>清单
          <select id="detail-kind">
            <option value="filing" ${detailKind === 'filing' ? 'selected' : ''}>密评备案</option>
            <option value="system" ${detailKind === 'system' ? 'selected' : ''}>信息系统</option>
            <option value="resource" ${detailKind === 'resource' ? 'selected' : ''}>密码资源</option>
          </select>
        </label>
      </div>
      <table>
        <thead><tr>${titles[detailKind].map((title) => `<th>${title}</th>`).join('')}<th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`
}

function render() {
  if (tab === 'metrics') renderMetrics()
  else if (tab === 'events') renderEvents()
  else if (tab === 'details') renderDetails()
  else renderSeries(tab)
}

function readRow(row) {
  const values = {}
  row.querySelectorAll('[data-field]').forEach((input) => { values[input.dataset.field] = input.value })
  return values
}

document.querySelector('.tabs').addEventListener('click', (event) => {
  const button = event.target.closest('.tab')
  if (!button) return
  tab = button.dataset.tab
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('on', item === button))
  render()
})

app.addEventListener('click', async (event) => {
  const metric = event.target.closest('[data-save-metric]')
  const saveEvent = event.target.closest('[data-save-event]')
  const deleteEvent = event.target.closest('[data-delete-event]')
  const saveDetail = event.target.closest('[data-save-detail]')
  try {
    if (metric) {
      const row = metric.closest('tr')
      const values = readRow(row)
      const city = data.cities.find((item) => item.name === metric.dataset.saveMetric)
      await request(`/api/metrics/${encodeURIComponent(city.name)}`, {
        method: 'PUT',
        body: JSON.stringify({ ...city.metrics, ...values }),
      })
      toast(`已保存 ${city.name}`)
      await load()
    } else if (saveEvent) {
      const values = readRow(saveEvent.closest('tr'))
      await request(`/api/events/${saveEvent.dataset.saveEvent}`, { method: 'PUT', body: JSON.stringify(values) })
      toast('事件已保存')
      await load()
    } else if (deleteEvent) {
      await request(`/api/events/${deleteEvent.dataset.deleteEvent}`, { method: 'DELETE' })
      toast('事件已删除')
      await load()
    } else if (event.target.id === 'add-event') {
      await request('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title: '新事件', status: '未处置', time: '2026/03/20 09:00:00', action: '立即处置' }),
      })
      toast('已新增事件')
      await load()
    } else if (event.target.id === 'save-series') {
      const points = [...app.querySelectorAll('tbody tr')].map((row) => readRow(row))
      await request(`/api/series/${event.target.dataset.kind}`, {
        method: 'PUT',
        body: JSON.stringify({ city: seriesCity, month: seriesMonth, points }),
      })
      toast('趋势已保存')
      await load()
    } else if (saveDetail) {
      const values = readRow(saveDetail.closest('tr'))
      await request(`/api/details/${saveDetail.dataset.saveDetail}`, {
        method: 'PUT',
        body: JSON.stringify({ cells: [values.c0, values.c1, values.c2, values.c3] }),
      })
      toast('明细已保存')
      await load()
    }
  } catch (error) {
    toast(error.message)
  }
})

app.addEventListener('change', (event) => {
  if (event.target.id === 'series-city') seriesCity = event.target.value
  if (event.target.id === 'series-month') seriesMonth = event.target.value
  if (event.target.id === 'detail-kind') detailKind = event.target.value
  if (['series-city', 'series-month', 'detail-kind'].includes(event.target.id)) render()
})

document.querySelector('#reload').addEventListener('click', () => load().catch((error) => toast(error.message)))
load().catch((error) => toast(error.message))
