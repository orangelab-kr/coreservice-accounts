import { Pass, RESULT, Wrapper, WrapperCallback } from '..';

export function PassMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const { passId } = req.params;
    if (!passId) throw RESULT.CANNOT_FIND_PASS_GROUP();
    req.pass = await Pass.getPassOrThrow(passId);
    next();
  });
}
