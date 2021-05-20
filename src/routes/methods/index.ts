import { Router } from 'express';
import { getMethodsKakaoRouter } from './kakao';

export * from './kakao';

export function getMethodsRouter(): Router {
  const router = Router();

  router.use('/kakao', getMethodsKakaoRouter());

  return router;
}
