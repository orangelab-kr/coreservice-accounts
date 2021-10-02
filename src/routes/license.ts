import { Router } from 'express';
import { $$$, License, RESULT, Wrapper } from '..';

export function getLicenseRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const {
        user,
        query: { orThrow },
      } = req;

      const license = orThrow
        ? await License.getLicenseOrThrow(user)
        : await $$$(License.getLicense(user));

      throw RESULT.SUCCESS({ details: { license } });
    })
  );

  router.post(
    '/',
    Wrapper(async (req) => {
      const { licenseStr } = req.body;
      await $$$([
        License.deleteLicense(req.user),
        License.setLicense(req.user, licenseStr),
      ]);

      throw RESULT.SUCCESS();
    })
  );

  router.delete(
    '/',
    Wrapper(async (req) => {
      await $$$(License.deleteLicense(req.user));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
