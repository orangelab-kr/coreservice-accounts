import { Router } from 'express';
import { getInternalUsersRouter } from '.';

export * from './users';

export function getInternalRouter(): Router {
  const router = Router();

  router.use('/users', getInternalUsersRouter());

  return router;
}
