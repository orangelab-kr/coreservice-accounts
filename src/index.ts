import serverless from 'serverless-http';
import { getRouter } from '.';

export * from './routes';
export * from './tools';

const options = { basePath: '/v1/accounts' };
export const handler = serverless(getRouter(), options);
