import { Router } from 'express';
import { $$$, License, OPCODE, Wrapper } from '..';

export function getLicenseRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req, res) => {
      const license = await License.getLicenseOrThrow(req.user);
      res.json({ opcode: OPCODE.SUCCESS, license });
    })
  );

  router.post(
    '/',
    Wrapper(async (req, res) => {
      const { licenseStr } = req.body;
      await $$$([
        License.deleteLicense(req.user),
        License.setLicense(req.user, licenseStr),
      ]);

      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.delete(
    '/',
    Wrapper(async (req, res) => {
      const license = await License.deleteLicense(req.user);
      res.json({ opcode: OPCODE.SUCCESS, license });
    })
  );

  return router;
}
