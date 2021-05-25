import { Router } from 'express';
import {
  Auth,
  getAuthLoginRouter,
  OPCODE,
  Session,
  UserMiddleware,
  Wrapper,
} from '../..';

export * from './login';

export function getAuthRouter(): Router {
  const router = Router();
  router.use('/login', getAuthLoginRouter());

  router.get(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const { user } = req;
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const user = await Auth.modifyUser(req.user, req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  router.post(
    '/signup',
    Wrapper(async (req, res) => {
      const userAgent = req.headers['user-agent'];
      const user = await Auth.signupUser(req.body);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId, user });
    })
  );

  router.get(
    '/messaging',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const { sessionId, query } = req;
      await Session.setMessagingToken(sessionId, String(query.token));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
