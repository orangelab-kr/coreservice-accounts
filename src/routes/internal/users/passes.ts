import { Router } from 'express';
import { $$$, InternalPassMiddleware, Pass, RESULT, Wrapper } from '../../..';

export function getInternalUsersPassesRouter(): Router {
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
    InternalPassMiddleware(),
    Wrapper(async (req) => {
      const { pass } = req.internal;
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  router.post(
    '/:passId',
    InternalPassMiddleware(),
    Wrapper(async (req) => {
      const pass = await $$$(Pass.modifyPass(req.internal.pass, req.body));
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  router.get(
    '/:passId/extend',
    InternalPassMiddleware(),
    Wrapper(async (req) => {
      const { internal, query } = req;
      const free = query.free !== undefined;
      const pass = await $$$(Pass.extendPass(internal.pass, free));
      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  return router;
}
