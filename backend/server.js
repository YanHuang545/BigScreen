import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import express from 'express'
import { port } from './config.js'
import { createPool } from './db.js'
import { loadDashboard } from './dashboard.js'
import { beijingWeather } from './weather.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pool = createPool()
const app = express()

app.use(cors())
app.use(express.json())
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')))

function asyncRoute(handler) {
  return (req, res) => {
    handler(req, res).catch((error) => {
      console.error(error)
      res.status(500).json({ message: error.message })
    })
  }
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT DATABASE() AS db')
  res.json({ ok: true, database: rows[0].db })
}))

app.get('/api/dashboard', asyncRoute(async (_req, res) => {
  res.json(await loadDashboard(pool))
}))

app.get('/api/weather', asyncRoute(async (_req, res) => {
  res.json(await beijingWeather())
}))

app.put('/api/metrics/:city', asyncRoute(async (req, res) => {
  const city = req.params.city
  const body = req.body
  const [result] = await pool.query(
    `UPDATE city_metrics SET
      filed=?, testing=?, passed=?, failed=?,
      online_sys=?, offline_sys=?, online_res=?, offline_res=?,
      orgs=?, systems=?, devices=?,
      filing_rate=?, sys_online=?, dev_online=?
     WHERE city=?`,
    [
      body.filed, body.testing, body.passed, body.failed,
      body.onlineSys, body.offlineSys, body.onlineRes, body.offlineRes,
      body.orgs, body.systems, body.devices,
      body.filingRate, body.sysOnline, body.devOnline,
      city,
    ],
  )
  if (!result.affectedRows) {
    const [found] = await pool.query('SELECT city FROM city_metrics WHERE city=?', [city])
    if (!found.length) {
      res.status(404).json({ message: '未找到该地市' })
      return
    }
  }
  if (body.contact) {
    await pool.query('UPDATE cities SET contact=? WHERE name=?', [body.contact, city])
  }
  res.json({ ok: true })
}))

app.post('/api/events', asyncRoute(async (req, res) => {
  const body = req.body
  const [maxRow] = await pool.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSort FROM security_events')
  const [result] = await pool.query(
    'INSERT INTO security_events (title, status, reported_at, action, sort_order) VALUES (?, ?, ?, ?, ?)',
    [body.title, body.status, body.time, body.action || '', maxRow[0].nextSort],
  )
  res.status(201).json({ id: result.insertId })
}))

app.put('/api/events/:id', asyncRoute(async (req, res) => {
  const body = req.body
  const [result] = await pool.query(
    'UPDATE security_events SET title=?, status=?, reported_at=?, action=? WHERE id=?',
    [body.title, body.status, body.time, body.action || '', req.params.id],
  )
  if (!result.affectedRows) {
    const [found] = await pool.query('SELECT id FROM security_events WHERE id=?', [req.params.id])
    if (!found.length) {
      res.status(404).json({ message: '未找到该事件' })
      return
    }
  }
  res.json({ ok: true })
}))

app.delete('/api/events/:id', asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM security_events WHERE id=?', [req.params.id])
  res.json({ ok: true })
}))

app.put('/api/series/:kind', asyncRoute(async (req, res) => {
  const { city, month, points } = req.body
  if (!city || !month || !Array.isArray(points)) {
    res.status(400).json({ message: '缺少 city、month 或 points' })
    return
  }
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    if (req.params.kind === 'filing') {
      await conn.query('DELETE FROM filing_points WHERE city=? AND month=?', [city, month])
      if (points.length) {
        const marks = points.map(() => '(?,?,?,?,?,?,?,?)').join(',')
        const values = points.flatMap((point, index) => [city, month, index, point.label, point.filed, point.testing, point.passed, point.failed])
        await conn.query(
          `INSERT INTO filing_points (city, month, point_index, label, filed, testing, passed, failed) VALUES ${marks}`,
          values,
        )
      }
    } else if (req.params.kind === 'system') {
      await conn.query('DELETE FROM system_points WHERE city=? AND month=?', [city, month])
      if (points.length) {
        const marks = points.map(() => '(?,?,?,?,?,?,?)').join(',')
        const values = points.flatMap((point, index) => [city, month, index, point.label, point.online, point.offline, point.rate])
        await conn.query(
          `INSERT INTO system_points (city, month, point_index, label, online_count, offline_count, online_rate) VALUES ${marks}`,
          values,
        )
      }
    } else if (req.params.kind === 'resource') {
      await conn.query('DELETE FROM resource_points WHERE city=? AND month=?', [city, month])
      if (points.length) {
        const marks = points.map(() => '(?,?,?,?,?,?)').join(',')
        const values = points.flatMap((point, index) => [city, month, index, point.label, point.access, point.rate])
        await conn.query(
          `INSERT INTO resource_points (city, month, point_index, label, access_count, online_rate) VALUES ${marks}`,
          values,
        )
      }
    } else {
      res.status(400).json({ message: '未知序列类型' })
      await conn.rollback()
      return
    }
    await conn.commit()
    res.json({ ok: true })
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}))

app.put('/api/details/:id', asyncRoute(async (req, res) => {
  const [c1, c2, c3, c4] = req.body.cells
  const [result] = await pool.query('UPDATE detail_rows SET c1=?, c2=?, c3=?, c4=? WHERE id=?', [c1, c2, c3, c4, req.params.id])
  if (!result.affectedRows) {
    const [found] = await pool.query('SELECT id FROM detail_rows WHERE id=?', [req.params.id])
    if (!found.length) {
      res.status(404).json({ message: '未找到该明细' })
      return
    }
  }
  res.json({ ok: true })
}))

app.listen(port, '127.0.0.1', () => {
  console.log(`backend http://127.0.0.1:${port}`)
  console.log(`admin   http://127.0.0.1:${port}/admin`)
})
