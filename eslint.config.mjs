import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextVitals,
  ...nextTypescript,
  // CommonJS scripts load their dependencies with require().
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { ignores: ['**/dist/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '**/*.generated.ts'] },
]
