import { Router } from 'express';
import { getInternalPassProgramsRouter, getInternalUsersRouter } from '..';

export * from './passPrograms';
export * from './users';

export function getInternalRouter(): Router {
  const router = Router();

  router.use('/users', getInternalUsersRouter());
  router.use('/passPrograms', getInternalPassProgramsRouter());

  return router;
}
