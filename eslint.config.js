//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      // Generated files: routeTree by the router plugin, worker-configuration by
      // `wrangler types`. Linting them reports on code nobody wrote.
      'src/routeTree.gen.ts',
      'worker-configuration.d.ts',
      'drizzle/**',
    ],
  },
]
