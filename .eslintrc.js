module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    },
  },
  rules: {
    'no-unused-vars': 'off',
    'no-console': 'off',
    'max-len': 'off',
    'no-await-in-loop': 'off',
    'import/no-absolute-path': 'off',
    'func-names': 'off',
    'meteor/audit-argument-checks': 'off',
    'import/extensions': 'off',
    'no-plusplus': 'off',
    radix: 'off',
    'no-loop-func': 'off',
    'no-underscore-dangle': 'off',
    'consistent-return': 'off',
    'no-restricted-syntax': 'off',
    'no-param-reassign': 'off',
    'arrow-body-style': 'off',
    'import/prefer-default-export': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-use-before-define': 'off',
    'import/no-unresolved': 'off',
    'guard-for-in': 'warn',
    'react/no-array-index-key': 'warn',
    'import/no-duplicates': 'off',
    'react/jsx-first-prop-new-line': [
      'error',
      'multiline',
    ],
    quotes: [
      'error',
      'single',
    ],
    'react/jsx-filename-extension': [
      2,
      {
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
        ],
      },
    ],
    '@typescript-eslint/no-use-before-define': [
      'warn',
      {
        functions: false,
        classes: false,
        variables: false,
        typedefs: false,
      },
    ],
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: 'always',
        ObjectPattern: {
          multiline: true,
          minProperties: 2,
        },
        ImportDeclaration: {
          multiline: true,
          minProperties: 2,
        },
        ExportDeclaration: 'always',
      },
    ],
  },
};
