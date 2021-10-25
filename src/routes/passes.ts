import { Router } from 'express';
import { $$$, Pass, PassMiddleware, RESULT, Wrapper } from '..';

export function getPassesRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, passes } = await Pass.getPasses(req.query);
      throw RESULT.SUCCESS({ details: { passes, total } });
    })
  );

  router.get(
    '/:passId',
    PassMiddleware(),
    Wrapper(async (req) => {
      const { pass } = req;
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  router.post(
    '/:passId',
    PassMiddleware(),
    Wrapper(async (req) => {
      const pass = await $$$(Pass.modifyPass(req.pass, req.body));
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  router.get(
    '/:passId/extend',
    PassMiddleware(),
    Wrapper(async (req) => {
      const pass = await $$$(Pass.extendPass(req.pass));
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  return router;
}
