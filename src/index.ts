import serverless from 'serverless-http';
import { getRouter } from '.';

export * from './controllers';
export * from './routes';
export * from './tools';
export * from './middlewares';

const options = { basePath: '/v1/accounts' };
export const handler = serverless(getRouter(), options);
