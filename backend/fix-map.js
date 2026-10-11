import fs from 'fs'
const p = '../frontend/src/data/beijingMap.js'
let text = fs.readFileSync(p, 'utf8')
text = text.replaceAll('\\n', '\n')
fs.writeFileSync(p, text)
console.log(JSON.stringify(text.slice(0, 60)))
