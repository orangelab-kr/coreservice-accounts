import { MethodProvider } from '@prisma/client';
import { Router } from 'express';
import { $$$, kakao, Method, OPCODE, Wrapper } from '../../../..';

const provider = MethodProvider.kakao;

export function getInternalUsersMethodsKakaoRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const method = await Method.getMethodOrThrow(req.internal.user, provider);
      res.json({ opcode: OPCODE.SUCCESS, method });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const method = await $$$(
        Method.connectKakaoMethod(req.internal.user, req.body.accessToken)
      );

      res.json({ opcode: OPCODE.SUCCESS, method });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req, res) => {
      await $$$(Method.disconnectMethod(req.internal.user, provider));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.get(
    '/accessToken',
    Wrapper(async (req, res) => {
      const token = String(req.query.token);
      const { accessToken } = await kakao.getAccessTokenResponse(token);
      res.json({ opcode: OPCODE.SUCCESS, accessToken });
    })
  );

  router.post(
    '/info',
    Wrapper(async (req, res) => {
      const userInfo = await Method.getUserInfoByKakao(req.body);
      res.json({ opcode: OPCODE.SUCCESS, userInfo });
    })
  );

  router.get(
    '/url',
    Wrapper(async (req, res) => {
      const url = await kakao.getAuthRequestUri();
      res.json({ opcode: OPCODE.SUCCESS, url });
    })
  );

  router.post(
    '/info',
    Wrapper(async (req, res) => {
      const userInfo = await Method.getUserInfoByKakao(req.body);
      res.json({ opcode: OPCODE.SUCCESS, userInfo });
    })
  );

  return router;
}
