const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'idena-community-wallet-api',
    version,
    license: {
      name: 'MIT',
      url: 'https://github.com/simontakouridis/idena-community-wallet-api/blob/master/LICENSE',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
    },
  ],
};

module.exports = swaggerDef;
