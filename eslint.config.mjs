import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

export default [
  ...nextVitals,
  ...nextTypescript,
  // Names starting with _ and the siblings of a ...rest are the way to drop a field from a copy.
  { rules: { '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', ignoreRestSiblings: true }] } },
  // CommonJS scripts load their dependencies with require().
  { files: ['**/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
  // ERP business rules are pure functions shared by the screen, the server and the chat: no database or server code.
  {
    files: ['src/products/erp/regras/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'pg', message: 'regras/ só tem funções puras: quem precisa do banco é o servidor, que busca os dados e chama a regra.' },
          { name: '@/lib/postgres', message: 'regras/ só tem funções puras: quem precisa do banco é o servidor, que busca os dados e chama a regra.' },
          { name: '@/lib/erpDatabaseContext', message: 'regras/ só tem funções puras: recebem o fuso/empresa como parâmetro.' },
        ],
        patterns: [
          { group: ['**/server/**', '**/server', '@/products/*/server/**', '@supabase/*', 'next/*', 'react', 'react-dom'], message: 'regras/ só tem funções puras, sem servidor, banco ou tela.' },
        ],
      }],
    },
  },
  { ignores: ['**/dist/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', '**/*.generated.ts'] },
]
