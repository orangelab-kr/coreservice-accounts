import { Router } from 'express';
import { Referral, RESULT, Wrapper } from '..';

export function getReferralRouter(): Router {
  const router = Router();

  router.post(
    '/',
    Wrapper(async (req) => {
      await Referral.referralUser(req.user, req.body);
      throw RESULT.SUCCESS();
    })
  );

  router.get(
    '/count',
    Wrapper(async (req) => {
      const count = await Referral.getReferredUserCount(req.user);
      throw RESULT.SUCCESS({ details: { count } });
    })
  );

  return router;
}
