import { Router } from 'express';
import {
  $$$,
  getMethodsKakaoRouter,
  getMethodsPhoneRouter,
  Method,
  OPCODE,
  UserMiddleware,
  Wrapper,
} from '../..';

export * from './kakao';
export * from './phone';

export function getMethodsRouter(): Router {
  const router = Router();
  router.use('/kakao', getMethodsKakaoRouter());
  router.use('/phone', getMethodsPhoneRouter());

  router.get(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const methods = await $$$(Method.getMethods(req.user, false));
      res.json({ opcode: OPCODE.SUCCESS, methods });
    })
  );

  return router;
}
