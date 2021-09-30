import { Router } from 'express';
import { $$$, License, OPCODE, Wrapper } from '../../..';

export function getInternalUsersLicenseRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const { user } = req.internal;
      const license = await $$$(License.getLicense(user));
      res.json({ opcode: OPCODE.SUCCESS, license });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      await $$$([
        License.deleteLicense(req.internal.user),
        License.setLicense(req.internal.user, req.body.licenseStr),
      ]);

      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req, res) => {
      await $$$(License.deleteLicense(req.internal.user));
      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  return router;
}
