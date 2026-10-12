import { writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  MONTHS,
  allCities,
  filingRows,
  systemRows,
  resourceRows,
  EVENTS,
  DETAILS,
} from '../../backend/sampleData.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function packRows(rows, keys) {
  const map = {}
  for (const row of rows) {
    const [city, month, , label, ...values] = row
    map[city] ??= {}
    const pack = map[city][month] ??= { categories: [], ...Object.fromEntries(keys.map((key) => [key, []])) }
    pack.categories.push(label)
    keys.forEach((key, index) => pack[key].push(values[index]))
  }
  return map
}

const dashboard = {
  months: MONTHS,
  cities: allCities().map(({ name, contact, node, metrics }) => ({ name, contact, node, metrics })),
  filing: packRows(filingRows(), ['filed', 'testing', 'passed', 'failed']),
  system: packRows(systemRows(), ['online', 'offline', 'rate']),
  resource: packRows(resourceRows(), ['access', 'rate']),
  events: EVENTS.map(([title, status, time, action], index) => ({
    id: String(index + 1),
    title,
    status,
    time,
    action,
  })),
  details: { filing: [], system: [], resource: [] },
}

for (const [kind, c1, c2, c3, c4, order] of DETAILS) {
  dashboard.details[kind].push({ id: `${kind}-${order}`, cells: [c1, c2, c3, c4] })
}

const json = JSON.stringify(dashboard)
writeFileSync(path.join(root, 'data', 'dashboard.json'), json)
writeFileSync(path.join(root, 'data', 'dashboard.js'), `module.exports = ${json}\n`)
writeFileSync(path.resolve(root, '../cloudfunctions/crypto/seed.json'), json)
console.log(`dashboard bytes ${Buffer.byteLength(json)} cities ${dashboard.cities.length}`)
