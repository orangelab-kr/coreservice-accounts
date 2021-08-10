import { Router } from 'express';
import { OPCODE, Wrapper, Phone, VerifiedPhoneInterface } from '../..';

export function getMethodsPhoneRouter(): Router {
  const router = Router();

  router.get(
    '/verify',
    Wrapper(async (req, res) => {
      console.log(req.query.phoneNo);
      const phoneNo = String(req.query.phoneNo);
      await Phone.sendVerify(phoneNo);
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.post(
    '/verify',
    Wrapper(async (req, res) => {
      const phone = await Phone.verifyPhone(req.body);
      res.json({ opcode: OPCODE.SUCCESS, phone });
    })
  );

  return router;
}
