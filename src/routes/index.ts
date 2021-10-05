import { Router } from 'express';
import {
  clusterInfo,
  getAuthLoginRouter,
  getAuthRouter,
  getInternalRouter,
  getLicenseRouter,
  getMethodsRouter,
  InternalMiddleware,
  RESULT,
  UserMiddleware,
  Wrapper,
} from '..';
import { getPassProgramsRouter } from './passPrograms';

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
  router.use('/passPrograms', UserMiddleware(), getPassProgramsRouter());
  router.use('/internal', InternalMiddleware(), getInternalRouter());
  router.get(
    '/',
    Wrapper(async () => {
      throw RESULT.SUCCESS({ details: clusterInfo });
    })
  );

  return router;
}
