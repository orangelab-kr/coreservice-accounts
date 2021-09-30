import { Router } from 'express';
import {
  $$$,
  getInternalUsersMethodsKakaoRouter,
  getInternalUsersMethodsPhoneRouter,
  Method,
  OPCODE,
  Wrapper,
} from '../../../..';

export * from './kakao';
export * from './phone';

export function getInternalUsersMethodsRouter(): Router {
  const router = Router();

  router.use('/kakao', getInternalUsersMethodsKakaoRouter());
  router.use('/phone', getInternalUsersMethodsPhoneRouter());

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const methods = await $$$(Method.getMethods(req.internal.user, false));
      res.json({ opcode: OPCODE.SUCCESS, methods });
    })
  );

  return router;
}
