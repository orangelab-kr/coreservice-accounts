import { Router } from 'express';
import {
  $$$,
  InternalUserSessionMiddleware,
  RESULT,
  Session,
  Wrapper,
} from '../../..';

export function getInternalUsersSessionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { sessions, total } = await Session.getSessions(
        req.internal.user,
        req.query
      );

      throw RESULT.SUCCESS({ details: { sessions, total } });
    })
  );

  router.get(
    '/generate',
    Wrapper(async (req) => {
      const platform = '하이킥 관리자';
      const sessionId = await Session.createSession(
        req.internal.user,
        platform
      );

      throw RESULT.SUCCESS({ details: { sessionId } });
    })
  );

  router.get(
    '/:sessionId(*)',
    InternalUserSessionMiddleware(),
    Wrapper(async (req) => {
      const { session } = req.internal;
      throw RESULT.SUCCESS({ details: { session } });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req) => {
      await $$$(Session.logoutSession(req.internal.user));
      throw RESULT.SUCCESS();
    })
  );

  router.delete(
    '/:sessionId(*)',
    InternalUserSessionMiddleware(),
    Wrapper(async (req) => {
      const { user, session } = req.internal;
      await $$$(Session.logoutSession(user, session));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
