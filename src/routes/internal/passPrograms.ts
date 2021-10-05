import { Router } from 'express';
import {
  $$$,
  InternalPassProgramMiddleware,
  PassProgram,
  RESULT,
  Wrapper,
} from '../..';

export function getInternalPassProgramsRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const { total, passPrograms } = await PassProgram.getPassPrograms(
        req.query,
        false
      );

      throw RESULT.SUCCESS({ details: { passPrograms, total } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const passProgram = await $$$(PassProgram.createPassProgram(req.body));
      throw RESULT.SUCCESS({ details: { passProgram } });
    })
  );

  router.get(
    '/:passProgramId',
    InternalPassProgramMiddleware(),
    Wrapper(async (req) => {
      const { passProgram } = req.internal;
      throw RESULT.SUCCESS({ details: { passProgram } });
    })
  );

  router.post(
    '/:passProgramId',
    InternalPassProgramMiddleware(),
    Wrapper(async (req) => {
      const passProgram = await $$$(
        PassProgram.modifyPassProgram(req.internal.passProgram, req.body)
      );

      throw RESULT.SUCCESS({ details: { passProgram } });
    })
  );

  router.delete(
    '/:passProgramId',
    InternalPassProgramMiddleware(),
    Wrapper(async (req) => {
      await $$$(PassProgram.deletePassProgram(req.internal.passProgram));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
