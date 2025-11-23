const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const base = process.cwd()
const src = path.join(base, 'src')

function walk(d) {
  return fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : path.join(d, e.name)) : []
}

const files = walk(src).filter(f => f.endsWith('.js') && !f.includes(path.join('src', '_deprecated')))
const toMove = []
files.forEach(f => {
  const tsx = f.replace(/\.js$/, '.tsx')
  if (fs.existsSync(tsx)) toMove.push(f)
})

if (!toMove.length) {
  console.log('No remaining duplicate .js files found')
  process.exit(0)
}

toMove.forEach(f => {
  const rel = path.relative(src, f)
  const dest = path.join(src, '_deprecated', rel)
  const destDir = path.dirname(dest)
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  fs.renameSync(f, dest)
  console.log('moved', rel, '->', path.relative(base, dest))
})

try {
  execSync('git add -A', { cwd: base, stdio: 'inherit' })
  execSync('git commit -m "chore(frontend): archive remaining duplicate .js files to src/_deprecated"', { cwd: base, stdio: 'inherit' })
} catch (e) {
  console.log('git commit skipped or failed:', e.message)
}

console.log(execSync('git status --porcelain --branch', { cwd: base, encoding: 'utf8' }))
