import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    /*
      Tests may assert non-null.

      The rule earns its keep in shipping code, where `x!` states a guarantee
      nobody checked and the failure surfaces far from its cause. A test is the
      opposite case: `result.find(...)!` is followed immediately by an
      assertion *about* that value, so a wrong assumption fails the test, which
      is the whole point of the test. Rewriting all of them as explicit guards
      adds a branch per line that can only ever be taken when the test is
      already failing.

      Scoped to test files deliberately rather than turned off outright — see
      `relocate-commands.ts`, where the one production instance was replaced
      with a real check instead of being silenced.
    */
    files: ['src/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
