import serverless from 'serverless-http';
import { getRouter } from '.';
import { License } from './controllers';

export * from './routes';
export * from './tools';
export * from './controllers';

const options = { basePath: '/v1/accounts' };
export const handler = serverless(getRouter(), options);
