import { Router } from 'express';
import { Point, RESULT, Wrapper } from '../../..';
import { Centercoin } from '../../../controllers/centercoin';

export function getInternalUsersCentercoinRouter(): Router {
  const router = Router();

  router.post(
    '/',
    Wrapper(async (req) => {
      const { internal, body } = req;
      const user = await Centercoin.setBalance(internal.user, body);
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.put(
    '/',
    Wrapper(async (req) => {
      const { internal, body } = req;
      const user = await Centercoin.increaseBalance(internal.user, body);
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req) => {
      const { internal, body } = req;
      const user = await Centercoin.increaseBalance(internal.user, body);
      throw RESULT.SUCCESS({ details: { user } });
    })
  );

  return router;
}
