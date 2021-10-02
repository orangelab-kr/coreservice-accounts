import { Router } from 'express';
import {
  $$$,
  getInternalUsersMethodsKakaoRouter,
  getInternalUsersMethodsPhoneRouter,
  Method,
  RESULT,
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
    Wrapper(async (req) => {
      const methods = await $$$(Method.getMethods(req.internal.user, false));
      throw RESULT.SUCCESS({ details: { methods } });
    })
  );

  return router;
}
