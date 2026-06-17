import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

const ENV_FILES = [
  '.env.local',
  '.env',
  '.env.development.local',
  '.env.development',
  '.env.production.local',
  '.env.production',
]

export function loadIntegrationCliEnv(cwd = process.cwd()) {
  const loaded = []

  for (const file of ENV_FILES) {
    const envPath = path.join(cwd, file)
    if (!fs.existsSync(envPath)) continue
    dotenv.config({ path: envPath, override: false, quiet: true })
    loaded.push(file)
  }

  return loaded
}
