import express, { Application } from 'express';
import morgan from 'morgan';
import os from 'os';
import { InternalError, logger, OPCODE, Wrapper } from '..';
import { UserMiddleware } from '../middlewares';
import { getAuthRouter } from './auth';
import { getAuthLoginRouter } from './auth/login';
import { getLicenseRouter } from './license';
import { getMethodsRouter } from './methods';

export * from './methods';
export * from './license';

export function getRouter(): Application {
  const router = express();
  InternalError.registerSentry(router);

  const hostname = os.hostname();
  const logging = morgan('common', {
    stream: { write: (str: string) => logger.info(`${str.trim()}`) },
  });

  router.use(logging);
  router.use(express.json());
  router.use(express.urlencoded({ extended: true }));
  router.use('/auth', getAuthRouter());
  router.use('/login', getAuthLoginRouter());
  router.use('/methods', getMethodsRouter());
  router.use('/license', UserMiddleware(), getLicenseRouter());

  router.get(
    '/',
    Wrapper(async (_req, res) => {
      res.json({
        opcode: OPCODE.SUCCESS,
        mode: process.env.NODE_ENV,
        cluster: hostname,
      });
    })
  );

  router.all(
    '*',
    Wrapper(async () => {
      throw new InternalError('Invalid API', 404);
    })
  );

  return router;
}
