import { Router } from 'express';
import { $$$, PassProgram, PassProgramMiddleware, RESULT, Wrapper } from '..';

export function getPassProgramsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, passPrograms } = await PassProgram.getPassPrograms(
        req.query
      );

      throw RESULT.SUCCESS({ details: { passPrograms, total } });
    })
  );

  router.get(
    '/:passProgramId',
    PassProgramMiddleware(),
    Wrapper(async (req) => {
      const { passProgram } = req;
      throw RESULT.SUCCESS({ details: { passProgram } });
    })
  );

  router.post(
    '/:passProgramId/purchase',
    PassProgramMiddleware(),
    Wrapper(async (req) => {
      const { passProgram, user, body } = req;
      const pass = await $$$(
        PassProgram.purchasePassProgram(user, passProgram, body)
      );

      throw RESULT.SUCCESS({ details: { pass } });
    })
  );

  return router;
}
