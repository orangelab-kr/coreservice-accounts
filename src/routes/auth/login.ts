import { Router } from 'express';
import { Method, OPCODE, Session, Wrapper } from '../..';

export function getAuthLoginRouter(): Router {
  const router = Router();

  router.post(
    '/phone',
    Wrapper(async (req, res) => {
      const userAgent = req.headers['user-agent'];
      const user = await Method.loginWithKakao(req.body.token);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId });
    })
  );

  router.post(
    '/kakao',
    Wrapper(async (req, res) => {
      const userAgent = req.headers['user-agent'];
      const user = await Method.loginWithKakao(req.body.accessToken);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId });
    })
  );

  return router;
}
