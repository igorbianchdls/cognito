import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextVitals,
  ...nextTypescript,
  // Names starting with _ and the siblings of a ...rest are the way to drop a field from a copy.
  { rules: { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }] } },
  // CommonJS scripts load their dependencies with require().
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  { ignores: ['**/dist/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '**/*.generated.ts'] },
]
