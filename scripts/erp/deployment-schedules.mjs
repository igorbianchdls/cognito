import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// File uploads alone do not apply vercel.json deployment settings. The CLI
// forwards these settings in the deployment request; our REST publisher must too.
export function deploymentSchedules() {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
  assert(Array.isArray(config.crons) && config.crons.length === 2, 'Expected both Otto schedules')
  for (const cron of config.crons) {
    assert(typeof cron.path === 'string' && cron.path.startsWith('/api/'))
    assert(typeof cron.schedule === 'string' && cron.schedule.trim().split(/\s+/).length === 5)
  }
  return { version: 2, source: 'cli', crons: config.crons, regions: config.regions }
}

export function assertDeploymentSchedules(deployment) {
  const expected = deploymentSchedules().crons
  const normalize = crons => crons.map(({ path, schedule }) => ({ path, schedule })).sort((a, b) => a.path.localeCompare(b.path))
  assert.deepEqual(normalize(deployment.crons || []), normalize(expected), 'Deployment omitted the scheduled jobs')
}
