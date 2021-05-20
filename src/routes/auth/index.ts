import { Router } from 'express';
import { Auth, OPCODE, Wrapper } from '../..';

export function getAuthRouter(): Router {
  const router = Router();

  router.post(
    '/signup',
    Wrapper(async (req, res) => {
      const user = await Auth.signupUser(req.body);
      res.json({ opcode: OPCODE.SUCCESS, user });
    })
  );

  return router;
}
