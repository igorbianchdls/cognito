import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextVitals,
  ...nextTypescript,
  { ignores: ['**/dist/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'] },
]
