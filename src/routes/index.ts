import express, { Application } from 'express';
import morgan from 'morgan';
import os from 'os';
import {
  getAuthLoginRouter,
  getAuthRouter,
  getCouponsRouter,
  getLicenseRouter,
  getMethodsRouter,
  InternalError,
  logger,
  OPCODE,
  UserMiddleware,
  Wrapper,
} from '..';

export * from './auth';
export * from './coupons';
export * from './license';
export * from './methods';

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
  router.use('/coupons', UserMiddleware(), getCouponsRouter());

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
