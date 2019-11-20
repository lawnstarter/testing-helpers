module.exports = {
    extends: 'ls-react',
    settings: {
        'import/resolver': {
            'babel-module': {},
        },
    },
    globals: {
        fetch: false,
        FormData: false,
    },
    overrides: [
        {
            files: ['**/*.test.js'],
            globals: {
                shallow: false,
            },
            rules: {
                'lodash/prefer-lodash-method': [2, { ignoreMethods: ['find'] }],
                'space-before-function-paren': [
                    'error',
                    {
                        anonymous: 'never',
                        named: 'never',
                        asyncArrow: 'always',
                    },
                ],
            },
        },
        {
            files: ['*.js'],
            rules: {
                'space-before-function-paren': [
                    'error',
                    {
                        anonymous: 'never',
                        named: 'never',
                        asyncArrow: 'always',
                    },
                ],
            },
        },
    ],
};
