import { Router } from 'express';
import { Point, RESULT, Wrapper } from '..';

export function getPointsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { user, query } = req;
      const { total, points } = await Point.getPoints(user, query);
      throw RESULT.SUCCESS({ details: { points, total } });
    })
  );

  return router;
}
