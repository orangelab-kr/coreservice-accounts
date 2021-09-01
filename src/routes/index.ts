import { Router } from 'express';
import {
  clusterInfo,
  getAuthLoginRouter,
  getAuthRouter,
  getInternalRouter,
  getLicenseRouter,
  getMethodsRouter,
  InternalMiddleware,
  OPCODE,
  UserMiddleware,
  Wrapper,
} from '..';

export * from './auth';
export * from './internal';
export * from './license';
export * from './methods';

export function getRouter(): Router {
  const router = Router();

  router.use('/auth', getAuthRouter());
  router.use('/login', getAuthLoginRouter());
  router.use('/methods', getMethodsRouter());
  router.use('/license', UserMiddleware(), getLicenseRouter());
  router.use('/internal', InternalMiddleware(), getInternalRouter());
  router.get(
    '/',
    Wrapper(async (_req, res) => {
      res.json({
        opcode: OPCODE.SUCCESS,
        ...clusterInfo,
      });
    })
  );

  return router;
}
