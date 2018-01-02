#!/usr/bin/env node

const { spawn, exec } = require('child_process')

const cwd = process.cwd()
const srcDir = process.argv[2] || 'src'

const fs = require('fs')
const resolve = require('resolve')

const babel = `${__dirname}/../node_modules/.bin/babel`
const configPath = '.babelrc'
const babelrc = initBabelConfig(configPath)

console.log('Scanning deps...')
const deps = findAllDeps(babelrc, cwd)
const missingDeps = findMissingDeps(deps)

if (missingDeps.length) {
  console.log('Missing:')
  console.log(missingDeps.map(name => `- ${name}`).join('\n'))

  console.log('One sec while I install them 4 u!')
  installMissingDeps(missingDeps, '--save-dev', (err) => {
    if (err) {
      console.log('Unable to install:', err)
      return
    }

    doBabel()
  })

} else {
  console.log('...All deps found')

  doBabel()
}

function getDepName (dep) {
  return typeof dep === 'string'
    ? dep
    : dep[0]
}

function findAllDeps (babelrc, cwd) {
  // TODO: normalize babelrc first
  return (babelrc.presets || []).map(p => `babel-preset-${getDepName(p)}`).concat(
    (babelrc.plugins || []).map(p => `babel-plugin-${getDepName(p)}`)
  )
}

function findMissingDeps (names) {
  return names.filter(n => {
    try {
      resolve.sync(n, { basedir: cwd })
    } catch (e) {
      return true
    }
  })
}

function installMissingDeps (deps, saveFlag, cb) {
  exec(`npm install ${saveFlag} --loglevel silent ${deps.join(' ')}`, (err, stdout, stderr) => {
    if (err || stderr) {
      return cb(err || stderr)
    }

    return cb()
  })
}

function doBabel () {
  const child = spawn(babel, [
    '--watch',
    '--copy-files',
    '-d',
    `${srcDir}-es5`,
    srcDir
  ])

  child.on('exit', (code, signal) => {
    console.log('Exited with code', code, 'and signal', signal)
  })

  child.on('error', (...args) => {
    console.log('Spawn error:', ...args)
  })

  child.on('close', (...args) => {
    console.log('Closed:', ...args)
  })

  child.stdout.on('data', (data) => {
    console.log(data.toString('utf8'))
  })

  child.stderr.on('data', (data) => {
    console.error(`child stderr:\n${data}`);
  })
}

function getBabelConfig (configPath) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {
    return null
  }
}

function initBabelConfig (configPath) {
  const babelrc = getBabelConfig(configPath)
  if (babelrc) { return babelrc }

  const empty = {
    presets: [],
    plugins: []
  }

  fs.writeFileSync(configPath, JSON.stringify(empty, null, 2))
  return empty
}
