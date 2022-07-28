import { Router } from 'express';
import {
  getInternalUsersLicenseRouter,
  getInternalUsersMethodsRouter,
  getInternalUsersNotificationsRouter,
  getInternalUsersPassesRouter,
  getInternalUsersPointsRouter,
  getInternalUsersSessionsRouter,
  InternalUserBySessionMiddleware,
  InternalUserMiddleware,
  RESULT,
  User,
  Wrapper,
} from '../../..';
import { getInternalUsersCentercoinRouter } from './centercoin';

export * from './license';
export * from './methods';
export * from './notifications';
export * from './passes';
export * from './points';
export * from './sessions';

export function getInternalUsersRouter(): Router {
  const router = Router();

  router.use(
    '/:userId/license',
    InternalUserMiddleware(),
    getInternalUsersLicenseRouter()
  );

  router.use(
    '/:userId/methods',
    InternalUserMiddleware(),
    getInternalUsersMethodsRouter()
  );

  router.use(
    '/:userId/sessions',
    InternalUserMiddleware(),
    getInternalUsersSessionsRouter()
  );

  router.use(
    '/:userId/notifications',
    InternalUserMiddleware(),
    getInternalUsersNotificationsRouter()
  );

  router.use(
    '/:userId/passes',
    InternalUserMiddleware(),
    getInternalUsersPassesRouter()
  );

  router.use(
    '/:userId/points',
    InternalUserMiddleware(),
    getInternalUsersPointsRouter()
  );

  router.use(
    '/:userId/centercoin',
    InternalUserMiddleware(),
    getInternalUsersCentercoinRouter()
  );

  router.post(
    '/authorize',
    InternalUserBySessionMiddleware(),
    Wrapper(async (req) => {
      const { user } = req.internal;
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, users } = await User.getUsers(req.query);
      throw RESULT.SUCCESS({ details: { users, total } });
    })
  );

  router.get(
    '/:userId',
    InternalUserMiddleware(),
    Wrapper(async (req) => {
      const { user } = req.internal;
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.post(
    '/:userId',
    InternalUserMiddleware(),
    Wrapper(async (req) => {
      const user = await User.modifyUser(req.internal.user, req.body);
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.delete(
    '/:userId/secession',
    InternalUserMiddleware(),
    Wrapper(async (req) => {
      await User.secessionUser(req.internal.user, req.body);
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
