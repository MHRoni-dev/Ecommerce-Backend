import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintPlugInJest from 'eslint-plugin-jest';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}', '**/*.test.ts','**/*e2e.test.ts'],
    languageOptions: {
      parser: tsParser,
      globals: globals.node,
    },
    env: {
      jest: true,
      node: true,
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
      jest: eslintPlugInJest
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...prettier.rules, // Disables ESLint rules that conflict with Prettier
      ...eslintPlugInJest.rules,
      indent: ['error', 2],
      'prettier/prettier': [
        'error',
        { tabWidth: 2, singleQuote: true, endOfLine: "lf" }
      ],
    },
  },
];
