import { Router } from 'express';
import {
  getInternalUsersLicenseRouter,
  getInternalUsersMethodsRouter,
  getInternalUsersSessionsRouter,
  InternalUserBySessionMiddleware,
  InternalUserMiddleware,
  RESULT,
  User,
  Wrapper,
} from '../../..';

export * from './license';
export * from './methods';
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

  return router;
}
