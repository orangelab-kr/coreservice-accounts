import { MethodProvider } from '.prisma/client';
import { Router } from 'express';
import { Method, Wrapper } from '../..';
import { UserMiddleware } from '../../middlewares';
import { $, kakao, OPCODE } from '../../tools';

export function getMethodsKakaoRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const token = String(req.query.token);
      const { accessToken } = await kakao.getAccessTokenResponse(token);
      res.json({ opcode: OPCODE.SUCCESS, accessToken });
    })
  );

  router.delete(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const provider = MethodProvider.kakao;
      const methods = await $(Method.disconnectMethod(req.user, provider));
      res.json({ opcode: OPCODE.SUCCESS, methods });
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
    '/',
    Wrapper(async (req, res) => {
      const userInfo = await Method.getUserInfoByKakao(req.body);
      res.json({ opcode: OPCODE.SUCCESS, userInfo });
    })
  );

  return router;
}
