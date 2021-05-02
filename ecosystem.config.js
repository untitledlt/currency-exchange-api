const packageJson = require('./package.json');

module.exports = {
    apps: [
        {
            name: packageJson.name,
            cwd: 'dist',
            script: 'src/app.js',
            env: {
                NODE_ENV: 'production',
                NODE_PORT: 7788,
                EXCHANGERATE_API_URL:
                    'https://v6.exchangerate-api.com/v6/{{API_KEY}}/pair/{{FROM}}/{{TO}}',
                EXCHANGERATE_API_KEY: '',
                ROUND_PRECISION: 3,
                CACHE_SIZE: 2,
                CACHE_TTL: 20 * 1000, // 20 seconds
            },
        },
    ],
};
