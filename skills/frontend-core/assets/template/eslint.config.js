import js from '@eslint/js';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y-x';
import ts from 'typescript-eslint';

export default ts.config(
  { ignores: ['dist', 'scripts'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  hooks.configs.flat.recommended,
  a11y.configs.recommended,
  {
    rules: {
      // A leading underscore means unused on purpose.
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      // One request after another. Use Promise.all, or disable with a reason when order matters.
      'no-await-in-loop': 'error',
      // These put a whole library into the download.
      'no-restricted-imports': ['error', {
        paths: [
          { name: 'lodash', message: 'Use plain JavaScript or src/utils.' },
          { name: 'moment', message: 'Use src/utils/date or Intl.' },
          { name: 'lucide-react', importNames: ['icons', 'default'], message: 'Import single icons.' },
          { name: 'lucide-react/dynamic', message: 'Import single icons.' },
        ],
      }],
    },
  },
  {
    files: ['**/*.tsx'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "JSXOpeningElement[name.name=/^(select|datalist)$/]",
        message: 'Use Dropdown, MultiDropdown or Combobox.',
      }],
    },
  },
);
