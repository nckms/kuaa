import js from '@eslint/js'
import parser from '@typescript-eslint/parser'
import ts from '@typescript-eslint/eslint-plugin'
import globals from 'globals'

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*.d.ts', '.claude/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/api/loadtest/*.js'],
    languageOptions: { globals: { __ENV: 'readonly' } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { '@typescript-eslint': ts },
    rules: {
      ...ts.configs['eslint-recommended'].overrides[0].rules,
      ...ts.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]
