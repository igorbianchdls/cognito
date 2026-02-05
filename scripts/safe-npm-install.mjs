#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { existsSync, writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

// Ensure a local .npmrc that forces public registry and avoids any auth tokens
const localNpmrc = resolve(projectRoot, '.npmrc')
if (!existsSync(localNpmrc)) {
  writeFileSync(localNpmrc, [
    'registry=https://registry.npmjs.org/',
    'always-auth=false',
    '@elevenlabs:registry=https://registry.npmjs.org/',
    '@assemblyai:registry=https://registry.npmjs.org/',
    ''
  ].join('\n'))
}

// Build a clean env for the child process
const cleanEnv = { ...process.env }
// Drop any token variables commonly used by npm
delete cleanEnv.NPM_TOKEN
delete cleanEnv.NODE_AUTH_TOKEN
delete cleanEnv.npm_config__authToken
delete cleanEnv.npm_config_token

// Force npm to use the project .npmrc and public registry without auth
cleanEnv.NPM_CONFIG_USERCONFIG = localNpmrc
cleanEnv.npm_config_userconfig = localNpmrc
cleanEnv.NPM_CONFIG_REGISTRY = 'https://registry.npmjs.org/'
cleanEnv.npm_config_registry = 'https://registry.npmjs.org/'
cleanEnv.NPM_CONFIG_ALWAYS_AUTH = 'false'
cleanEnv.npm_config_always_auth = 'false'

// Default command is ; allow passing custom args, e.g. 
const args = process.argv.slice(2)
const npmArgs = args.length > 0 ? args : ['install']

console.log('> Running npm with sanitized env:', {
  userconfig: cleanEnv.NPM_CONFIG_USERCONFIG,
  registry: cleanEnv.NPM_CONFIG_REGISTRY,
  always_auth: cleanEnv.NPM_CONFIG_ALWAYS_AUTH,
})

const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', npmArgs, {
  stdio: 'inherit',
  env: cleanEnv,
})

child.on('exit', (code) => process.exit(code ?? 0))
