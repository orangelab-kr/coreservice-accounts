import { Router } from 'express';
import {
  $$$,
  getMethodsKakaoRouter,
  getMethodsPhoneRouter,
  Method,
  RESULT,
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
    Wrapper(async (req) => {
      const methods = await $$$(Method.getMethods(req.user, false));
      throw RESULT.SUCCESS({ details: { methods } });
    })
  );

  return router;
}
