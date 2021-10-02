import { Router } from 'express';
import {
  getAuthLoginRouter,
  RESULT,
  Session,
  User,
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
    Wrapper(async (req) => {
      const { user } = req;
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.post(
    '/',
    UserMiddleware(),
    Wrapper(async (req) => {
      const user = await User.modifyUser(req.user, req.body);
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.post(
    '/signup',
    Wrapper(async (req) => {
      const userAgent = req.headers['user-agent'];
      const user = await User.signupUser(req.body);
      const sessionId = await Session.createSession(user, userAgent);
      throw RESULT.SUCCESS({ details: { sessionId, user } });
    })
  );

  router.get(
    '/messaging',
    UserMiddleware(),
    Wrapper(async (req) => {
      const { sessionId, query } = req;
      await Session.setMessagingToken(sessionId, String(query.token));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
