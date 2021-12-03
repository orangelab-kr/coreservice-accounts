import { Router } from 'express';
import { Level, Point, RESULT, Wrapper } from '..';

export function getLevelRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const [level, point] = await Promise.all([
        Level.getLevel(req.user),
        Point.getCurrentMonthPoint(req.user),
      ]);

      throw RESULT.SUCCESS({ details: { point, level } });
    })
  );

  router.get(
    '/all',
    Wrapper(async () => {
      const levels = await Level.getLevels();
      throw RESULT.SUCCESS({ details: { levels } });
    })
  );

  return router;
}
