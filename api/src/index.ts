const awsServerlessExpress = require('aws-serverless-express');
const api = require('./app');

const server = awsServerlessExpress.createServer(api);

exports.handler = (event: any, context: any) => {
  return awsServerlessExpress.proxy(server, event, context, 'PROMISE').promise;
};
