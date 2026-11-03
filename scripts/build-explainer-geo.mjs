// Builds the small map files used by the Explainer video components (MapZoom).
// Run once after changing the regions: node scripts/build-explainer-geo.mjs — the output is committed.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { feature } from 'topojson-client'

const require = createRequire(import.meta.url)
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/remotion/explainer/geo')
const round = (g) => JSON.parse(JSON.stringify(g, (_k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v)))
const slim = (f) => ({ type: 'Feature', id: f.id, properties: { name: f.properties.name }, geometry: f.geometry })

/** Average of a geometry's points, to pick the countries of a region. */
function centroid(f) {
  const n = JSON.stringify(f.geometry.coordinates).match(/-?\d+\.?\d*/g).map(Number)
  let lon = 0, lat = 0
  for (let i = 0; i < n.length; i += 2) { lon += n[i]; lat += n[i + 1] }
  return [lon / (n.length / 2), lat / (n.length / 2)]
}

// Latin America in detail (50m), so a zoom on Brazil or its neighbours stays sharp.
const w50 = require('world-atlas/countries-50m.json') // JSON via require: import attributes vary by Node version
const latam = feature(w50, w50.objects.countries).features.filter((f) => {
  const [lon, lat] = centroid(f)
  return lon > -120 && lon < -30 && lat > -58 && lat < 33
})
fs.writeFileSync(path.join(out, 'latam-50m.json'), JSON.stringify(round({ type: 'FeatureCollection', features: latam.map(slim) })))

// The whole world, coarse (110m), for the opening shot of a zoom.
const w110 = require('world-atlas/countries-110m.json')
const world = feature(w110, w110.objects.countries).features
fs.writeFileSync(path.join(out, 'world-110m.json'), JSON.stringify(round({ type: 'FeatureCollection', features: world.map(slim) })))

console.log(`latam: ${latam.length} countries, world: ${world.length} countries`)
