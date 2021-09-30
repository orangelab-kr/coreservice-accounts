import { Router } from 'express';
import {
  $$$,
  InternalUserSessionMiddleware,
  OPCODE,
  Session,
  Wrapper,
} from '../../..';

export function getInternalUsersSessionsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { sessions, total } = await Session.getSessions(req.internal.user);
      res.json({ opcode: OPCODE.SUCCESS, sessions, total });
    })
  );

  router.get(
    '/generate',
    Wrapper(async (req, res) => {
      const sessionId = await Session.createSession(
        req.internal.user,
        '하이킥 관리자'
      );

      res.json({ opcode: OPCODE.SUCCESS, sessionId });
    })
  );

  router.get(
    '/:sessionId(*)',
    InternalUserSessionMiddleware(),
    Wrapper(async (req, res) => {
      const { session } = req.internal;
      res.json({ opcode: OPCODE.SUCCESS, session });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req, res) => {
      await $$$(Session.logoutSession(req.internal.user));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.delete(
    '/:sessionId(*)',
    InternalUserSessionMiddleware(),
    Wrapper(async (req, res) => {
      const { user, session } = req.internal;
      await $$$(Session.logoutSession(user, session));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
