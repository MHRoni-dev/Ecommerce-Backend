import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintPluginJest from 'eslint-plugin-jest';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
      jest: eslintPluginJest,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...prettier.rules, // Disables ESLint rules that conflict with Prettier
      ...eslintPluginJest.configs.recommended.rules,
      indent: 'off',
      'prettier/prettier': [
        'error',
        { tabWidth: 2, singleQuote: true, endOfLine: 'lf' },
      ],
    },
  },
];
