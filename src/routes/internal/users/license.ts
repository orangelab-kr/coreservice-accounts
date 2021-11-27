import { Router } from 'express';
import { $$$, License, RESULT, Wrapper } from '../../..';

export function getInternalUsersLicenseRouter(): Router {
  const router = Router();

  router.get(
    '/',
    Wrapper(async (req) => {
      const {
        internal: { user },
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
      await $$$([
        License.deleteLicense(req.internal.user),
        License.setLicense(req.internal.user, req.body),
      ]);

      throw RESULT.SUCCESS();
    })
  );

  router.delete(
    '/',
    Wrapper(async (req) => {
      await $$$(License.deleteLicense(req.internal.user));
      throw RESULT.SUCCESS();
    })
  );

  return router;
}
