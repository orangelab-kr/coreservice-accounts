import { Router } from 'express';
import { Point, RESULT, Wrapper } from '../../..';

export function getInternalUsersPointsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { internal, query } = req;
      const { total, points } = await Point.getPoints(internal.user, query);
      throw RESULT.SUCCESS({ details: { points, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const { internal, body } = req;
      const point = await Point.increasePoint(internal.user, body);
      throw RESULT.SUCCESS({ details: { point } });
    })
  );

  return router;
}
