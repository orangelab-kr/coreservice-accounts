import { WrapperCallback, RESULT, Session, Wrapper } from '../../..';

export function InternalUserSessionMiddleware(): WrapperCallback {
  return Wrapper(async (req, res, next) => {
    const {
      params: { sessionId },
      internal: { user },
    } = req;

    if (!user || !sessionId) throw RESULT.CANNOT_FIND_SESSION();
    req.internal.session = await Session.getSessionOrThrow(user, sessionId);
    next();
  });
}
