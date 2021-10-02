import { MethodProvider } from '@prisma/client';
import { Router } from 'express';
import { $$$, kakao, Method, RESULT, UserMiddleware, Wrapper } from '../..';

const provider = MethodProvider.kakao;

export function getMethodsKakaoRouter(): Router {
  const router = Router();

  router.get(
    '/',
    UserMiddleware(),
    Wrapper(async (req) => {
      const method = await Method.getMethodOrThrow(req.user, provider);
      throw RESULT.SUCCESS({ details: { method } });
    })
  );

  router.post(
    '/',
    UserMiddleware(),
    Wrapper(async (req) => {
      const method = await $$$(
        Method.connectKakaoMethod(req.user, req.body.accessToken)
      );

      throw RESULT.SUCCESS({ details: { method } });
    })
  );

  router.delete(
    '/',
    UserMiddleware(),
    Wrapper(async (req) => {
      await $$$(Method.disconnectMethod(req.user, provider));
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
    Wrapper(async (req) => {
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
