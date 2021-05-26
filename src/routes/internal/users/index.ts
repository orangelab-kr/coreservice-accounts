import { Router } from 'express';
import {
  getInternalUsersCouponsRouter,
  InternalUserBySessionMiddleware,
  InternalUserMiddleware,
  License,
  OPCODE,
  Wrapper,
} from '../../..';

export * from './coupons';

export function getInternalUsersRouter() {
  const router = Router();

  router.use(
    '/:userId/coupons',
    InternalUserMiddleware(),
    getInternalUsersCouponsRouter()
  );

  router.get(
    '/:userId',
    InternalUserMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req.internal;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.get(
    '/:userId/license',
    InternalUserMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req.internal;
      const license = await License.getLicenseOrThrow(user);
      res.json({ opcode: OPCODE.SUCCESS, license });
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
