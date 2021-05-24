import { Router } from 'express';
import { Auth, OPCODE, Wrapper } from '../..';
import { Session } from '../../controllers';
import { UserMiddleware } from '../../middlewares';
import { getAuthLoginRouter } from './login';

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
    '/signup',
    Wrapper(async (req, res) => {
      const user = await Auth.signupUser(req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
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
