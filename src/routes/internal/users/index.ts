import { Router } from 'express';
import {
  getInternalUsersLicenseRouter,
  getInternalUsersMethodsRouter,
  getInternalUsersSessionsRouter,
  InternalUserBySessionMiddleware,
  InternalUserMiddleware,
  OPCODE,
  User,
  Wrapper,
} from '../../..';

export * from './license';
export * from './sessions';
export * from './methods';

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

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { total, users } = await User.getUsers(req.query);
      res.json({ opcode: OPCODE.SUCCESS, users, total });
    })
  );

  router.get(
    '/:userId',
    InternalUserMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req.internal;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/:userId',
    InternalUserMiddleware(),
    Wrapper(async (req, res) => {
      const user = await User.modifyUser(req.internal.user, req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/authorize',
    InternalUserBySessionMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req.internal;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  return router;
}
