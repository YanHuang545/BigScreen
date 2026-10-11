import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dbConfig } from './config.js'
import { createServerConnection } from './db.js'
import { DETAILS, EVENTS, allCities, filingRows, resourceRows, systemRows } from './sampleData.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function insertChunk(conn, sqlPrefix, rows, size = 200) {
  for (let i = 0; i < rows.length; i += size) {
    const chunk = rows.slice(i, i + size)
    const marks = chunk.map((row) => `(${row.map(() => '?').join(',')})`).join(',')
    await conn.query(`${sqlPrefix} VALUES ${marks}`, chunk.flat())
  }
}

const conn = await createServerConnection()
try {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  await conn.query(schema)
  await conn.query(`USE \`${dbConfig.database}\``)

  const cities = allCities()
  await insertChunk(
    conn,
    'INSERT INTO cities (name, contact, node_name, sort_order)',
    cities.map((city) => [city.name, city.contact, city.node, city.sortOrder]),
  )
  await insertChunk(
    conn,
    `INSERT INTO city_metrics
      (city, filed, testing, passed, failed, online_sys, offline_sys, online_res, offline_res, orgs, systems, devices, filing_rate, sys_online, dev_online)`,
    cities.map((city) => {
      const m = city.metrics
      return [city.name, m.filed, m.testing, m.passed, m.failed, m.onlineSys, m.offlineSys, m.onlineRes, m.offlineRes, m.orgs, m.systems, m.devices, m.filingRate, m.sysOnline, m.devOnline]
    }),
  )
  await insertChunk(
    conn,
    'INSERT INTO filing_points (city, month, point_index, label, filed, testing, passed, failed)',
    filingRows(),
  )
  await insertChunk(
    conn,
    'INSERT INTO system_points (city, month, point_index, label, online_count, offline_count, online_rate)',
    systemRows(),
  )
  await insertChunk(
    conn,
    'INSERT INTO resource_points (city, month, point_index, label, access_count, online_rate)',
    resourceRows(),
  )
  await insertChunk(
    conn,
    'INSERT INTO security_events (title, status, reported_at, action, sort_order)',
    EVENTS,
  )
  await insertChunk(
    conn,
    'INSERT INTO detail_rows (kind, c1, c2, c3, c4, sort_order)',
    DETAILS,
  )

  const [counts] = await conn.query(`
    SELECT
      (SELECT COUNT(*) FROM cities) AS cities,
      (SELECT COUNT(*) FROM city_metrics) AS metrics,
      (SELECT COUNT(*) FROM filing_points) AS filing,
      (SELECT COUNT(*) FROM system_points) AS systems,
      (SELECT COUNT(*) FROM resource_points) AS resources,
      (SELECT COUNT(*) FROM security_events) AS events,
      (SELECT COUNT(*) FROM detail_rows) AS details
  `)
  console.log(`seeded ${dbConfig.database}`, counts[0])
} finally {
  await conn.end()
}
