const { RouterOSClient } = require('routeros-client');
const client = new RouterOSClient({ host: '127.0.0.1', port: 8728, user: 'admin' });
console.log(client.api.toString());
