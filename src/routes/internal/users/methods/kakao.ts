import { MethodProvider } from '@prisma/client';
import { Router } from 'express';
import { $$$, kakao, Method, RESULT, Wrapper } from '../../../..';

const provider = MethodProvider.kakao;

export function getInternalUsersMethodsKakaoRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const method = await Method.getMethodOrThrow(req.internal.user, provider);
      throw RESULT.SUCCESS({ details: { method } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const method = await $$$(
        Method.connectKakaoMethod(req.internal.user, req.body.accessToken)
      );

      throw RESULT.SUCCESS({ details: { method } });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req) => {
      await $$$(Method.disconnectMethod(req.internal.user, provider));
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/accessToken',
    Wrapper(async (req) => {
      const token = String(req.query.token);
      const { accessToken } = await kakao.getAccessTokenResponse(token);
      throw RESULT.SUCCESS({ details: { accessToken } });
    })
  );

  router.post(
    '/info',
    Wrapper(async (req) => {
      const userInfo = await Method.getUserInfoByKakao(req.body);
      throw RESULT.SUCCESS({ details: { userInfo } });
    })
  );

  router.get(
    '/url',
    Wrapper(async () => {
      const url = await kakao.getAuthRequestUri();
      throw RESULT.SUCCESS({ details: { url } });
    })
  );

  router.post(
    '/info',
    Wrapper(async (req) => {
      const userInfo = await Method.getUserInfoByKakao(req.body);
      throw RESULT.SUCCESS({ details: { userInfo } });
    })
  );

  return router;
}
