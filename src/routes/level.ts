import { Router } from 'express';
import { Level, RESULT, Wrapper } from '..';

export function getLevelRouter(): Router {
  const router = Router();

  router.get(
    '/all',
    Wrapper(async () => {
      const levels = await Level.getLevels();
      throw RESULT.SUCCESS({ details: { levels } });
    })
  );

  return router;
}
