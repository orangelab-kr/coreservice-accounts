import { Router } from 'express';
import { $$$, Method, OPCODE, Session, Wrapper } from '../..';
import { Auth, Phone } from '../../controllers';

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
