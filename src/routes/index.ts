import { Router } from 'express';
import {
  clusterInfo,
  getAuthLoginRouter,
  getAuthRouter,
  getInternalRouter,
  getLevelRouter,
  getLicenseRouter,
  getMethodsRouter,
  getNotificationsRouter,
  getPassesRouter,
  getPassProgramsRouter,
  getPointsRouter,
  getReferralRouter,
  InternalMiddleware,
  RESULT,
  UserMiddleware,
  Wrapper,
} from '..';

export * from './auth';
export * from './internal';
export * from './level';
export * from './license';
export * from './methods';
export * from './notifications';
export * from './passes';
export * from './passPrograms';
export * from './points';
export * from './referral';

export function getRouter(): Router {
  const router = Router();

  router.use('/auth', getAuthRouter());
  router.use('/login', getAuthLoginRouter());
  router.use('/methods', getMethodsRouter());
  router.use('/passes', UserMiddleware(), getPassesRouter());
  router.use('/license', UserMiddleware(), getLicenseRouter());
  router.use('/points', UserMiddleware(), getPointsRouter());
  router.use('/level', UserMiddleware(), getLevelRouter());
  router.use('/referral', UserMiddleware(), getReferralRouter());
  router.use('/notifications', UserMiddleware(), getNotificationsRouter());
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
