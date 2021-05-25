import { Router } from 'express';

export * from './users';

export function getInternalRouter() {
  const router = Router();

  return router;
}
