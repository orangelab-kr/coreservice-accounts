import { Router } from 'express';
import { Phone, RESULT, Wrapper } from '../../../..';

export function getInternalUsersMethodsPhoneRouter(): Router {
  const router = Router();

  router.get(
    '/verify',
    Wrapper(async (req) => {
      const phoneNo = String(req.query.phoneNo);
      await Phone.sendVerify(phoneNo);
      throw RESULT.SUCCESS();
    })
  );

  router.post(
    '/verify',
    Wrapper(async (req) => {
      const phone = await Phone.verifyPhone(req.body);
      throw RESULT.SUCCESS({ details: { phone } });
    })
  );

  return router;
}
