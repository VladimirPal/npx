'use strict'

const npa = require('npm-package-arg')
const yargs = require('yargs')

const usage = `$0 [--package|-p <package>] [--cache <path>] [--userconfig <path>] [-c <string>] [--shell <string>] [--shell-auto-fallback [<shell>]] [--ignore-existing] [--version|-v] [--] <command>[@version] [command-arg]...`

module.exports = parseArgs
function parseArgs () {
  const parser = yargs
  .usage(`Execute a binary from an npm package\n${usage}`)
  .option('package', {
    alias: 'p',
    type: 'string',
    describe: 'package to be installed'
  })
  .option('cache', {
    type: 'string',
    describe: 'location of the npm cache'
  })
  .option('userconfig', {
    type: 'string',
    describe: 'path to user npmrc'
  })
  .option('call', {
    alias: 'c',
    type: 'string',
    describe: 'execute string as if inside `npm run-script`'
  })
  .option('shell', {
    alias: 's',
    type: 'string',
    describe: 'Shell to execute the command with, if any.',
    default: false
  })
  .option('shell-auto-fallback', {
    choices: ['', 'bash', 'fish', 'zsh'],
    describe: 'generate shell code to use npx as the "command not found" fallback',
    requireArg: false,
    type: 'string'
  })
  .option('ignore-existing', {
    describe: 'Ignores existing binaries in $PATH, or in the local project. This forces npx to do a temporary install and use the latest version.',
    type: 'boolean'
  })
  .version()
  .alias('version', 'v')

  const opts = parser.getOptions()
  const bools = new Set(opts.boolean)
  const raw = process.argv

  let cmdIndex
  let hasDashDash
  for (let i = 2; i < raw.length; i++) {
    const opt = raw[i]
    if (opt === '--') {
      hasDashDash = true
      break
    } else if (opt[0] === '-') {
      if (!bools.has(opt.replace(/^--?/, ''))) {
        i++
      }
    } else {
      cmdIndex = i
      break
    }
  }
  if (cmdIndex) {
    const parsed = parser.parse(process.argv.slice(0, cmdIndex))
    const parsedCmd = npa(process.argv[cmdIndex])
    parsed.command = parsed.package
    ? process.argv[cmdIndex]
    : parsedCmd.name
    parsed.cmdOpts = process.argv.slice(cmdIndex + 1)
    parsed.packageRequested = !!parsed.package
    parsed.cmdHadVersion = parsedCmd.name !== parsedCmd.raw
    const pkg = parsed.package || process.argv[cmdIndex]
    parsed.p = parsed.package = npa(pkg).toString()
    return parsed
  } else {
    const parsed = parser.argv
    if (parsed.call) {
      const splitCmd = parsed.call.trim().split(/\s+/)
      const parsedCmd = npa(splitCmd[0])
      parsed.command = parsed.package
      ? splitCmd[0]
      : parsedCmd.name
      parsed.cmdOpts = splitCmd.slice(1)
      parsed.packageRequested = !!parsed.package
      parsed.cmdHadVersion = parsedCmd.name !== parsedCmd.raw
      const pkg = parsed.package || splitCmd[0]
      parsed.p = parsed.package = npa(pkg).toString()
    } else if (hasDashDash) {
      const splitCmd = parsed._
      const parsedCmd = npa(splitCmd[0])
      parsed.command = parsed.package
      ? splitCmd[0]
      : parsedCmd.name
      parsed.cmdOpts = splitCmd.slice(1)
      parsed.packageRequested = !!parsed.package
      parsed.cmdHadVersion = parsedCmd.name !== parsedCmd.raw
    }
    return parsed
  }
}
