import { Router } from 'express';
import { Method } from '../../controllers';
import { UserMiddleware } from '../../middlewares';
import { $, OPCODE, Wrapper } from '../../tools';
import { getMethodsKakaoRouter } from './kakao';

export * from './kakao';

export function getMethodsRouter(): Router {
  const router = Router();
  router.use('/kakao', getMethodsKakaoRouter());

  router.get(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const methods = await $(Method.getMethods(req.user, false));
      res.json({ opcode: OPCODE.SUCCESS, methods });
    })
  );

  return router;
}
