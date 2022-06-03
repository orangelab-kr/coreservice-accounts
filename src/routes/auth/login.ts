import { Router } from 'express';
import { $$$, Method, Phone, RESULT, Session, User, Wrapper } from '../..';

export function getAuthLoginRouter(): Router {
  const router = Router();

  router.post(
    '/phone',
    Wrapper(async (req) => {
      const userAgent = req.headers['user-agent'];
      const phoneObj = await Phone.getPhoneOrThrow(req.body.phone);
      const user = await User.getUserOrTryMigrateOrThrow(phoneObj.phoneNo);
      const sessionId = await Session.createSession(user, userAgent);
      await $$$(Phone.revokePhone(phoneObj));
      throw RESULT.SUCCESS({ details: { sessionId, user } });
    })
  );

  router.post(
    '/kakao',
    Wrapper(async (req) => {
      const userAgent = req.headers['user-agent'];
      const user = await Method.loginWithKakao(req.body.accessToken);
      const sessionId = await Session.createSession(user, userAgent);
      throw RESULT.SUCCESS({ details: { sessionId, user } });
    })
  );

  return router;
}
