import { Router } from 'express';
import { $, OPCODE, UserMiddleware, Wrapper } from '..';
import { License } from '../controllers';

export function getLicenseRouter(): Router {
  const router = Router();

  router.get(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const license = await License.getLicenseOrThrow(req.user);
      res.json({ opcode: OPCODE.SUCCESS, license });
    })
  );

  router.post(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const { licenseStr } = req.body;
      await $([
        License.deleteLicense(req.user),
        License.setLicense(req.user, licenseStr),
      ]);

      res.json({ opcode: OPCODE.SUCCESS });
    })
  );

  router.delete(
    '/',
    UserMiddleware(),
    Wrapper(async (req, res) => {
      const license = await License.deleteLicense(req.user);
      res.json({ opcode: OPCODE.SUCCESS, license });
    })
  );

  return router;
}
