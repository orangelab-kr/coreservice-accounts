import { Router } from 'express';
import {
  $$$,
  getMethodsKakaoRouter,
  Method,
  OPCODE,
  UserMiddleware,
  Wrapper,
} from '../..';

export * from './kakao';

export function getMethodsRouter(): Router {
  const router = Router();
  router.use('/kakao', getMethodsKakaoRouter());

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
