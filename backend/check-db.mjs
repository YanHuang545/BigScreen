import mysql from 'mysql2/promise'

const hosts = ['::1', 'localhost', '127.0.0.1']
for (const host of hosts) {
  const start = Date.now()
  try {
    const conn = await mysql.createConnection({
      host,
      port: 3306,
      user: 'root',
      password: 'ROOT',
      connectTimeout: 2500,
    })
    const [rows] = await conn.query('SELECT 1 AS ok')
    console.log(host, 'ok', Date.now() - start, rows[0])
    await conn.end()
  } catch (error) {
    console.log(host, error.code || error.message, Date.now() - start)
  }
}
