import { Router } from 'express';
import { $$$, Auth, Method, OPCODE, Phone, Session, Wrapper } from '../..';

export function getAuthLoginRouter(): Router {
  const router = Router();

  router.post(
    '/phone',
    Wrapper(async (req, res) => {
      const userAgent = req.headers['user-agent'];
      const phoneObj = await Phone.getPhoneOrThrow(req.body.phone.phoneId);
      const user = await Auth.getUserByPhoneOrThrow(phoneObj.phoneNo);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId, user });
      await $$$(Phone.revokePhone(phoneObj));
    })
  );

  router.post(
    '/kakao',
    Wrapper(async (req, res) => {
      const userAgent = req.headers['user-agent'];
      const user = await Method.loginWithKakao(req.body.accessToken);
      const sessionId = await Session.createSession(user, userAgent);
      res.json({ opcode: OPCODE.SUCCESS, sessionId, user });
    })
  );

  return router;
}
